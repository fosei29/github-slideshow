/**
 * AdvisoryEngine.ts
 *
 * Rules-based crop advisory engine for AgriVoice.
 * Operates 100% offline using bundled JSON data.
 *
 * Inputs:  crop id, planting date, user location, language preference
 * Outputs: Advisory record for the current growth stage
 */

import { differenceInDays, parseISO } from "date-fns";
import {
  Advisory,
  CropId,
  GrowthStageId,
  SupportedLanguage,
  UserLocation,
  PestRecord,
} from "@/types";
import { GROWTH_STAGES, STAGE_ORDER } from "@/constants/stages";

// ─── Static data (bundled at build time) ──────────────────────────────────────
// JSON imports are resolved at Metro bundle time; no network calls.

import MAIZE_DATA from "@/data/crops/maize.json";
import RICE_DATA from "@/data/crops/rice.json";
import CASSAVA_DATA from "@/data/crops/cassava.json";
import PINEAPPLE_DATA from "@/data/crops/pineapple.json";
import SORGHUM_DATA from "@/data/crops/sorghum.json";

import MAIZE_PESTS from "@/data/pests/maize_pests.json";
import RICE_PESTS from "@/data/pests/rice_pests.json";
import CASSAVA_PESTS from "@/data/pests/cassava_pests.json";
import PINEAPPLE_PESTS from "@/data/pests/pineapple_pests.json";
import SORGHUM_PESTS from "@/data/pests/sorghum_pests.json";

const CROP_ADVISORIES: Record<string, Advisory[]> = {
  maize:    MAIZE_DATA as Advisory[],
  rice:     RICE_DATA as Advisory[],
  cassava:  CASSAVA_DATA as Advisory[],
  pineapple: PINEAPPLE_DATA as Advisory[],
  sorghum:  SORGHUM_DATA as Advisory[],
};

const PEST_RECORDS: Record<string, PestRecord[]> = {
  maize:    MAIZE_PESTS as PestRecord[],
  rice:     RICE_PESTS as PestRecord[],
  cassava:  CASSAVA_PESTS as PestRecord[],
  pineapple: PINEAPPLE_PESTS as PestRecord[],
  sorghum:  SORGHUM_PESTS as PestRecord[],
};

// ─── Stage detection ──────────────────────────────────────────────────────────

/**
 * Determines the primary growth stage given days since planting.
 * Uses the stage day-offset windows defined in constants/stages.ts.
 * Pineapple has a much longer cycle (540 days) so we scale proportionally.
 */
export function detectGrowthStage(
  crop: CropId,
  plantingDate: string
): GrowthStageId {
  const today = new Date();
  const planted = parseISO(plantingDate);
  const daysSincePlanting = differenceInDays(today, planted);

  // Scale day offsets for long-cycle crops (cassava = 270d, pineapple = 540d)
  const scaleFactor = getCropScaleFactor(crop);

  // Walk stages in order; return the latest one that has started
  let detectedStage: GrowthStageId = "land_prep";

  for (const stageId of STAGE_ORDER) {
    if (stageId === "pest_disease") continue; // handled separately

    const stage = GROWTH_STAGES[stageId];
    const scaledStart = Math.round(stage.startDayOffset * scaleFactor);

    if (daysSincePlanting >= scaledStart) {
      detectedStage = stageId;
    }
  }

  return detectedStage;
}

/**
 * Scale factors map each crop's typical harvest day to the maize baseline (90d).
 * This lets us reuse the same stage offset table for all crops.
 */
function getCropScaleFactor(crop: CropId): number {
  const HARVEST_DAYS: Record<CropId, number> = {
    maize: 90,
    rice: 120,
    cassava: 270,
    pineapple: 540,
    sorghum: 100,
  };
  return HARVEST_DAYS[crop] / 90;
}

// ─── Main advisory lookup ─────────────────────────────────────────────────────

export interface AdvisoryResult {
  advisory: Advisory;
  stage: GrowthStageId;
  /** Text already selected for the active language — ready to pass to TTS */
  spokenText: string;
  /** Audio file path for the active language */
  audioPath: string;
  /** Days since planting, for UI display */
  daysSincePlanting: number;
}

/**
 * Primary entry point for the advisory engine.
 * Returns the advisory and pre-selected text/audio for the current language.
 *
 * @param crop        - Selected crop id
 * @param plantingDate - ISO date string (YYYY-MM-DD)
 * @param language    - Active UI language ("en" | "sw" | "ha")
 * @param location    - User's region (used for weather-conditioned advice)
 */
export function getAdvisory(
  crop: CropId,
  plantingDate: string,
  language: SupportedLanguage,
  location?: UserLocation
): AdvisoryResult | null {
  const stage = detectGrowthStage(crop, plantingDate);
  const advisories = CROP_ADVISORIES[crop];

  if (!advisories) return null;

  const advisory = advisories.find((a) => a.stage === stage);
  if (!advisory) return null;

  // Apply weather-conditioned override when location climate zone is dry/arid
  const effectiveAdvisory = applyWeatherOverride(advisory, location);

  const spokenText = selectText(effectiveAdvisory, language);
  const audioPath = selectAudioPath(effectiveAdvisory, language);

  const daysSincePlanting = differenceInDays(
    new Date(),
    parseISO(plantingDate)
  );

  return { advisory: effectiveAdvisory, stage, spokenText, audioPath, daysSincePlanting };
}

// ─── Language selection helpers ───────────────────────────────────────────────

export function selectText(
  advisory: Advisory,
  language: SupportedLanguage
): string {
  switch (language) {
    case "sw":
      return advisory.advice_sw;
    case "ha":
      return advisory.advice_ha;
    default:
      return advisory.advice_en;
  }
}

export function selectAudioPath(
  advisory: Advisory,
  language: SupportedLanguage
): string {
  switch (language) {
    case "sw":
      return advisory.audio_url_sw;
    case "ha":
      return advisory.audio_url_ha;
    default:
      return advisory.audio_url_en;
  }
}

// ─── Weather override ─────────────────────────────────────────────────────────

/**
 * If the user's climate zone is "arid" or "semi_arid" AND the advisory has a
 * "dry" weather trigger, inject the modified text into a cloned advisory.
 * This is a simple rules override — no external weather API needed.
 */
function applyWeatherOverride(
  advisory: Advisory,
  location?: UserLocation
): Advisory {
  if (!location || !advisory.weatherTrigger) return advisory;

  const isDry =
    location.climateZone === "arid" || location.climateZone === "semi_arid";

  if (isDry && advisory.weatherTrigger.condition === "dry") {
    return {
      ...advisory,
      advice_en: advisory.weatherTrigger.modifiedAdvice_en,
      advice_sw: advisory.weatherTrigger.modifiedAdvice_sw,
      advice_ha: advisory.weatherTrigger.modifiedAdvice_ha,
    };
  }

  return advisory;
}

// ─── Pest advisory lookup ─────────────────────────────────────────────────────

export interface PestAdvisoryResult {
  pest: PestRecord;
  treatmentText: string;
  symptomsText: string;
}

/**
 * Looks up pest/disease info by the TFLite model label.
 * Returns treatment and symptoms in the active language.
 */
export function getPestAdvisory(
  crop: CropId,
  modelLabel: string,
  language: SupportedLanguage
): PestAdvisoryResult | null {
  const pests = PEST_RECORDS[crop];
  if (!pests) return null;

  const pest = pests.find((p) => p.modelLabel === modelLabel);
  if (!pest) return null;

  const treatmentText = selectPestText(pest, "treatment", language);
  const symptomsText = selectPestText(pest, "symptoms", language);

  return { pest, treatmentText, symptomsText };
}

function selectPestText(
  pest: PestRecord,
  field: "treatment" | "symptoms",
  language: SupportedLanguage
): string {
  if (field === "treatment") {
    return language === "sw"
      ? pest.treatment_sw
      : language === "ha"
      ? pest.treatment_ha
      : pest.treatment_en;
  }
  return language === "sw"
    ? pest.symptoms_sw
    : language === "ha"
    ? pest.symptoms_ha
    : pest.symptoms_en;
}

// ─── Stage progress (for UI progress bar) ────────────────────────────────────

export interface StageProgress {
  currentStage: GrowthStageId;
  stageIndex: number;      // 0-based index in STAGE_ORDER (excl. pest_disease)
  totalStages: number;
  percentComplete: number; // 0-100, across entire crop lifecycle
  daysSincePlanting: number;
}

export function getStageProgress(
  crop: CropId,
  plantingDate: string
): StageProgress {
  const daysSincePlanting = differenceInDays(
    new Date(),
    parseISO(plantingDate)
  );
  const scaleFactor = getCropScaleFactor(crop);

  const visibleStages = STAGE_ORDER.filter((s) => s !== "pest_disease");
  const currentStage = detectGrowthStage(crop, plantingDate);
  const stageIndex = visibleStages.indexOf(currentStage);

  // Total lifecycle = harvest end offset × scale factor
  const harvestEnd = GROWTH_STAGES.harvest.startDayOffset * scaleFactor;
  const percentComplete = Math.min(
    100,
    Math.round((daysSincePlanting / harvestEnd) * 100)
  );

  return {
    currentStage,
    stageIndex,
    totalStages: visibleStages.length,
    percentComplete,
    daysSincePlanting,
  };
}

// ─── Voice command parser ─────────────────────────────────────────────────────

/**
 * Parses simple spoken commands into app intents.
 * Supports English, Swahili, and Hausa keyword matching.
 * This keeps STT processing offline without NLU dependencies.
 */
export type VoiceIntent =
  | "get_advice"
  | "next_stage"
  | "prev_stage"
  | "identify_pest"
  | "change_language_en"
  | "change_language_sw"
  | "change_language_ha"
  | "unknown";

const INTENT_KEYWORDS: Record<VoiceIntent, string[]> = {
  get_advice:         ["advice", "help", "what do i do", "ushauri", "amua", "shawarar"],
  next_stage:         ["next", "forward", "inayofuata", "mbele", "gaba"],
  prev_stage:         ["back", "previous", "iliyopita", "nyuma", "baya"],
  identify_pest:      ["pest", "disease", "insect", "bug", "wadudu", "ugonjwa", "kwari", "cuta"],
  change_language_en: ["english", "kiingereza"],
  change_language_sw: ["swahili", "kiswahili"],
  change_language_ha: ["hausa"],
  unknown:            [],
};

export function parseVoiceCommand(transcript: string): VoiceIntent {
  const lower = transcript.toLowerCase().trim();

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === "unknown") continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return intent as VoiceIntent;
    }
  }

  return "unknown";
}
