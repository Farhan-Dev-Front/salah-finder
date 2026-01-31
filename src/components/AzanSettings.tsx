import { useState, useRef, useEffect } from "react";
import { AZAN_PRESETS, prefetchAzan, playAzan, unlockAudio, stopAzan, subscribePlaying, getPlayingId } from "../utils/playAzan";
import { PRAYER_ORDER, PRAYER_LABELS } from "../utils/prayerNames";
import { requestNotificationPermission, getNotificationPermission } from "../utils/notify";
import { usePrayerStore } from "../store/usePrayerStore";

const AzanSettings = () => {
  const azan = usePrayerStore((s) => s.azan);
  const setAzanSettings = usePrayerStore((s) => s.setAzanSettings);

  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<{ ownerId: string | null; audioId: string | null; prayer?: string | null }>({ ownerId: getPlayingId(), audioId: null, prayer: null });
  useEffect(() => subscribePlaying((v) => setPlaying(v)), []);
  const [myOwnerFull, setMyOwnerFull] = useState<string | null>(null);
  const [myOwnerHalf, setMyOwnerHalf] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() => getNotificationPermission());

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)} className="text-sm text-gray-700 underline">Settings</button>
      {open && (
        <div ref={ref} className="mt-3 p-3 rounded-lg bg-white shadow w-64">
          <div className="mb-2 text-sm font-medium">Full Azan</div>

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

          <div className="mt-3 mb-2 text-sm font-medium">Half (Short) Azan</div>

          <div className="relative">
            <select
              value={azan.halfAudioId}
              onChange={(e) => setAzanSettings({ halfAudioId: e.target.value })}
              className="w-full px-3 py-2 border rounded bg-white text-sm"
            >
              {AZAN_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-3">
            <label className="text-xs">Volume</label>
            <input type="range" min={0} max={1} step={0.05} value={azan.volume} onChange={(e) => setAzanSettings({ volume: Number(e.target.value) })} className="w-full" />
          </div>

          <div className="mt-3">
            <label className="text-sm font-medium">Auto Azan</label>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => setAzanSettings({ autoAzanEnabled: !azan.autoAzanEnabled })}
                className={`px-3 py-1 rounded ${azan.autoAzanEnabled ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                {azan.autoAzanEnabled ? "Enabled" : "Disabled"}
              </button>

              <div className="text-sm text-gray-600">Play azan automatically at prayer times</div>
            </div>
          </div>

          <div className="mt-3">
            <label className="text-sm font-medium">Notifications</label>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={async () => {
                  // request permission and persist
                  const perm = await requestNotificationPermission();
                  setNotifPerm(perm);
                  setAzanSettings({ notificationsEnabled: perm === "granted" });
                }}
                className={`px-3 py-1 rounded ${azan.notificationsEnabled ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
              >
                {azan.notificationsEnabled ? "Enabled" : (notifPerm === "denied" ? "Denied" : "Request")}
              </button>

              <div className="text-sm text-gray-600">Show notification when azan plays</div>
            </div>
          </div>

          <div className="mt-3">
            <label className="text-sm font-medium">Auto-play per prayer</label>
            <div className="mt-2 grid grid-cols-1 gap-1">
              {PRAYER_ORDER.map((p) => (
                <label key={p} className="flex items-center justify-between px-2 py-1 rounded bg-gray-50">
                  <div className="text-sm">{PRAYER_LABELS[p].en}</div>
                  <input
                    type="checkbox"
                    checked={!!azan.perPrayer?.[p]}
                    onChange={(e) => setAzanSettings({ perPrayer: { ...(azan.perPrayer || {}), [p]: e.target.checked } })}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={async () => {
                const audioId = azan.audioId;
                if (playing.ownerId !== null && playing.ownerId === myOwnerFull) {
                  stopAzan();
                  return;
                }
                if (busy) return;
                const owner = `azanset_full_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
                setMyOwnerFull(owner);
                setBusy(true);
                try {
                  if (!azan.soundUnlocked) {
                    const ok = await unlockAudio();
                    setAzanSettings({ soundUnlocked: ok });
                  }
                  await prefetchAzan(audioId);
                  await playAzan({ audioId, volume: azan.volume, ownerId: owner });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy && playing.ownerId !== myOwnerFull}
              className="px-3 py-1 rounded bg-purple-600 text-white disabled:opacity-60"
            >
              {playing.ownerId !== null && playing.ownerId === myOwnerFull ? "Stop" : (busy ? "Playing..." : "Play Full")}
            </button>

            <button
              onClick={async () => {
                const audioId = azan.halfAudioId || azan.audioId;
                if (playing.ownerId !== null && playing.ownerId === myOwnerHalf) {
                  stopAzan();
                  return;
                }
                if (busy) return;
                const owner = `azanset_half_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
                setMyOwnerHalf(owner);
                setBusy(true);
                try {
                  if (!azan.soundUnlocked) {
                    const ok = await unlockAudio();
                    setAzanSettings({ soundUnlocked: ok });
                  }
                  await prefetchAzan(audioId);
                  await playAzan({ audioId, volume: azan.volume, ownerId: owner });
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy && playing.ownerId !== myOwnerHalf}
              className="px-3 py-1 rounded bg-purple-500 text-white disabled:opacity-60"
            >
              {playing.ownerId !== null && playing.ownerId === myOwnerHalf ? "Stop" : (busy ? "Playing..." : "Play Half")}
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
