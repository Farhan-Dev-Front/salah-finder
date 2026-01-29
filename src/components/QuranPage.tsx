import React, { useEffect, useRef, useState } from "react";
import useQuranData from "../hooks/useQuranData";
import useTheme from "../hooks/useTheme";
import useAudioPlayer from "../hooks/useAudioPlayer";
// SurahList and AyahCard remain available in codebase but not used in this view
import AyahCard from "./AyahCard";
import QuranControls from "./QuranControls";
import AudioPlayer from "./AudioPlayer";
// import archImg from "../assets/qiblaImg.png";
const MOSQUE_BG =
  "https://myislam.sfo3.digitaloceanspaces.com/quran-english-audio%2Fmosque-image.jpg";

const QuranPage: React.FC = () => {
  const { surahList, fetchSurah, cache } = useQuranData();
  const {
    fontSize,
    increase,
    decrease,
    showTranslation,
    toggleTranslation,
    dark,
    toggleDark,
  } = useTheme();
  const { play, pause, stop, isPlaying, currentUrl } = useAudioPlayer();

  // keep query state for potential hidden SurahList usage
  const [selected, setSelected] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownQuery, setDropdownQuery] = useState("");
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [surahData, setSurahData] = useState<{
    arabic: any[];
    translation?: any[];
  } | null>(null);
  const [loadingSurah, setLoadingSurah] = useState(false);

  useEffect(() => {
    if (!selected && surahList.length) setSelected(surahList[0].number);
  }, [surahList, selected]);

  useEffect(() => {
    if (!selected) return;
    let mounted = true;
    (async () => {
      setLoadingSurah(true);
      try {
        const cached = cache.get(selected);
        if (cached) {
          if (!mounted) return;
          setSurahData(cached);
        } else {
          const loaded = await fetchSurah(selected);
          if (!mounted) return;
          setSurahData(loaded as any);
        }
      } catch (err) {
        setSurahData(null);
      } finally {
        if (mounted) setLoadingSurah(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selected, fetchSurah, cache]);

  const onSelect = (n: number) => {
    setSelected(n);
    // scroll content top
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToTop = () =>
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });

  const playSurah = (n: number) => {
    // use CDN reciter pattern for full surah audio (common source)
    const url = `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${n}.mp3`;
    play(url);
  };

  const dropdownFiltered = surahList.filter((s) => {
    const q = dropdownQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.englishName.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      String(s.number) === q
    );
  });

  return (
    <div
      className={`min-h-screen flex flex-col sm:flex-row ${dark ? "dark" : ""}`}
    >
      {/* Top centered dropdown (searchable) */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800 text-white shadow-md"
          >
            <span className="text-sm font-medium">
              {selected
                ? `${selected}. ${surahList.find((s) => s.number === selected)?.englishName ?? "Surah"}`
                : "Select Surah"}
            </span>
            <svg
              className="w-3 h-3 opacity-80"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.353a.75.75 0 011.138.976l-4.25 5a.75.75 0 01-1.138 0l-4.25-5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div className="w-10 h-10 rounded bg-black/80" />
        </div>

        {dropdownOpen && (
          <div className="mt-2 w-72 bg-gray-100 rounded-md shadow-lg overflow-hidden">
            <div className="p-2">
              <input
                value={dropdownQuery}
                onChange={(e) => setDropdownQuery(e.target.value)}
                placeholder="Search surah..."
                className="w-full p-2 rounded border"
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {dropdownFiltered.map((s) => (
                <button
                  key={s.number}
                  onClick={() => {
                    onSelect(s.number);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-200 border-b last:border-b-0"
                >
                  <div className="text-sm text-emerald-700">
                    {s.number}. {s.englishName}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <main
        className="flex-1 p-4"
        style={{ background: dark ? "#0f172a" : "transparent" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Quran Reader</h1>
          <QuranControls
            fontSize={fontSize}
            increase={increase}
            decrease={decrease}
            showTranslation={showTranslation}
            toggleTranslation={toggleTranslation}
            dark={dark}
            toggleDark={toggleDark}
            scrollToTop={scrollToTop}
          />
        </div>

        {/* center area with decorative arch background */}
        <div className="relative">
          <div
            className="absolute inset-0 -z-10 opacity-100"
            style={{
              backgroundImage: `url(${MOSQUE_BG})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* arch overlay above the mosque background to preserve the cutout look */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `url(${MOSQUE_BG})`,

              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.95,
            }}
          />

          <div
            ref={contentRef}
            className="h-[90vh] overflow-y-auto p-4  rounded-lg backdrop-blur-xs"
          >
            {loadingSurah && <div className="p-6">Loading surah...</div>}
            {!loadingSurah && surahData && (
              <article>
                {/* Bismillah except surah 9 */}
                {selected !== 9 && (
                  <div className="text-center text-gray-600 mb-4">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                )}
                {surahData.arabic.map((a: any) => (
                  <AyahCard
                    key={a.number}
                    ayah={{
                      number: a.number,
                      text: a.text,
                      numberInSurah: a.numberInSurah,
                    }}
                    translation={
                      showTranslation
                        ? surahData.translation?.find(
                            (t: any) => t.numberInSurah === a.numberInSurah,
                          )
                        : undefined
                    }
                    fontSize={fontSize}
                    showTranslation={showTranslation}
                  />
                ))}
              </article>
            )}
          </div>
        </div>

        {/* <div className="mt-4 flex gap-2">
          <button
            onClick={() => selected && playSurah(selected)}
            className="px-4 py-2 rounded bg-emerald-600 text-white"
          >
            Play Surah
          </button>
          <button onClick={() => stop()} className="px-4 py-2 rounded border">
            Stop
          </button>
          <div className="hidden">
            <SurahList
              surahList={surahList}
              selected={selected}
              onSelect={onSelect}
              query={query}
              setQuery={setQuery}
            />
          </div>
        </div> */}

        {/* floating play box centered at bottom (visual) */}
        <div className="fixed left-1/2 transform -translate-x-1/2 bottom-26 flex items-center gap-3 z-40">
          <button
            onClick={() => {
              if (!surahData?.arabic) return;
              if (selected) playSurah(Math.max(1, selected - 1));
            }}
            className="w-10 h-10 rounded bg-black/80 text-white flex items-center justify-center shadow"
            aria-label="previous"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M11.49 4.48a.75.75 0 00-1.06 0L5.22 9.69a.75.75 0 000 1.06l5.21 5.21a.75.75 0 101.06-1.06L7.56 10l3.93-3.94a.75.75 0 000-1.06z" />
            </svg>
          </button>

          <button
            onClick={() => {
              if (isPlaying) {
                pause();
                return;
              }
              if (selected) playSurah(selected);
            }}
            className="w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-lg border border-gray-200"
            aria-label={isPlaying ? "pause" : "play"}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-black"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6 4h3v12H6zM11 4h3v12h-3z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-black"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M6.5 5.5v9l7-4.5-7-4.5z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => {
              if (!surahData?.arabic) return;
              if (selected) playSurah(Math.min(114, selected + 1));
            }}
            className="w-10 h-10 rounded bg-black/80 text-white flex items-center justify-center shadow"
            aria-label="next"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8.51 4.48a.75.75 0 011.06 0L14.78 9.69a.75.75 0 010 1.06l-5.21 5.21a.75.75 0 11-1.06-1.06L12.44 10 8.51 6.06a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>

        {/* show embedded player only while playing */}
        {isPlaying && currentUrl && (
          <div className="fixed left-1/2 transform -translate-x-1/2 bottom-4 w-[320px] z-50">
            <AudioPlayer audioUrl={currentUrl} onStop={() => stop()} />
          </div>
        )}
      </main>
    </div>
  );
};

export default QuranPage;
