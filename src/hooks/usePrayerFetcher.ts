import axios from "axios";
import { usePrayerStore } from "../store/usePrayerStore";

export const usePrayerFetcher = () => {
  const setTimings = usePrayerStore((state) => state.setTimings);
  const setCoords = usePrayerStore((state) => state.setCoords);

  const fetchPrayerTimes = async (lat: number, lon: number) => {
    try {
      // Persist coords so Azan scheduling can continue even after reload
      setCoords({ lat: Number(lat), lon: Number(lon) });

      // User choices: Karachi method=3, Shafi Asr school=0
      const res = await axios.get(
        `https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=3&school=0`
      );

      const timings = res.data.data.timings;

      setTimings({
        Fajr: timings.Fajr,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha,
      });
    } catch (error) {
      console.error("Failed to fetch prayer times", error);
    }
  };

  return { fetchPrayerTimes };
};
