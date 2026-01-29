import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

export type Ayah = { number: number; text: string; numberInSurah: number };
export type SurahMeta = { number: number; englishName: string; name: string; numberOfAyahs: number };

const SURAH_LIST_URL = "https://api.alquran.cloud/v1/quran/en.asad"; // has surah list

export default function useQuranData() {
  const [surahList, setSurahList] = useState<SurahMeta[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // cache for loaded surahs: map surahNumber -> { ayahsArabic, ayahsTrans }
  const [cache] = useState(new Map<number, { arabic: Ayah[]; translation?: Ayah[] }>());
  const [loadingSurah, setLoadingSurah] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await axios.get(SURAH_LIST_URL);
        if (!mounted) return;
        const surahs = res.data?.data?.surahs || [];
        const meta = surahs.map((s: any) => ({
          number: s.number,
          englishName: s.englishName || s.englishNameTranslation || s.englishNameSimple || s.englishName,
          name: s.name,
          numberOfAyahs: s.numberOfAyahs,
        }));
        setSurahList(meta);
      } catch (err) {
        setError("Failed to load surah list");
      } finally {
        if (mounted) setLoadingList(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const fetchSurah = useCallback(async (surahNumber: number) => {
    if (cache.has(surahNumber)) return cache.get(surahNumber);
    setLoadingSurah(true);
    try {
      const [arabicRes, transRes] = await Promise.all([
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`),
        axios.get(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.asad`).catch(() => null),
      ]);
      const arabic = (arabicRes.data?.data?.ayahs || []).map((a: any) => ({ number: a.number, text: a.text, numberInSurah: a.numberInSurah }));
      const translation = transRes ? (transRes.data?.data?.ayahs || []).map((a: any) => ({ number: a.number, text: a.text, numberInSurah: a.numberInSurah })) : undefined;
      const value = { arabic, translation };
      cache.set(surahNumber, value);
      return value;
    } catch (err) {
      throw err;
    } finally {
      setLoadingSurah(false);
    }
  }, [cache]);

  const getSurahMeta = useCallback((n: number) => surahList.find((s) => s.number === n) ?? null, [surahList]);

  return useMemo(() => ({
    surahList,
    loadingList,
    error,
    fetchSurah,
    loadingSurah,
    getSurahMeta,
    cache,
  }), [surahList, loadingList, error, fetchSurah, loadingSurah, getSurahMeta, cache]);
}
