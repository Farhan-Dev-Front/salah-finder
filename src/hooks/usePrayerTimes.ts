import { useCallback, useEffect, useMemo, useState } from "react";
import { isAfter } from "date-fns";
import type { PrayerTimings } from "../store/usePrayerStore";
import { PRAYER_ORDER, type PrayerKey } from "../utils/prayerNames";
import { getNextPrayer } from "../utils/azanScheduler";

type Mode = "auto" | "manual";

const MANUAL_KEY = "prayer-manual-times";

export const usePrayerTimes = (coords: { lat: number; lon: number } | null) => {
  const [timings, setTimings] = useState<PrayerTimings>({ Fajr: "", Dhuhr: "", Asr: "", Maghrib: "", Isha: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem("prayer-mode") as Mode) || "auto");

  const loadManual = useCallback(() => {
    const raw = localStorage.getItem(MANUAL_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<PrayerTimings>;
      setTimings((t) => ({ ...t, ...parsed }));
    } catch {
      // ignore
    }
  }, []);

  const saveManual = useCallback((manual: Partial<PrayerTimings>) => {
    const merged = { ...timings, ...manual };
    localStorage.setItem(MANUAL_KEY, JSON.stringify(merged));
    setTimings(merged);
    setMode("manual");
    localStorage.setItem("prayer-mode", "manual");
  }, [timings]);

  const fetchAuto = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=2`);
      const data = await res.json();
      const t = data?.data?.timings;
      if (t) {
        const mapped: PrayerTimings = {
          Fajr: t.Fajr.split(" (")[0],
          Dhuhr: t.Dhuhr.split(" (")[0],
          Asr: t.Asr.split(" (")[0],
          Maghrib: t.Maghrib.split(" (")[0],
          Isha: t.Isha.split(" (")[0],
        };
        setTimings(mapped);
        setMode("auto");
        localStorage.setItem("prayer-mode", "auto");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to fetch prayer times");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // on mount load manual if exists
    loadManual();
  }, [loadManual]);

  useEffect(() => {
    if (mode === "auto" && coords) {
      fetchAuto(coords.lat, coords.lon);
    }
  }, [coords, fetchAuto, mode]);

  const next = useMemo(() => {
    try {
      return getNextPrayer(timings);
    } catch {
      return null;
    }
  }, [timings]);

  const current = useMemo(() => {
    const now = new Date();
    for (let i = 0; i < PRAYER_ORDER.length; i++) {
      const prayer = PRAYER_ORDER[i];
      const time = parseTime(timings[prayer]);
      if (!time) continue;
      if (isAfter(now, time)) continue;
      return i === 0 ? (PRAYER_ORDER[PRAYER_ORDER.length - 1] as PrayerKey) : (PRAYER_ORDER[i - 1] as PrayerKey);
    }
    return PRAYER_ORDER[PRAYER_ORDER.length - 1] as PrayerKey;
  }, [timings]);

  return {
    timings,
    loading,
    error,
    mode,
    setMode: (m: Mode) => { setMode(m); localStorage.setItem("prayer-mode", m); },
    saveManual,
    loadManual,
    fetchAuto,
    next,
    current,
  } as const;
};

const parseTime = (t?: string) => {
  if (!t) return null;
  try {
    // assume HH:mm
    const [hh, mm] = t.split(":").map(Number);
    const d = new Date();
    d.setHours(hh, mm, 0, 0);
    return d;
  } catch {
    return null;
  }
};

export default usePrayerTimes;
