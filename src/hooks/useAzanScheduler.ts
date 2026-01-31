import { useEffect, useMemo, useRef } from "react";
import { usePrayerStore } from "../store/usePrayerStore";
import { getNextPrayer, msUntil, prayerEventKey } from "../utils/azanScheduler";
import type { PrayerKey } from "../utils/prayerNames";
import { PRAYER_LABELS } from "../utils/prayerNames";
import { playAzan } from "../utils/playAzan";
import { showPrayerNotification } from "../utils/notify";

/**
 * In-browser azan scheduling.
 * - Uses setTimeout for exact trigger when tab is active.
 * - Also uses a 60s interval fallback (in case timers are throttled / device sleeps).
 * - Deduplicates events by a stable key stored in localStorage.
 */
export const useAzanScheduler = () => {
  const timings = usePrayerStore((s) => s.timings);
  const location = usePrayerStore((s) => s.location);
  const azan = usePrayerStore((s) => s.azan);

  const timeoutRef = useRef<number | null>(null);

  const hasTimings = useMemo(() => {
    return !!timings?.Fajr && !!timings?.Dhuhr && !!timings?.Asr && !!timings?.Maghrib && !!timings?.Isha;
  }, [timings]);

  const clearTimer = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const trigger = async (prayer: string, at: Date) => {
    const key = prayerEventKey(prayer as any, at);
    const already = localStorage.getItem("last-azan-event");
    if (already === key) return;
    localStorage.setItem("last-azan-event", key);

    const title = `Azan: ${PRAYER_LABELS[prayer as keyof typeof PRAYER_LABELS]?.en || prayer}`;
    const body = location ? `It's time for ${prayer} (${PRAYER_LABELS[prayer as keyof typeof PRAYER_LABELS]?.ar || ""}) in ${location}` : `It's time for ${prayer}`;

    if (azan.notificationsEnabled) {
      showPrayerNotification(title, body);
    }

    // Only play sound if user enabled sound globally and for this prayer
    const perPrayer = azan.perPrayer as Record<string, boolean> | undefined;
    const canPlayForPrayer = perPrayer ? perPrayer[prayer] : true;
    if (azan.soundUnlocked && canPlayForPrayer) {
      const key = prayer as PrayerKey;
      const audioId = (azan.perPrayerAudio && azan.perPrayerAudio[key]) || azan.audioId;
      const owner = `scheduler_${prayer}_${Date.now().toString(36)}`;
      await playAzan({ volume: azan.volume, audioId, ownerId: owner, prayer });
    }
  };

  const scheduleNext = () => {
    clearTimer();
    if (!azan.autoAzanEnabled) return;
    if (!hasTimings) return;

    const now = new Date();
    const next = getNextPrayer(timings, now);
    if (!next) return;

    const delay = msUntil(next.at, now);

    timeoutRef.current = window.setTimeout(() => {
      trigger(next.prayer, next.at);
      // immediately schedule the next one
      scheduleNext();
    }, delay + 250); // small buffer
  };

  // Primary scheduling effect
  useEffect(() => {
    scheduleNext();
    return () => {
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [azan.autoAzanEnabled, hasTimings, timings.Fajr, timings.Dhuhr, timings.Asr, timings.Maghrib, timings.Isha]);

  // Fallback checker (every minute)
  useEffect(() => {
    if (!azan.autoAzanEnabled) return;
    if (!hasTimings) return;

    const int = window.setInterval(() => {
      const now = new Date();
      const next = getNextPrayer(timings, now);
      if (!next) return;

      // if within the same minute, trigger.
      if (Math.abs(next.at.getTime() - now.getTime()) < 60 * 1000) {
        trigger(next.prayer, next.at);
      }
    }, 60 * 1000);

    return () => window.clearInterval(int);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [azan.autoAzanEnabled, hasTimings, timings]);

  // Re-schedule when tab becomes visible (helps after sleep)
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        scheduleNext();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [azan.autoAzanEnabled, hasTimings, timings]);
};
