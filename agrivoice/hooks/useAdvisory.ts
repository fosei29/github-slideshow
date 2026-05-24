/**
 * useAdvisory — fetches current advisory for selected crop + planting date.
 * Re-runs whenever crop, plantingDate, or language changes.
 *
 * Fix: previously called getAdvisory() twice per render (once in load(),
 * once outside for derived values). Now stores all derived values in a
 * single ref so the engine runs exactly once per dependency change.
 */

import { useEffect, useCallback, useRef } from "react";
import { useCropStore } from "@/store/cropStore";
import { useAdvisoryStore } from "@/store/advisoryStore";
import { useSettingsStore } from "@/store/settingsStore";
import {
  getAdvisory,
  getStageProgress,
  AdvisoryResult,
  StageProgress,
} from "@/services/AdvisoryEngine";
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

  // Single ref holds the full engine result — avoids re-running the engine
  const engineResultRef = useRef<AdvisoryResult | null>(null);
  const stageProgressRef = useRef<StageProgress | null>(null);

  const load = useCallback(() => {
    if (!selectedCrop || !plantingDate) {
      setError(null);
      engineResultRef.current = null;
      stageProgressRef.current = null;
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
        engineResultRef.current = result;
        stageProgressRef.current = getStageProgress(selectedCrop, plantingDate);
        setCurrentAdvice(result.advisory);
      } else {
        engineResultRef.current = null;
        stageProgressRef.current = null;
        setError("No advisory found for this crop and stage.");
      }
    } catch {
      setError("Could not load advice. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedCrop, plantingDate, language, location, setCurrentAdvice, setLoading, setError]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    advice: currentAdvice,
    spokenText: engineResultRef.current?.spokenText ?? "",
    audioPath: engineResultRef.current?.audioPath ?? "",
    stageProgress: stageProgressRef.current,
    isLoading,
    error,
    refresh: load,
  };
}
