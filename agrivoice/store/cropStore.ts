import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CropId, UserLocation } from "@/types";

interface CropStore {
  selectedCrop: CropId | null;
  plantingDate: string | null;
  location: UserLocation | null;
  setSelectedCrop: (crop: CropId) => void;
  setPlantingDate: (date: string) => void;
  setLocation: (loc: UserLocation) => void;
  resetCrop: () => void;
}

export const useCropStore = create<CropStore>()(
  persist(
    (set) => ({
      selectedCrop: null,
      plantingDate: null,
      location: null,

      setSelectedCrop: (crop) => set({ selectedCrop: crop }),
      setPlantingDate: (date) => set({ plantingDate: date }),
      setLocation: (loc) => set({ location: loc }),

      // Called when user switches to a new crop — clears planting date
      resetCrop: () => set({ selectedCrop: null, plantingDate: null }),
    }),
    {
      name: "agrivoice-crop",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
