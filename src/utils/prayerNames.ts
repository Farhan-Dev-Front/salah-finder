"export type PrayerKey = \"Fajr\" | \"Dhuhr\" | \"Asr\" | \"Maghrib\" | \"Isha\";

export const PRAYER_ORDER: PrayerKey[] = [\"Fajr\", \"Dhuhr\", \"Asr\", \"Maghrib\", \"Isha\"];

export const PRAYER_LABELS: Record<PrayerKey, { en: string; ar: string }> = {
  Fajr: { en: \"Fajr\", ar: \"الفجر\" },
  Dhuhr: { en: \"Dhuhr\", ar: \"الظهر\" },
  Asr: { en: \"Asr\", ar: \"العصر\" },
  Maghrib: { en: \"Maghrib\", ar: \"المغرب\" },
  Isha: { en: \"Isha\", ar: \"العشاء\" },
};
"
