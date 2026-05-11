/**
 * useAdvisory — fetches current advisory for selected crop + planting date.
 * Re-runs whenever crop, plantingDate, or language changes.
 */

import { useEffect, useCallback } from "react";
import { useCropStore } from "@/store/cropStore";
import { useAdvisoryStore } from "@/store/advisoryStore";
import { useSettingsStore } from "@/store/settingsStore";
import { getAdvisory, getStageProgress, StageProgress } from "@/services/AdvisoryEngine";
import { Advisory } from "@/types";

export interface UseAdvisoryResult {
  advice: Advisory | null;
  spokenText: string;
  audioPath: string;
  stageProgress: StageProgress | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAdvisory(): UseAdvisoryResult {
  const { selectedCrop, plantingDate, location } = useCropStore();
  const { currentAdvice, isLoading, error, setCurrentAdvice, setLoading, setError } =
    useAdvisoryStore();
  const { language } = useSettingsStore();

  const load = useCallback(() => {
    if (!selectedCrop || !plantingDate) {
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = getAdvisory(
        selectedCrop,
        plantingDate,
        language,
        location ?? undefined
      );

      if (result) {
        setCurrentAdvice(result.advisory);
      } else {
        setError("No advisory found for this crop and stage.");
      }
    } catch (e) {
      setError("Could not load advice. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedCrop, plantingDate, language, location]);

  useEffect(() => {
    load();
  }, [load]);

  // Compute derived values outside the advisory store
  let spokenText = "";
  let audioPath = "";
  let stageProgress: StageProgress | null = null;

  if (selectedCrop && plantingDate && currentAdvice) {
    const result = getAdvisory(selectedCrop, plantingDate, language, location ?? undefined);
    spokenText = result?.spokenText ?? "";
    audioPath = result?.audioPath ?? "";
    stageProgress = getStageProgress(selectedCrop, plantingDate);
  }

  return {
    advice: currentAdvice,
    spokenText,
    audioPath,
    stageProgress,
    isLoading,
    error,
    refresh: load,
  };
}
