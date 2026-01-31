import { useMemo, useState, useEffect } from "react";
import { usePrayerStore } from "../store/usePrayerStore";
import { PRAYER_LABELS, PRAYER_ORDER } from "../utils/prayerNames";
import { playAzan, unlockAudio, AZAN_PRESETS, prefetchAzan, stopAzan, subscribePlaying, getPlayingId } from "../utils/playAzan";
import { getNotificationPermission, isNotificationSupported, requestNotificationPermission } from "../utils/notify";
import { getNextPrayer } from "../utils/azanScheduler";

const AzanPanel = () => {
  const timings = usePrayerStore((s) => s.timings);
  const location = usePrayerStore((s) => s.location);
  const azan = usePrayerStore((s) => s.azan);
  const setAzanSettings = usePrayerStore((s) => s.setAzanSettings);

  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<{ ownerId: string | null; audioId: string | null }>({ ownerId: getPlayingId(), audioId: null });
  useEffect(() => subscribePlaying((v) => setPlaying(v)), []);
  const [myOwnerMain, setMyOwnerMain] = useState<string | null>(null);
  const [myOwnerPreset, setMyOwnerPreset] = useState<string | null>(null);

  const hasTimings = useMemo(() => {
    return PRAYER_ORDER.every((p) => !!timings[p]);
  }, [timings]);

  const next = useMemo(() => (hasTimings ? getNextPrayer(timings) : null), [hasTimings, timings]);

  const nextAudioFull = next ? ((azan.perPrayerAudio && azan.perPrayerAudio[next.prayer]) || azan.audioId) : null;
  const nextAudioHalf = next ? ((azan.perPrayerHalfAudio && azan.perPrayerHalfAudio[next.prayer]) || azan.halfAudioId || azan.audioId) : null;

  const notifSupported = isNotificationSupported();
  const notifPerm = notifSupported ? getNotificationPermission() : "denied";

  const handleUnlock = async () => {
    setBusy(true);
    try {
      const ok = await unlockAudio();
      setAzanSettings({ soundUnlocked: ok });
    } finally {
      setBusy(false);
    }
  };

  const handlePlay = async () => {
    if (playing.ownerId !== null && playing.ownerId === myOwnerMain) return stopAzan();
    setBusy(true);
    const owner = `azanpanel_main_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
    setMyOwnerMain(owner);
    try {
      await playAzan({ volume: azan.volume, audioId: azan.audioId, ownerId: owner });
      if (!azan.soundUnlocked) setAzanSettings({ soundUnlocked: true });
    } finally {
      setBusy(false);
    }
  };

  const handleRequestNotif = async () => {
    setBusy(true);
    try {
      const perm = await requestNotificationPermission();
      setAzanSettings({ notificationsEnabled: perm === "granted" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="azan-panel" className="w-[100%] mx-auto mt-4 rounded-2xl bg-white shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900">Azan System</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manual & automatic azan based on your prayer times ({location || "select location"}).
          </p>
          {next && (
            <p data-testid="next-prayer-summary" className="text-xs text-gray-500 mt-2">
              Next: <b>{PRAYER_LABELS[next.prayer].en}</b> ({PRAYER_LABELS[next.prayer].ar}) at {next.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (!next || !nextAudioFull) return;
              if (playing.ownerId !== null && playing.ownerId === myOwnerMain) return stopAzan();
              const owner = `azanpanel_next_full_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
              setMyOwnerMain(owner);
              setBusy(true);
              try {
                await prefetchAzan(nextAudioFull);
                await playAzan({ audioId: nextAudioFull, volume: azan.volume, ownerId: owner });
              } finally {
                setBusy(false);
              }
            }}
            className="shrink-0 rounded-xl bg-purple-600 text-white px-4 py-2 text-sm font-semibold hover:bg-purple-700 disabled:opacity-60"
          >
            {playing.ownerId !== null && playing.ownerId === myOwnerMain ? "Stop" : (busy ? "Playing..." : "Play Full")}
          </button>

          <button
            onClick={async () => {
              if (!next || !nextAudioHalf) return;
              if (playing.ownerId !== null && playing.ownerId === myOwnerPreset) return stopAzan();
              const owner = `azanpanel_next_half_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
              setMyOwnerPreset(owner);
              setBusy(true);
              try {
                await prefetchAzan(nextAudioHalf);
                await playAzan({ audioId: nextAudioHalf, volume: azan.volume, ownerId: owner });
              } finally {
                setBusy(false);
              }
            }}
            className="shrink-0 rounded-xl bg-purple-500 text-white px-4 py-2 text-sm font-semibold hover:bg-purple-600 disabled:opacity-60"
          >
            {playing.ownerId !== null && playing.ownerId === myOwnerPreset ? "Stop" : (busy ? "Playing..." : "Play Half")}
          </button>

          <button
            data-testid="azan-manual-play-button"
            onClick={handlePlay}
            disabled={busy && playing.ownerId !== myOwnerMain}
            className="shrink-0 rounded-xl bg-purple-600 text-white px-4 py-2 text-sm font-semibold hover:bg-purple-700 disabled:opacity-60"
          >
            {playing.ownerId !== null && playing.ownerId === myOwnerMain ? "Stop" : (busy ? "Playing..." : "Play Azan")}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto Azan</p>
              <p className="text-xs text-gray-600">Plays at prayer times (tab should be open for best results).</p>
            </div>
            <input
              data-testid="auto-azan-toggle"
              type="checkbox"
              checked={azan.autoAzanEnabled}
              onChange={(e) => setAzanSettings({ autoAzanEnabled: e.target.checked })}
              disabled={!hasTimings}
              className="h-5 w-5"
            />
          </div>
          {!hasTimings && (
            <p data-testid="auto-azan-disabled-hint" className="mt-2 text-xs text-amber-700">
              Select a location first to load prayer times.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Notifications</p>
              <p className="text-xs text-gray-600">Show a browser notification at prayer time.</p>
            </div>
            <input
              data-testid="notifications-toggle"
              type="checkbox"
              checked={azan.notificationsEnabled}
              onChange={(e) => setAzanSettings({ notificationsEnabled: e.target.checked })}
              disabled={!notifSupported || notifPerm !== "granted"}
              className="h-5 w-5"
            />
          </div>

          {!notifSupported && (
            <p data-testid="notifications-unsupported-hint" className="mt-2 text-xs text-gray-500">
              Notifications are not supported in this browser.
            </p>
          )}

          {notifSupported && notifPerm !== "granted" && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-600">Permission: <b>{notifPerm}</b></p>
              <button
                data-testid="request-notifications-button"
                onClick={handleRequestNotif}
                disabled={busy}
                className="rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-60"
              >
                Enable
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Sound</p>
              <p className="text-xs text-gray-600">Unlock audio + set volume.</p>
            </div>
            <button
              data-testid="unlock-sound-button"
              onClick={handleUnlock}
              disabled={busy}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-60"
            >
              {azan.soundUnlocked ? "Unlocked" : "Unlock"}
            </button>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <input
              data-testid="azan-volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={azan.volume}
              onChange={(e) => setAzanSettings({ volume: Number(e.target.value) })}
              className="w-full"
            />
            <span data-testid="azan-volume-value" className="text-xs text-gray-700 w-10 text-right">
              {Math.round(azan.volume * 100)}%
            </span>
          </div>

          <div className="mt-3">
            <label className="text-xs font-medium text-gray-900">Azan Preset</label>
            <div className="mt-2 flex items-center gap-2">
              <select
                value={azan.audioId}
                onChange={(e) => setAzanSettings({ audioId: e.target.value })}
                className="rounded-md border px-2 py-1 text-sm"
              >
                {AZAN_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
                <button
                  onClick={async () => {
                    if (playing.ownerId !== null && playing.ownerId === myOwnerPreset) return stopAzan();
                    const owner = `azanpanel_preset_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
                    setMyOwnerPreset(owner);
                    setBusy(true);
                    try {
                      await prefetchAzan(azan.audioId);
                      await playAzan({ audioId: azan.audioId, volume: azan.volume, ownerId: owner });
                    } finally {
                      setBusy(false);
                    }
                  }}
                  disabled={busy && playing.ownerId !== myOwnerPreset}
                  className="rounded-lg border border-purple-200 bg-white px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 disabled:opacity-60"
                >
                  {playing.ownerId !== null && playing.ownerId === myOwnerPreset ? "Stop" : "Play Preset"}
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Source: islam360</p>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Note: browsers may block auto-play until you click "Unlock". For best reliability keep the app open.
      </div>
    </div>
  );
};

export default AzanPanel;
