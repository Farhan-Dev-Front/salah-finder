"import { parse, isValid, differenceInMilliseconds } from \"date-fns\";
import type { PrayerTimings } from \"../store/usePrayerStore\";
import { PRAYER_ORDER, type PrayerKey } from \"./prayerNames\";

export type ScheduledPrayer = {
  prayer: PrayerKey;
  at: Date;
};

export const buildPrayerScheduleForToday = (timings: PrayerTimings, now = new Date()): ScheduledPrayer[] => {
  const base = new Date(now);

  return PRAYER_ORDER.map((prayer) => {
    const t = parse(timings[prayer], \"HH:mm\", base);
    return { prayer, at: t };
  }).filter((p) => isValid(p.at));
};

export const getNextPrayer = (timings: PrayerTimings, now = new Date()): ScheduledPrayer | null => {
  const schedule = buildPrayerScheduleForToday(timings, now);
  const upcomingToday = schedule.find((p) => p.at.getTime() > now.getTime());
  if (upcomingToday) return upcomingToday;

  // next is Fajr tomorrow
  const fajr = timings.Fajr;
  if (!fajr) return null;

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const t = parse(fajr, \"HH:mm\", tomorrow);
  if (!isValid(t)) return null;
  return { prayer: \"Fajr\", at: t };
};

export const msUntil = (date: Date, now = new Date()) => {
  const diff = differenceInMilliseconds(date, now);
  return Math.max(diff, 0);
};

export const prayerEventKey = (prayer: PrayerKey, at: Date) => {
  // minute precision is enough
  const pad = (n: number) => String(n).padStart(2, \"0\");
  return `${prayer}-${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-${pad(at.getHours())}${pad(at.getMinutes())}`;
};
"
