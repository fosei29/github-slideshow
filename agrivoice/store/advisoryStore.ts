import { create } from "zustand";
import { Advisory, GrowthStageId } from "@/types";

interface AdvisoryStore {
  currentStage: GrowthStageId | null;
  currentAdvice: Advisory | null;
  isLoading: boolean;
  error: string | null;
  setCurrentStage: (stage: GrowthStageId) => void;
  setCurrentAdvice: (advice: Advisory) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
}

export const useAdvisoryStore = create<AdvisoryStore>()((set) => ({
  currentStage: null,
  currentAdvice: null,
  isLoading: false,
  error: null,

  setCurrentStage: (stage) => set({ currentStage: stage }),
  setCurrentAdvice: (advice) => set({ currentAdvice: advice }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (msg) => set({ error: msg }),
}));
