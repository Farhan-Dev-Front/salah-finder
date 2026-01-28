import { create } from \"zustand\";
import { persist } from \"zustand/middleware\";

export type PrayerTimings = {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

export type PrayerCoords = {
  lat: number | null;
  lon: number | null;
};

export type AzanSettings = {
  autoAzanEnabled: boolean;
  notificationsEnabled: boolean;
  soundUnlocked: boolean;
  volume: number; // 0..1
};

interface PrayerState {
  location: string;
  coords: PrayerCoords;
  timings: PrayerTimings;
  azan: AzanSettings;

  setLocation: (location: string) => void;
  setCoords: (coords: PrayerCoords) => void;
  setTimings: (timings: PrayerTimings) => void;

  setAzanSettings: (patch: Partial<AzanSettings>) => void;
}

export const usePrayerStore = create<PrayerState>()(
  persist(
    (set) => ({
      location: \"\",
      coords: { lat: null, lon: null },
      timings: {
        Fajr: \"\",
        Dhuhr: \"\",
        Asr: \"\",
        Maghrib: \"\",
        Isha: \"\",
      },
      azan: {
        autoAzanEnabled: false,
        notificationsEnabled: false,
        soundUnlocked: false,
        volume: 1,
      },

      setLocation: (location) => set({ location }),
      setCoords: (coords) => set({ coords }),
      setTimings: (timings) => set({ timings }),

      setAzanSettings: (patch) =>
        set((state) => ({
          azan: { ...state.azan, ...patch },
        })),
    }),
    {
      name: \"prayer-storage\",
      version: 2,
      partialize: (state) => ({
        location: state.location,
        coords: state.coords,
        timings: state.timings,
        azan: state.azan,
      }),
    }
  )
);
