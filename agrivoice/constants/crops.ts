import { Crop, CropId } from "@/types";

export const CROPS: Record<CropId, Crop> = {
  maize: {
    id: "maize",
    name_en: "Maize",
    name_sw: "Mahindi",
    name_ha: "Masara",
    icon: "🌽",
    daysToHarvest: 90,
    regions: ["West Africa", "East Africa", "Southern Africa"],
  },
  rice: {
    id: "rice",
    name_en: "Rice",
    name_sw: "Mchele",
    name_ha: "Shinkafa",
    icon: "🌾",
    daysToHarvest: 120,
    regions: ["West Africa", "East Africa"],
  },
  cassava: {
    id: "cassava",
    name_en: "Cassava",
    name_sw: "Muhogo",
    name_ha: "Rogo",
    icon: "🥔",
    daysToHarvest: 270,
    regions: ["West Africa", "East Africa", "Central Africa"],
  },
  pineapple: {
    id: "pineapple",
    name_en: "Pineapple",
    name_sw: "Nanasi",
    name_ha: "Abarba",
    icon: "🍍",
    daysToHarvest: 540,
    regions: ["West Africa", "East Africa"],
  },
  sorghum: {
    id: "sorghum",
    name_en: "Sorghum",
    name_sw: "Mtama",
    name_ha: "Dawa",
    icon: "🌿",
    daysToHarvest: 100,
    regions: ["West Africa", "East Africa", "Sahel"],
  },
};

export const CROP_LIST = Object.values(CROPS);
