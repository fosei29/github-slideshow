// ─── Core domain types for AgriVoice ─────────────────────────────────────────

export type CropId = "maize" | "rice" | "cassava" | "pineapple" | "sorghum";

export type GrowthStageId =
  | "land_prep"
  | "planting"
  | "vegetative"
  | "flowering"
  | "pest_disease"
  | "harvest";

export type SupportedLanguage = "en" | "sw" | "ha";

// ─── Crop metadata ────────────────────────────────────────────────────────────

export interface Crop {
  id: CropId;
  name_en: string;
  name_sw: string;
  name_ha: string;
  icon: string;               // emoji fallback for icon-only UI
  daysToHarvest: number;      // typical days from planting
  regions: string[];          // e.g. ["West Africa", "East Africa"]
}

// ─── Growth stage ─────────────────────────────────────────────────────────────

export interface GrowthStage {
  id: GrowthStageId;
  name_en: string;
  name_sw: string;
  name_ha: string;
  /** Days from planting when this stage typically begins (0 = land prep) */
  startDayOffset: number;
  endDayOffset: number;
  icon: string;
}

// ─── Advisory content (one record per crop × stage) ──────────────────────────

export interface Advisory {
  id: string;                 // e.g. "maize_planting"
  crop: CropId;
  stage: GrowthStageId;
  advice_en: string;
  advice_sw: string;
  advice_ha: string;
  /** Relative path inside app bundle, e.g. "audio/maize_planting_en.mp3" */
  audio_url_en: string;
  audio_url_sw: string;
  audio_url_ha: string;
  dosageInfo?: DosageInfo[];
  weatherTrigger?: WeatherTrigger;
  updatedAt: string;          // ISO date, for delta sync
}

// ─── Dosage / input recommendation ────────────────────────────────────────────

export interface DosageInfo {
  input: string;              // e.g. "DAP fertilizer"
  quantity: string;           // e.g. "50 kg/acre"
  timing: string;             // e.g. "At planting"
  notes_en?: string;
  notes_sw?: string;
  notes_ha?: string;
}

// ─── Weather-conditioned advice ───────────────────────────────────────────────

export interface WeatherTrigger {
  condition: "dry" | "wet" | "normal";
  modifiedAdvice_en: string;
  modifiedAdvice_sw: string;
  modifiedAdvice_ha: string;
}

// ─── Pest / Disease record ────────────────────────────────────────────────────

export interface PestRecord {
  id: string;
  crop: CropId;
  name_en: string;
  name_sw: string;
  name_ha: string;
  symptoms_en: string;
  symptoms_sw: string;
  symptoms_ha: string;
  treatment_en: string;
  treatment_sw: string;
  treatment_ha: string;
  /** TFLite class label that maps to this pest */
  modelLabel: string;
  imageRef?: string;
}

// ─── App state types (for Zustand stores) ─────────────────────────────────────

export interface CropState {
  selectedCrop: CropId | null;
  plantingDate: string | null;   // ISO date string
  location: UserLocation | null;
  setSelectedCrop: (crop: CropId) => void;
  setPlantingDate: (date: string) => void;
  setLocation: (loc: UserLocation) => void;
}

export interface AdvisoryState {
  currentStage: GrowthStageId | null;
  currentAdvice: Advisory | null;
  isLoading: boolean;
  error: string | null;
  setCurrentStage: (stage: GrowthStageId) => void;
  setCurrentAdvice: (advice: Advisory) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
}

export interface SettingsState {
  language: SupportedLanguage;
  textSize: "normal" | "large" | "xlarge";
  offlineMode: boolean;
  lastSyncAt: string | null;
  setLanguage: (lang: SupportedLanguage) => void;
  setTextSize: (size: "normal" | "large" | "xlarge") => void;
  setOfflineMode: (v: boolean) => void;
  setLastSyncAt: (date: string) => void;
}

// ─── Location (minimal — no GPS required) ────────────────────────────────────

export interface UserLocation {
  country: string;
  region: string;
  /** Rough climate zone derived from country/region */
  climateZone: "arid" | "semi_arid" | "sub_humid" | "humid";
}

// ─── Voice UI state ───────────────────────────────────────────────────────────

export type VoiceStatus =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error";

// ─── Sync manifest (for delta sync) ──────────────────────────────────────────

export interface SyncManifest {
  version: number;
  updatedAt: string;
  advisories: { id: string; updatedAt: string }[];
  pests: { id: string; updatedAt: string }[];
}
