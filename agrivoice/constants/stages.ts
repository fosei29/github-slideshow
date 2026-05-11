import { GrowthStage, GrowthStageId } from "@/types";

// Stage day offsets are relative to planting date.
// land_prep starts before planting (negative offset).
export const GROWTH_STAGES: Record<GrowthStageId, GrowthStage> = {
  land_prep: {
    id: "land_prep",
    name_en: "Land Preparation",
    name_sw: "Maandalizi ya Ardhi",
    name_ha: "Shirya Kasa",
    startDayOffset: -14,
    endDayOffset: -1,
    icon: "⛏️",
  },
  planting: {
    id: "planting",
    name_en: "Planting",
    name_sw: "Kupanda",
    name_ha: "Shuka",
    startDayOffset: 0,
    endDayOffset: 7,
    icon: "🌱",
  },
  vegetative: {
    id: "vegetative",
    name_en: "Vegetative Growth",
    name_sw: "Ukuaji wa Majani",
    name_ha: "Girma",
    startDayOffset: 8,
    endDayOffset: 45,
    icon: "🌿",
  },
  flowering: {
    id: "flowering",
    name_en: "Flowering",
    name_sw: "Kutoa Maua",
    name_ha: "Fure",
    startDayOffset: 46,
    endDayOffset: 70,
    icon: "🌸",
  },
  pest_disease: {
    id: "pest_disease",
    name_en: "Pest & Disease Watch",
    name_sw: "Wadudu na Magonjwa",
    name_ha: "Kwari da Cuta",
    // Overlapping window — can appear any time from vegetative onward
    startDayOffset: 8,
    endDayOffset: 85,
    icon: "🐛",
  },
  harvest: {
    id: "harvest",
    name_en: "Harvest",
    name_sw: "Mavuno",
    name_ha: "Girbi",
    startDayOffset: 86,
    endDayOffset: 999,
    icon: "🌾",
  },
};

export const STAGE_ORDER: GrowthStageId[] = [
  "land_prep",
  "planting",
  "vegetative",
  "flowering",
  "pest_disease",
  "harvest",
];
