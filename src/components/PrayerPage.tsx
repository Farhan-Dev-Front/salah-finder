import { useMemo, useState, useEffect } from "react";
import { parse, isAfter } from "date-fns";
import { usePrayerStore } from "../store/usePrayerStore";
import PrayerCard from "./PrayerCard";
import { PRAYER_ORDER } from "../utils/prayerNames";
import {
  playAzan,
  prefetchAzan,
  unlockAudio,
  stopAzan,
  subscribePlaying,
  getPlayingId,
} from "../utils/playAzan";
import AzanPanel from "./AzanPanel";
import { useRef } from "react";

const getCurrentPrayer = (timings: any) => {
  try {
    const now = new Date();
    for (let i = 0; i < PRAYER_ORDER.length; i++) {
      const name = PRAYER_ORDER[i];
      const t = parse(timings[name], "HH:mm", new Date());
      if (isAfter(t, now)) return name;
    }
  } catch {
    // ignore
  }
  return "Isha";
};

const PrayerPage = () => {
  const timings = usePrayerStore((s) => s.timings);
  const azan = usePrayerStore((s) => s.azan);

  const current = getCurrentPrayer(timings);
  const prayerList = PRAYER_ORDER;

  const [mode, setMode] = useState("auto");
  const [busy, setBusy] = useState(false);
  const [showAzanPanel, setShowAzanPanel] = useState(false);
  const [playing, setPlaying] = useState<{ ownerId: string | null; audioId: string | null; prayer?: string | null }>({ ownerId: getPlayingId(), audioId: null, prayer: null });
  useEffect(() => subscribePlaying((v) => setPlaying(v)), []);
  const [myOwnerFull, setMyOwnerFull] = useState<string | null>(null);
  const [myOwnerHalf, setMyOwnerHalf] = useState<string | null>(null);
  const azanRef = useRef<HTMLDivElement | null>(null);

  // compute next using simple search
  const next = useMemo(() => {
    try {
      const now = new Date();
      for (let i = 0; i < PRAYER_ORDER.length; i++) {
        const name = PRAYER_ORDER[i];
        const t = parse(timings[name], "HH:mm", new Date());
        if (isAfter(t, now)) return { prayer: name, at: t };
      }
      const fajr = parse(
        timings["Fajr"],
        "HH:mm",
        new Date(Date.now() + 24 * 60 * 60 * 1000),
      );
      return { prayer: "Fajr", at: fajr };
    } catch {
      return null;
    }
  }, [timings]);

  const nextAudioFull = next
    ? (azan.perPrayerAudio && azan.perPrayerAudio[next.prayer]) || azan.audioId
    : null;
  // half audio may not exist on azan object; fallback to full
  const nextAudioHalf = next
    ? ((ajan: any) =>
        (ajan.perPrayerHalfAudio && ajan.perPrayerHalfAudio[next!.prayer]) ||
        (ajan.halfAudioId as any) ||
        ajan.audioId)(azan)
    : null;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Prayer Times</h1>
          <p className="text-sm text-gray-500">
            Auto or manual prayer time mode. Smooth UI inspired by islam360.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button
           
              onClick={() => {
                setShowAzanPanel((v) => !v);
                setTimeout(() => {
                  azanRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }, 100);
              }}
               className="px-3 py-1 rounded bg-purple-600 text-white"
            >
              Azan Panel
            </button>
            {/* <button
              onClick={async () => {
                if (!next || !nextAudioFull) return;
                if (playing.ownerId !== null && playing.ownerId === myOwnerFull)
                  return stopAzan();
                const owner = `prayerpage_full_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
                setMyOwnerFull(owner);
                setBusy(true);
                try {
                  if (!azan.soundUnlocked) {
                    const ok = await unlockAudio();
                    usePrayerStore
                      .getState()
                      .setAzanSettings({ soundUnlocked: ok });
                  }
                  await prefetchAzan(nextAudioFull);
                  await playAzan({
                    audioId: nextAudioFull,
                    volume: azan.volume,
                    ownerId: owner,
                  });
                } finally {
                  setBusy(false);
                }
              }}
              className="px-3 py-1 rounded bg-purple-600 text-white"
            >
              {playing.ownerId !== null && playing.ownerId === myOwnerFull
                ? "Stop"
                : "Play Full"}
            </button>

            <button
              onClick={async () => {
                if (!next || !nextAudioHalf) return;
                if (playing.ownerId !== null && playing.ownerId === myOwnerHalf)
                  return stopAzan();
                const owner = `prayerpage_half_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
                setMyOwnerHalf(owner);
                setBusy(true);
                try {
                  if (!azan.soundUnlocked) {
                    const ok = await unlockAudio();
                    usePrayerStore
                      .getState()
                      .setAzanSettings({ soundUnlocked: ok });
                  }
                  await prefetchAzan(nextAudioHalf);
                  await playAzan({
                    audioId: nextAudioHalf,
                    volume: azan.volume,
                    ownerId: owner,
                  });
                } finally {
                  setBusy(false);
                }
              }}
              className="px-3 py-1 rounded bg-purple-500 text-white"
            >
              {playing.ownerId !== null && playing.ownerId === myOwnerHalf
                ? "Stop"
                : "Play Half"}
            </button> */}
          </div>
        </div>
      </div>

      {showAzanPanel && (
        <div ref={azanRef} className="mb-4">
          <AzanPanel />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {prayerList.map((p) => (
          <PrayerCard
            key={p}
            name={p}
            time={timings[p]}
            isCurrent={p === current}
            active={!!next && p === next.prayer}
            soundOn={!!azan.perPrayer?.[p]}
            onToggleSound={() => {
              usePrayerStore.getState().setAzanSettings({ perPrayer: { ...(azan.perPrayer || {}), [p]: !azan.perPrayer?.[p] } });
            }}
          />
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-white shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-600">Next Prayer</div>
            <div className="font-semibold">
              {next
                ? `${next.prayer} • ${next.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs">Mode</div>
            <div className="mt-1">
              <button
                onClick={() => setMode("auto")}
                className={`px-3 py-1 rounded ${mode === "auto" ? "bg-purple-600 text-white" : "bg-white"}`}
              >
                Auto
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`ml-2 px-3 py-1 rounded ${mode === "manual" ? "bg-purple-600 text-white" : "bg-white"}`}
              >
                Manual
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerPage;
