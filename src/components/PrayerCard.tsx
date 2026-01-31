import { PRAYER_LABELS, type PrayerKey } from "../utils/prayerNames";
import { formatTo12Hour } from "../utils/formatTime";
import { AZAN_PRESETS, prefetchAzan, playAzan, unlockAudio, stopAzan, subscribePlaying, getPlayingId } from "../utils/playAzan";
import { usePrayerStore } from "../store/usePrayerStore";
import { useState, useEffect } from "react";

type DropdownProps = {
  current: string;
  onSelect: (id: string) => void;
  dark?: boolean;
};

const Dropdown = ({ current, onSelect, dark }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${dark ? "bg-white/10 text-white" : "bg-white text-gray-800"}`}
      >
        <span>{AZAN_PRESETS.find((p) => p.id === current)?.label || "Select"}</span>
        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd"/></svg>
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-48 bg-white border rounded shadow z-30">
          {AZAN_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => { onSelect(p.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm ${current === p.id ? "bg-purple-50 text-purple-700" : "text-gray-700"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

type Props = {
  name: PrayerKey;
  time?: string;
  active?: boolean; // upcoming
  isCurrent?: boolean; // currently in progress
  onToggleSound?: () => void;
  soundOn?: boolean;
};

const PrayerCard = ({ name, time, active, isCurrent, onToggleSound, soundOn }: Props) => {
  const azan = usePrayerStore((s) => s.azan);
  const setAzanSettings = usePrayerStore((s) => s.setAzanSettings);

  const currentAudio = azan.perPrayerAudio ? azan.perPrayerAudio[name] : azan.audioId;

  const handleSelect = async (id: string) => {
    setAzanSettings({ perPrayerAudio: { ...(azan.perPrayerAudio || {}), [name]: id } });
    // prefetch the selected audio so sample play is quick
    prefetchAzan(id).catch(() => {});
  };

  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<{ ownerId: string | null; audioId: string | null }>({ ownerId: getPlayingId(), audioId: null });
  useEffect(() => subscribePlaying((v) => setPlaying(v)), []);
  const [myOwner, setMyOwner] = useState<string | null>(null);

  const handlePlaySample = async () => {
    if (playing.ownerId !== null && playing.ownerId === myOwner) return stopAzan();
    if (busy) return;
    const owner = `prayercard_${name}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
    setMyOwner(owner);
    setBusy(true);
    try {
      if (!azan.soundUnlocked) {
        const ok = await unlockAudio();
        setAzanSettings({ soundUnlocked: ok });
      }
      await prefetchAzan(currentAudio);
      await playAzan({ audioId: currentAudio, volume: azan.volume, ownerId: owner });
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl shadow-md ${active ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white" : "bg-white text-gray-800"}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{PRAYER_LABELS[name].en}</div>
          <div className="text-xs opacity-80">{PRAYER_LABELS[name].ar}</div>
        </div>
        <div className="text-sm font-medium">{time ? formatTo12Hour(time) : "--:--"}</div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-xs opacity-70">{isCurrent ? "Now" : ""}</div>
          {active && !isCurrent && (
            <div className="ml-2 text-xs px-2 py-1 rounded bg-white/10">Next</div>
          )}
        </div>

        <div className="flex items-center gap-2 relative">
          <Dropdown current={currentAudio} onSelect={handleSelect} dark={!!active} />
              <button onClick={handlePlaySample} disabled={busy && (playing.ownerId !== myOwner)} className="text-sm px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-60">{playing.ownerId !== null && playing.ownerId === myOwner ? "Stop" : (busy ? "Playing..." : "Play Full")}</button>
          {onToggleSound && (
            <button onClick={onToggleSound} className="text-sm px-2 py-1 rounded bg-white/10">
              {soundOn ? "🔊" : "🔇"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrayerCard;
