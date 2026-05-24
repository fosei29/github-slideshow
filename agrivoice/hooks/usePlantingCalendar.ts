/**
 * usePlantingCalendar — derives optimal planting window and weather context.
 * Combines WeatherService and the user's selected region.
 */

import { useMemo } from "react";
import { useCropStore } from "@/store/cropStore";
import {
  getCurrentWeather,
  getPlantingWindow,
  getStressAlert,
  WeatherCondition,
  WeatherSnapshot,
  PlantingWindow,
  StressAlert,
} from "@/services/WeatherService";
import { GrowthStageId } from "@/types";

export interface UsePlantingCalendarResult {
  weather: WeatherSnapshot;
  plantingWindow: PlantingWindow | null;
  stressAlert: StressAlert;
}

export function usePlantingCalendar(
  currentStage?: GrowthStageId
): UsePlantingCalendarResult {
  const { selectedCrop, location } = useCropStore();

  const weather = useMemo(
    () => getCurrentWeather(location ?? undefined),
    // Recompute only when location changes (month changes are rare mid-session)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location?.country, location?.climateZone]
  );

  const plantingWindow = useMemo(() => {
    if (!location || !selectedCrop) return null;
    return getPlantingWindow(location, selectedCrop);
  }, [location, selectedCrop]);

  const stressAlert = useMemo(
    () => getStressAlert(weather.condition, currentStage ?? "", location ?? undefined),
    [weather.condition, currentStage, location]
  );

  return { weather, plantingWindow, stressAlert };
}
