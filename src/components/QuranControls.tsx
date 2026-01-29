type Props = {
  fontSize: number;
  increase: () => void;
  decrease: () => void;
  showTranslation: boolean;
  toggleTranslation: () => void;
  dark: boolean;
  toggleDark: () => void;
  scrollToTop: () => void;
};

export default function QuranControls({ fontSize, increase, decrease, showTranslation, toggleTranslation, dark, toggleDark, scrollToTop }: Props) {
  return (
    <div className="flex items-center gap-2 p-2">
      <button onClick={decrease} aria-label="Decrease font" className="px-2 py-1 border rounded">A-</button>
      <div className="px-2">{fontSize}px</div>
      <button onClick={increase} aria-label="Increase font" className="px-2 py-1 border rounded">A+</button>
      <button onClick={toggleTranslation} className="px-3 py-1 border rounded">{showTranslation ? 'Hide Translation' : 'Show Translation'}</button>
      <button onClick={toggleDark} className="px-3 py-1 border rounded">{dark ? 'Light' : 'Dark'}</button>
      <button onClick={scrollToTop} className="px-3 py-1 border rounded">Top</button>
    </div>
  );
}
