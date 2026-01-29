import { useCallback, useEffect, useState } from "react";

export default function useTheme() {
  const [dark, setDark] = useState(false);
  const [fontSize, setFontSize] = useState(22);
  const [showTranslation, setShowTranslation] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const increase = useCallback(() => setFontSize((s) => Math.min(36, s + 2)), []);
  const decrease = useCallback(() => setFontSize((s) => Math.max(14, s - 2)), []);
  const toggleTranslation = useCallback(() => setShowTranslation((v) => !v), []);
  const toggleDark = useCallback(() => setDark((v) => !v), []);

  return { dark, toggleDark, fontSize, increase, decrease, showTranslation, toggleTranslation } as const;
}
