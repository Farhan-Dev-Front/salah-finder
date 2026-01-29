import { useMemo } from "react";
import { parse, isAfter } from "date-fns";
import { usePrayerStore } from "../store/usePrayerStore";
import PrayerCard from "./PrayerCard";
import { PRAYER_ORDER } from "../utils/prayerNames";

const PrayerPage = () => {
  const timings = usePrayerStore((s) => s.timings);
  const mode = usePrayerStore((s) => { return (s && (s as any).mode) || "auto"; });
  const setMode = usePrayerStore((s) => (s as any).setMode) || (() => {});

  const prayerList = useMemo(() => PRAYER_ORDER, []);

  const getCurrentPrayer = () => {
    const order = PRAYER_ORDER;
    const now = new Date();
    for (let i = 0; i < order.length; i++) {
      const name = order[i];
      try {
        const time = parse(timings[name], "HH:mm", new Date());
        if (isAfter(time, now)) {
          return i === 0 ? "Isha" : order[i - 1];
        }
      } catch {
        continue;
      }
    }
    return "Isha";
  };

  const current = getCurrentPrayer();
  // compute next using simple search
  const next = (() => {
    try {
      const now = new Date();
      for (let i = 0; i < PRAYER_ORDER.length; i++) {
        const name = PRAYER_ORDER[i];
        const t = parse(timings[name], "HH:mm", new Date());
        if (isAfter(t, now)) return { prayer: name, at: t };
      }
      // fallback to Fajr next day
      const fajr = parse(timings["Fajr"], "HH:mm", new Date(Date.now() + 24 * 60 * 60 * 1000));
      return { prayer: "Fajr", at: fajr };
    } catch {
      return null;
    }
  })();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Prayer Times</h1>
          <p className="text-sm text-gray-500">Auto or manual prayer time mode. Smooth UI inspired by islam360.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* removed Detect Location and AzanSettings to use centralized timings */}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {prayerList.map((p) => (
          <PrayerCard
            key={p}
            name={p}
            time={timings[p]}
            isCurrent={p === current}
            active={!!next && p === next.prayer}
            soundOn={true}
          />
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-white shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-600">Next Prayer</div>
            <div className="font-semibold">{next ? `${next.prayer} • ${next.at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "—"}</div>
          </div>
          <div>
            <div className="text-xs">Mode</div>
            <div className="mt-1">
              <button onClick={() => setMode("auto")} className={`px-3 py-1 rounded ${mode === "auto" ? "bg-purple-600 text-white" : "bg-white"}`}>Auto</button>
              <button onClick={() => setMode("manual")} className={`ml-2 px-3 py-1 rounded ${mode === "manual" ? "bg-purple-600 text-white" : "bg-white"}`}>Manual</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrayerPage;
