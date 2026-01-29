import { useEffect, useRef, useState } from "react";

export default function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const el = audioRef.current;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, []);

  const play = async (url: string) => {
    if (!audioRef.current) audioRef.current = new Audio();
    if (currentUrl !== url) {
      audioRef.current.src = url;
      setCurrentUrl(url);
    }
    try {
      await audioRef.current.play();
    } catch (err) {
      console.warn("Audio play failed", err);
    }
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  const stop = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  return { play, pause, stop, isPlaying, currentUrl } as const;
}
