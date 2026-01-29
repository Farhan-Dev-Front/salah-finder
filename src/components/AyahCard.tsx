type Props = {
  ayah: { number: number; text: string; numberInSurah: number };
  translation?: { number: number; text: string } | null;
  fontSize?: number;
  showTranslation?: boolean;
};

export default function AyahCard({ ayah, translation, fontSize = 22, showTranslation = true }: Props) {
  return (
    <div className="py-4" key={ayah.number}>
      <div dir="rtl" className="text-center" style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}>
        <span className="font-arabic">{ayah.text}</span>
      </div>
      {showTranslation && translation && (
        <div className="mt-2 text-center text-sm text-gray-700">
          <span>{translation.text} <span className="text-xs text-gray-400">({ayah.numberInSurah})</span></span>
        </div>
      )}
    </div>
  );
}
