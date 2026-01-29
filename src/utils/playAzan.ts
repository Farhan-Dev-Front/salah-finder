// src/utils/playAzan.ts

type PlayAzanOptions = {
  volume?: number; // 0..1
  audioId?: string; // select preset
};

export const AZAN_PRESETS = [
  { id: "adhan1", label: "Adhan 1", url: "https://cdn.islamic.network/adhan/audio/128/adhan1.mp3" },
  { id: "adhan2", label: "Adhan 2", url: "https://cdn.islamic.network/adhan/audio/128/adhan2.mp3" },
  { id: "azan_muezzin", label: "Muezzin", url: "https://cdn.islamic.network/adhan/audio/128/azan_muezzin.mp3" },
];

// cache per-audio-id
const cachedObjectUrls: Record<string, string | null> = {};

export const prefetchAzan = async (audioId = "adhan1"): Promise<void> => {
  if (cachedObjectUrls[audioId]) return;
  const preset = AZAN_PRESETS.find((p) => p.id === audioId) || AZAN_PRESETS[0];
  const response = await fetch(preset.url);
  if (!response.ok) throw new Error("Failed to download Azan audio");
  const audioBlob = await response.blob();
  cachedObjectUrls[audioId] = URL.createObjectURL(audioBlob);
};

export const playAzan = async (opts: PlayAzanOptions = {}) => {
  try {
    const audioId = opts.audioId || "adhan1";
    if (!cachedObjectUrls[audioId]) {
      await prefetchAzan(audioId);
    }

    const url = cachedObjectUrls[audioId]!;
    const audio = new Audio(url);
    audio.volume = typeof opts.volume === "number" ? Math.min(Math.max(opts.volume, 0), 1) : 1;

    // IMPORTANT: many browsers require user gesture before first audio playback.
    await audio.play();

    return;
  } catch (error) {
    console.error("Azan play failed:", error);
  }
};

/**
 * Call this on a user gesture (e.g., button click) once.
 * It unlocks the audio stack by playing a 1-frame silent audio.
 */
export const unlockAudio = async (): Promise<boolean> => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    await prefetchAzan().catch(() => undefined);
    return true;
  } catch (e) {
    console.warn("Audio unlock failed", e);
    return false;
  }
};
