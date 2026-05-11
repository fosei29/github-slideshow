import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SupportedLanguage } from "@/types";

interface SettingsStore {
  language: SupportedLanguage;
  textSize: "normal" | "large" | "xlarge";
  offlineMode: boolean;
  lastSyncAt: string | null;
  setLanguage: (lang: SupportedLanguage) => void;
  setTextSize: (size: "normal" | "large" | "xlarge") => void;
  setOfflineMode: (v: boolean) => void;
  setLastSyncAt: (date: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      language: "en",
      textSize: "large",    // default large for low-literacy users
      offlineMode: true,
      lastSyncAt: null,

      setLanguage: (lang) => set({ language: lang }),
      setTextSize: (size) => set({ textSize: size }),
      setOfflineMode: (v) => set({ offlineMode: v }),
      setLastSyncAt: (date) => set({ lastSyncAt: date }),
    }),
    {
      name: "agrivoice-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
