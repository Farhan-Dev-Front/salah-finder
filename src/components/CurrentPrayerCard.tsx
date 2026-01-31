import { useEffect, useMemo, useState } from "react";
import { usePrayerStore } from "../store/usePrayerStore";
import { format, parse, differenceInMinutes, isAfter } from "date-fns";
import { CloudSun, Sun, Cloud, CloudMoon, Moon } from "phosphor-react";
import { formatTo12Hour } from "../utils/formatTime";
import { getCurrentPrayerProgress } from "../utils/getCurrentPrayer";
import { PRAYER_LABELS, PRAYER_ORDER, type PrayerKey } from "../utils/prayerNames";

// min into hours min
const formatTimeLeft = (minutes: number) => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs > 0 ? `${hrs}h ` : ""}${mins}min`;
};

// current and next prayer
const getCurrentAndNextPrayer = (timings: Record<string, string>) => {
  const order: PrayerKey[] = PRAYER_ORDER;
  const now = new Date();

  for (let i = 0; i < order.length; i++) {
    const name = order[i];
    const time = parse(timings[name], "HH:mm", new Date());

    if (isAfter(time, now)) {
      const current = i === 0 ? "Isha" : order[i - 1];
      const next = name;
      const diff = differenceInMinutes(time, now);
      return { currentPrayer: current, nextPrayer: next, nextInMinutes: diff };
    }
  }

  const fajrNextDay = parse(timings["Fajr"], "HH:mm", new Date(now.getTime() + 86400000));

  return {
    currentPrayer: "Isha",
    nextPrayer: "Fajr",
    nextInMinutes: differenceInMinutes(fajrNextDay, now),
  };
};

const CurrentPrayerCard = () => {
  const timings = usePrayerStore((state) => state.timings);
  // azan hook removed here because playback is handled centrally via playAzan util

  const [progressData, setProgressData] = useState(() => getCurrentPrayerProgress(timings));

  const prayerNames: PrayerKey[] = useMemo(() => PRAYER_ORDER, []);
  const icons = [CloudSun, Sun, Cloud, CloudMoon, Moon];

  const today = format(new Date(), "EEEE");
  const currentDate = format(new Date(), "dd/MM/yyyy");
  const currentTime = format(new Date(), "HH:mm:ss");

  // Different background gradients for each prayer (custom colors)
  const prayerBackgrounds = [
    "bg-gradient-to-br from-[#D6BDFF] to-[#3F7CE6]",
    "bg-gradient-to-br from-[#E77715] to-[#FFE392]",
    "bg-gradient-to-br from-[#006C5E] to-[#C9F3B3]",
    "bg-gradient-to-br from-[#FF88A8] to-[#FF9452]",
    "bg-gradient-to-br from-[#811DEC] to-[#381079]",
  ];

  const { currentPrayer, nextPrayer, nextInMinutes } = getCurrentAndNextPrayer(timings);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgressData(getCurrentPrayerProgress(timings));
    }, 1000);
    return () => clearInterval(interval);
  }, [timings]);

  // Get background class based on current prayer
  const getCurrentBackground = () => {
    const currentIndex = prayerNames.indexOf(currentPrayer as PrayerKey);
    return currentIndex !== -1 ? prayerBackgrounds[currentIndex] : prayerBackgrounds[4];
  };

  return (
    <div
      data-testid="current-prayer-card"
      className={`mx-auto m-4 rounded-2xl p-4 sm:p-5 w-[95%] sm:w-[90%] ${getCurrentBackground()} text-white shadow-md text-center`}
    >
      {/* Header */}
      <div className="flex flex-col items-center text-center sm:flex-row sm:justify-between sm:items-start sm:text-left">
        <div>
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = icons[prayerNames.indexOf(currentPrayer as PrayerKey)];
              return <Icon size={22} />;
            })()}
            <div className="flex items-baseline gap-2">
              <h1 data-testid="current-prayer-name" className="text-2xl font-bold">
                {PRAYER_LABELS[currentPrayer as PrayerKey]?.en || currentPrayer}
              </h1>
              <span data-testid="current-prayer-arabic" className="text-sm text-white/90">
                {PRAYER_LABELS[currentPrayer as PrayerKey]?.ar || ""}
              </span>
            </div>
          </div>
          <p data-testid="next-prayer-countdown" className="text-xs mt-1">
            Next prayer <b>{PRAYER_LABELS[nextPrayer as PrayerKey]?.en || nextPrayer}</b> ({PRAYER_LABELS[nextPrayer as PrayerKey]?.ar || ""}) in {formatTimeLeft(nextInMinutes)}
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-2 flex-wrap justify-center">
          <div data-testid="today-pill" className="text-xs bg-white/20 px-2 sm:px-3 py-1 rounded-full">
            {today}
          </div>
          <div data-testid="date-pill" className="text-xs bg-white/20 px-2 sm:px-3 py-1 rounded-full">
            {currentDate}
          </div>
          <div data-testid="time-pill" className="text-xs bg-white/20 px-2 sm:px-3 py-1 rounded-full">
            {currentTime}
          </div>
        </div>
      </div>

      {/* Timings List */}
      <div data-testid="prayer-timings-row" className="grid grid-cols-3 md:grid-cols-5 gap-2 text-center mt-6 text-sm mx-auto justify-center justify-items-center place-items-center max-w-[420px] md:max-w-none">
        {prayerNames.map((name, idx) => {
          const Icon = icons[idx];
          const isActive = name === (currentPrayer as PrayerKey);

          return (
            <div
              data-testid={`prayer-timing-${name.toLowerCase()}`}
              key={name}
              className={`flex flex-col items-center gap-1 px-1 ${isActive ? "text-white font-semibold" : "text-white/70"}`}
            >
              <Icon size={18} />
              <span className="text-xs">
                {PRAYER_LABELS[name].en}
                <span className="ml-1 text-[10px] text-white/90">{PRAYER_LABELS[name].ar}</span>
              </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" data-testid={`prayer-time-${name.toLowerCase()}`}>
                      {timings[name] ? formatTo12Hour(timings[name]) : "--:--"}
                    </span>
                    {/* {isActive ? (
                      <button
                        aria-label={`play-azan-${name}`}
                        onClick={() => {
                          if (!playAzan || !stopAzan) return;
                          if (isPlaying) stopAzan();
                          else playAzan(name);
                        }}
                        className="text-white/90 hover:text-white"
                      >
                        {isPlaying ? <span aria-hidden className="text-xs">🔊</span> : <span aria-hidden className="text-xs">🔇</span>}
                      </button>
                    ) : null} */}
                  </div>
            </div>
          );
        })}
      </div>

      {/* Arc Progress */}
      {progressData.currentIndex === -1 ? (
        <div data-testid="prayer-timings-invalid" className="text-center text-red-200">
          Prayer timings not loaded or invalid.
        </div>
      ) : (
        <div className="relative mt-6 flex items-center justify-center w-full h-[80px] md:h-[100px]">
          <svg className="absolute w-full sm:w-[90%] h-full" viewBox="0 0 200 100">
            {Array.from({ length: 5 }).map((_, i) => {
              const angle = 180 / 5;
              const radius = 80;
              const gap = 4;
              const cx = 100;
              const cy = 100;

              const startAngle = 180 + i * angle + gap / 2;
              const endAngle = startAngle + angle - gap;

              const prayerColors = [
                "rgba(255, 255, 255, 0.2)",
                "rgba(255, 255, 255, 0.2)",
                "rgba(255, 255, 255, 0.2)",
                "rgba(255, 255, 255, 0.2)",
                "rgba(255, 255, 255, 0.2)",
              ];

              const polarToCartesian = (r: number, a: number) => {
                const rad = (Math.PI * a) / 180;
                return {
                  x: cx + r * Math.cos(rad),
                  y: cy + r * Math.sin(rad),
                };
              };

              const start = polarToCartesian(radius, startAngle);
              const end = polarToCartesian(radius, endAngle);
              const largeArc = endAngle - startAngle <= 180 ? "0" : "1";

              if (i < progressData.currentIndex) {
                return (
                  <path
                    key={i}
                    d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                  />
                );
              } else if (i === progressData.currentIndex && progressData.currentIndex !== -1) {
                const progressAngle = startAngle + ((endAngle - startAngle) * progressData.progressPercent) / 100;
                const progressEnd = polarToCartesian(radius, progressAngle);
                const progressLargeArc = progressAngle - startAngle <= 180 ? "0" : "1";

                return (
                  <g key={i}>
                    <path
                      d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
                      stroke={prayerColors[i]}
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                    />
                    {progressData.progressPercent > 0 && (
                      <path
                        d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${progressLargeArc} 1 ${progressEnd.x} ${progressEnd.y}`}
                        stroke="rgba(255,255,255,0.9)"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                      />
                    )}
                  </g>
                );
              }

              return (
                <path
                  key={i}
                  d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
                  stroke={prayerColors[i]}
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                />
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

export default CurrentPrayerCard;
