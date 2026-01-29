import { useState, useRef } from "react";
import { AZAN_PRESETS, prefetchAzan, playAzan, unlockAudio } from "../utils/playAzan";
import { usePrayerStore } from "../store/usePrayerStore";

const AzanSettings = () => {
  const azan = usePrayerStore((s) => s.azan);
  const setAzanSettings = usePrayerStore((s) => s.setAzanSettings);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="text-sm text-gray-700 underline">Settings</button>
      {open && (
        <div ref={ref} className="mt-3 p-3 rounded-lg bg-white shadow w-64">
          <div className="mb-2 text-sm font-medium">Azan Preset</div>

          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 border rounded bg-white text-sm"
            >
              <span>{AZAN_PRESETS.find((p) => p.id === azan.audioId)?.label || "Select Azan"}</span>
              <svg className="w-4 h-4 ml-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="absolute left-0 mt-1 w-full bg-white border rounded shadow z-20">
              {AZAN_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setAzanSettings({ audioId: p.id }); prefetchAzan(p.id).catch(() => {}); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm ${azan.audioId === p.id ? "bg-purple-50 text-purple-700" : "text-gray-700"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs">Volume</label>
            <input type="range" min={0} max={1} step={0.05} value={azan.volume} onChange={(e) => setAzanSettings({ volume: Number(e.target.value) })} className="w-full" />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                try {
                  if (!azan.soundUnlocked) {
                    const ok = await unlockAudio();
                    setAzanSettings({ soundUnlocked: ok });
                  }
                  await prefetchAzan(azan.audioId);
                  await playAzan({ audioId: azan.audioId, volume: azan.volume });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-60"
            >
              {busy ? "Playing..." : "Play"}
            </button>
            <button
              onClick={async () => {
                const ok = await unlockAudio();
                setAzanSettings({ soundUnlocked: ok });
              }}
              className="px-3 py-1 rounded border"
            >
              Unlock
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AzanSettings;
