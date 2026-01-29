// lightweight list component
import type { SurahMeta } from "../hooks/useQuranData";
import archImg from "../assets/qiblaImg.png";

type Props = {
  surahList: SurahMeta[];
  selected?: number | null;
  onSelect: (n: number) => void;
  query: string;
  setQuery: (s: string) => void;
};

export default function SurahList({ surahList, selected, onSelect, query, setQuery }: Props) {
  return (
    <aside className="w-full sm:w-80 border-r p-3 overflow-y-auto h-screen relative">
      <div className="absolute inset-0 -z-10" style={{ backgroundImage: `url(${archImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.95 }} />
      <div className="absolute inset-0 -z-5 bg-white/70 dark:bg-black/50" />
      <div className="mb-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search surah..." className="w-full p-2 rounded border" />
      </div>
      <ul className="space-y-1">
        {surahList.map((s) => (
          <li key={s.number}>
            <button onClick={() => onSelect(s.number)} aria-current={selected === s.number} className={`w-full text-left p-2 rounded ${selected === s.number ? 'bg-emerald-100' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{s.number}. {s.englishName}</div>
                  <div className="text-xs text-gray-500">{s.name} • {s.numberOfAyahs} ayahs</div>
                </div>
                <div className="ml-2 text-xs px-2 py-1 bg-white border rounded-full">{s.number}</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
