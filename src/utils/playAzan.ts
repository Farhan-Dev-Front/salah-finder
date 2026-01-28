// src/utils/playAzan.ts

type PlayAzanOptions = {
  volume?: number; // 0..1
};

// Keep a single cached audio buffer URL per session to reduce repeated downloads
let cachedObjectUrl: string | null = null;

export const prefetchAzan = async (): Promise<void> => {
  if (cachedObjectUrl) return;
  const audioUrl = \"https://cdn.islamic.network/adhan/audio/128/adhan1.mp3\";
  const response = await fetch(audioUrl);
  if (!response.ok) throw new Error(\"Failed to download Azan audio\");
  const audioBlob = await response.blob();
  cachedObjectUrl = URL.createObjectURL(audioBlob);
};

export const playAzan = async (opts: PlayAzanOptions = {}) => {
  try {
    if (!cachedObjectUrl) {
      await prefetchAzan();
    }

    const audio = new Audio(cachedObjectUrl!);
    audio.volume = typeof opts.volume === \"number\" ? Math.min(Math.max(opts.volume, 0), 1) : 1;

    // IMPORTANT: many browsers require user gesture before first audio playback.
    await audio.play();

    return;
  } catch (error) {
    console.error(\"Azan play failed:\", error);
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
    if (ctx.state === \"suspended\") {
      await ctx.resume();
    }
    await prefetchAzan().catch(() => undefined);
    return true;
  } catch (e) {
    console.warn(\"Audio unlock failed\", e);
    return false;
  }
};
