import { UserLocation } from "@/types";

export interface RegionOption {
  label: string;
  flag: string;
  value: UserLocation;
}

export const REGIONS: RegionOption[] = [
  {
    label: "Kenya / East Africa",
    flag: "🇰🇪",
    value: { country: "Kenya", region: "East Africa", climateZone: "sub_humid" },
  },
  {
    label: "Tanzania / East Africa",
    flag: "🇹🇿",
    value: { country: "Tanzania", region: "East Africa", climateZone: "sub_humid" },
  },
  {
    label: "Uganda / East Africa",
    flag: "🇺🇬",
    value: { country: "Uganda", region: "East Africa", climateZone: "sub_humid" },
  },
  {
    label: "Ethiopia / Horn of Africa",
    flag: "🇪🇹",
    value: { country: "Ethiopia", region: "East Africa", climateZone: "semi_arid" },
  },
  {
    label: "Nigeria / West Africa",
    flag: "🇳🇬",
    value: { country: "Nigeria", region: "West Africa", climateZone: "sub_humid" },
  },
  {
    label: "Ghana / West Africa",
    flag: "🇬🇭",
    value: { country: "Ghana", region: "West Africa", climateZone: "sub_humid" },
  },
  {
    label: "Senegal / West Africa",
    flag: "🇸🇳",
    value: { country: "Senegal", region: "West Africa", climateZone: "semi_arid" },
  },
  {
    label: "Burkina Faso / Sahel",
    flag: "🇧🇫",
    value: { country: "Burkina", region: "Sahel", climateZone: "semi_arid" },
  },
  {
    label: "Niger / Sahel",
    flag: "🇳🇪",
    value: { country: "Niger", region: "Sahel", climateZone: "arid" },
  },
  {
    label: "Mali / Sahel",
    flag: "🇲🇱",
    value: { country: "Mali", region: "Sahel", climateZone: "arid" },
  },
  {
    label: "Zambia / Southern Africa",
    flag: "🇿🇲",
    value: { country: "Zambia", region: "Southern Africa", climateZone: "sub_humid" },
  },
  {
    label: "Zimbabwe / Southern Africa",
    flag: "🇿🇼",
    value: { country: "Zimbabwe", region: "Southern Africa", climateZone: "semi_arid" },
  },
];
