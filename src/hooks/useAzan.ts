import { useEffect, useState } from "react";

import { PRAYER_ORDER, type PrayerKey } from "../utils/prayerNames";
import { AZAN_PRESETS } from "../utils/playAzan";
import { usePrayerStore } from "../store/usePrayerStore";

// Module-level singletons so hook can be used anywhere but share one audio instance
let audioEl: HTMLAudioElement | null = null;
const objectUrlCache: Record<string, string> = {};
let managerInitialized = false;
let subscribers: Array<(v: boolean) => void> = [];

const notifyPlaying = (v: boolean) => {
  subscribers.forEach((cb) => cb(v));
};

const fetchPresetUrl = async (audioId: string) => {
  if (objectUrlCache[audioId]) return objectUrlCache[audioId];
  const preset = AZAN_PRESETS.find((p) => p.id === audioId) || AZAN_PRESETS[0];
  const res = await fetch(preset.url);
  if (!res.ok) throw new Error("Failed to download azan");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  objectUrlCache[audioId] = url;
  return url;
};

const ensureAudio = () => {
  if (!audioEl) audioEl = new Audio();
  return audioEl;
};

export const useAzan = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const sub = (v: boolean) => setIsPlaying(v);
    subscribers.push(sub);
    return () => {
      subscribers = subscribers.filter((s) => s !== sub);
    };
  }, []);

  useEffect(() => {
    if (managerInitialized) return;
    managerInitialized = true;

    const tick = async () => {
      try {
        const state = usePrayerStore.getState();
        const timings = state.timings;
        const azan = state.azan;
        if (!azan.autoAzanEnabled) return;

        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = now.getSeconds();
        const hm = `${hh}:${mm}`;

        // exact minute only
        if (ss !== 0) return;

        for (const prayer of PRAYER_ORDER) {
          const t = timings[prayer as PrayerKey];
          if (!t) continue;
          if (t === hm) {
            const per = azan.perPrayer || {};
            if (per[prayer as PrayerKey] === false) continue;

            const dateKey = `${new Date().toISOString().slice(0, 10)}|${prayer}`;
            const last = localStorage.getItem("last-azan-trigger");
            if (last === dateKey) continue;

            const audioId = (azan.perPrayerAudio && azan.perPrayerAudio[prayer as PrayerKey]) || azan.audioId;
            try {
              const url = await fetchPresetUrl(audioId);
              const audio = ensureAudio();
              if (audio.src !== url) audio.src = url;
              audio.volume = azan.volume ?? 1;
              await audio.play();
              notifyPlaying(true);
              audio.onended = () => notifyPlaying(false);
              localStorage.setItem("last-azan-trigger", dateKey);
            } catch (e) {
              console.warn("Auto azan play failed", e);
            }
          }
        }
      } catch (err) {
        console.debug("useAzan tick error", err);
      }
    };

    const iv = window.setInterval(tick, 1000);
    const midnightCheck = window.setInterval(() => {
      const last = localStorage.getItem("last-azan-trigger");
      if (!last) return;
      const [date] = last.split("|");
      const today = new Date().toISOString().slice(0, 10);
      if (date !== today) localStorage.removeItem("last-azan-trigger");
    }, 60_000);

    return () => {
      window.clearInterval(iv);
      window.clearInterval(midnightCheck);
    };
  }, []);

  const playAzanFor = async (prayerName: string) => {
    const state = usePrayerStore.getState();
    const azan = state.azan;
    const audioId = (azan.perPrayerAudio && azan.perPrayerAudio[prayerName as PrayerKey]) || azan.audioId;
    try {
      const url = await fetchPresetUrl(audioId);
      const audio = ensureAudio();
      if (audio.src !== url) audio.src = url;
      audio.volume = azan.volume ?? 1;
      await audio.play();
      notifyPlaying(true);
      audio.onended = () => notifyPlaying(false);
    } catch (e) {
      console.warn("Play azan failed", e);
    }
  };

  const stopAzan = () => {
    if (!audioEl) return;
    try {
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch (err) {
      console.debug("stopAzan error", err);
    }
    notifyPlaying(false);
  };

  return {
    playAzan: playAzanFor,
    stopAzan,
    isPlaying,
  } as const;
};

export default useAzan;
