/**
 * WeatherService.ts
 *
 * Rules-based weather inference for AgriVoice.
 * Operates fully offline — NO external API calls.
 *
 * Strategy:
 *   1. Derive approximate weather condition from:
 *      a. User's selected region (climate zone)
 *      b. Current month (seasonal calendar)
 *   2. Return a simple condition: "dry" | "wet" | "normal"
 *
 * This is good enough for most advisory use cases in Sub-Saharan Africa.
 * Farmers already know what season they're in; this service formalises it.
 */

import { UserLocation } from "@/types";

export type WeatherCondition = "dry" | "wet" | "normal";

// ─── Regional rain season calendars ──────────────────────────────────────────
// Months are 1-indexed (1 = January). "wet" = reliable rains expected.

type MonthRange = [number, number]; // inclusive [start, end]

interface RegionalCalendar {
  rainySeasons: MonthRange[];
  drySeasons: MonthRange[];
}

// Simplified calendar per climate zone.
// Source: FAO AgroMaps + USGS FEWS NET seasonal calendars.
const CLIMATE_CALENDARS: Record<string, RegionalCalendar> = {
  // Sahel: single short rainy season Jun–Sep
  arid: {
    rainySeasons: [[6, 9]],
    drySeasons:   [[10, 5]],
  },
  // Sudan Savanna, Sahel fringe: short rains Jun–Oct
  semi_arid: {
    rainySeasons: [[6, 10]],
    drySeasons:   [[11, 5]],
  },
  // Guinea savanna, Highlands: two rainy seasons
  sub_humid: {
    rainySeasons: [[3, 6], [9, 11]],
    drySeasons:   [[12, 2]],
  },
  // Rainforest belt: year-round rain with short dry breaks
  humid: {
    rainySeasons: [[1, 12]],
    drySeasons:   [],
  },
};

// Country → climate zone override (supplement location.climateZone)
const COUNTRY_ZONE_MAP: Record<string, string> = {
  Kenya:    "sub_humid",
  Ethiopia: "semi_arid",
  Uganda:   "sub_humid",
  Tanzania: "sub_humid",
  Nigeria:  "sub_humid",
  Ghana:    "sub_humid",
  Niger:    "arid",
  Mali:     "arid",
  Burkina:  "semi_arid",
  Senegal:  "semi_arid",
  Zimbabwe: "semi_arid",
  Zambia:   "sub_humid",
  Malawi:   "sub_humid",
};

// ─── Main export ──────────────────────────────────────────────────────────────

export interface WeatherSnapshot {
  condition: WeatherCondition;
  /** Month used for calculation (1–12) */
  month: number;
  /** Descriptive reason for UI / debug */
  description: string;
}

/**
 * Infers current weather condition from location + calendar.
 * Returns "normal" if location data is insufficient.
 */
export function getCurrentWeather(location?: UserLocation): WeatherSnapshot {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed

  if (!location) {
    return { condition: "normal", month, description: "No location data" };
  }

  const zone =
    COUNTRY_ZONE_MAP[location.country] ??
    location.climateZone ??
    "sub_humid";

  const calendar = CLIMATE_CALENDARS[zone] ?? CLIMATE_CALENDARS.sub_humid;
  const condition = inferCondition(month, calendar);

  const descriptions: Record<WeatherCondition, string> = {
    dry:    `Dry season (${zone}) — month ${month}`,
    wet:    `Rainy season (${zone}) — month ${month}`,
    normal: `Transitional season (${zone}) — month ${month}`,
  };

  return { condition, month, description: descriptions[condition] };
}

function inferCondition(
  month: number,
  calendar: RegionalCalendar
): WeatherCondition {
  const inRange = (m: number, [start, end]: MonthRange): boolean =>
    start <= end ? m >= start && m <= end : m >= start || m <= end;

  const isRainy = calendar.rainySeasons.some((r) => inRange(month, r));
  if (isRainy) return "wet";

  const isDry = calendar.drySeasons.some((d) => inRange(month, d));
  if (isDry) return "dry";

  return "normal";
}

// ─── Stress alert ─────────────────────────────────────────────────────────────

export interface StressAlert {
  hasAlert: boolean;
  alertType: "drought_risk" | "flood_risk" | "none";
  message_en: string;
  message_sw: string;
  message_ha: string;
}

/**
 * Returns a stress alert when current conditions are risky for the crop stage.
 * Used by the advisory screen to show a banner warning.
 */
export function getStressAlert(
  condition: WeatherCondition,
  cropStage: string,
  location?: UserLocation
): StressAlert {
  const criticalDryStages = ["planting", "flowering", "vegetative"];
  const criticalWetStages = ["harvest"];

  if (
    condition === "dry" &&
    criticalDryStages.includes(cropStage) &&
    location?.climateZone !== "humid"
  ) {
    return {
      hasAlert: true,
      alertType: "drought_risk",
      message_en: "⚠️ Dry season alert: water your crops if possible. This stage needs moisture.",
      message_sw: "⚠️ Tahadhari ya kiangazi: mwagilia mazao yako ikiwezekana. Hatua hii inahitaji unyevu.",
      message_ha: "⚠️ Gargadin rani: ban ruwa amfanin gonar ka idan zai yiwu. Wannan mataki yana buƙatar danshi.",
    };
  }

  if (condition === "wet" && criticalWetStages.includes(cropStage)) {
    return {
      hasAlert: true,
      alertType: "flood_risk",
      message_en: "⚠️ Heavy rains at harvest: harvest quickly to avoid mold and crop loss.",
      message_sw: "⚠️ Mvua kubwa wakati wa mavuno: vuna haraka ili kuepuka ukungu na kupoteza zao.",
      message_ha: "⚠️ Ruwan sama mai yawa a girbi: yi girbi da sauri don guje wa fungus da asarar amfanin gona.",
    };
  }

  return {
    hasAlert: false,
    alertType: "none",
    message_en: "",
    message_sw: "",
    message_ha: "",
  };
}

// ─── Planting window calculator ───────────────────────────────────────────────

export interface PlantingWindow {
  /** Optimal month to start planting (1–12) */
  optimalMonth: number;
  optimalMonthName: string;
  /** Whether the current month is a good time to plant */
  isGoodTimeToPlant: boolean;
  reason_en: string;
  reason_sw: string;
  reason_ha: string;
}

const MONTH_NAMES_EN = [
  "", "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

/**
 * Returns the optimal planting month for a crop based on climate zone.
 * Plant 2–4 weeks before rains begin so land prep is done in time.
 */
export function getPlantingWindow(
  location: UserLocation,
  cropId: string
): PlantingWindow {
  const zone = COUNTRY_ZONE_MAP[location.country] ?? location.climateZone;
  const calendar = CLIMATE_CALENDARS[zone] ?? CLIMATE_CALENDARS.sub_humid;

  // Optimal planting = 2 weeks before first rainy season starts
  const firstRainySeason = calendar.rainySeasons[0];
  const optimalMonth = firstRainySeason
    ? Math.max(1, firstRainySeason[0] - 1)
    : 4;

  const currentMonth = new Date().getMonth() + 1;
  const isGoodTimeToPlant =
    currentMonth === optimalMonth ||
    currentMonth === optimalMonth + 1 ||
    (firstRainySeason && currentMonth === firstRainySeason[0]);

  return {
    optimalMonth,
    optimalMonthName: MONTH_NAMES_EN[optimalMonth],
    isGoodTimeToPlant,
    reason_en: isGoodTimeToPlant
      ? `Now is a good time to plant ${cropId}. Rains are expected soon.`
      : `Best time to plant ${cropId} is around ${MONTH_NAMES_EN[optimalMonth]}. Wait for rains.`,
    reason_sw: isGoodTimeToPlant
      ? `Sasa ni wakati mzuri wa kupanda ${cropId}. Mvua zinatarajiwa hivi karibuni.`
      : `Wakati bora wa kupanda ${cropId} ni karibu na ${MONTH_NAMES_EN[optimalMonth]}. Subiri mvua.`,
    reason_ha: isGoodTimeToPlant
      ? `Yanzu shine lokaci mai kyau don shuka ${cropId}. Ana sa ran ruwan sama nan ba da daɗewa.`
      : `Mafi kyawun lokacin shuka ${cropId} shine a kusa da ${MONTH_NAMES_EN[optimalMonth]}. Jiri ruwan sama.`,
  };
}
