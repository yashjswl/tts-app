import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'duologue.prefs';

export const TEXT_SIZES = [
  { id: 's', label: 'Small', value: '1.05rem' },
  { id: 'm', label: 'Medium', value: '1.3rem' },
  { id: 'l', label: 'Large', value: '1.7rem' },
  { id: 'xl', label: 'Extra large', value: '2.2rem' },
];

const DEFAULTS = { language: 'auto', textSize: 'm', theme: 'auto', layout: null };

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // Carry over the language chosen in the previous version of the app.
    const legacyLanguage = localStorage.getItem('deepgramLanguage');
    return { ...DEFAULTS, ...(legacyLanguage && { language: legacyLanguage }), ...stored };
  } catch {
    return DEFAULTS;
  }
}

/** Phones and tablets lying on a table default to face-to-face; desktops to the shared view. */
function defaultLayout() {
  return window.matchMedia('(pointer: coarse)').matches ? 'face' : 'shared';
}

const PrefsContext = createContext(null);

export function PrefsProvider({ children }) {
  const [prefs, setPrefs] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // storage unavailable (private mode); preferences last for this visit only
    }
  }, [prefs]);

  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === 'auto') root.removeAttribute('data-theme');
    else root.dataset.theme = prefs.theme;
    const size = TEXT_SIZES.find((s) => s.id === prefs.textSize) ?? TEXT_SIZES[1];
    root.style.setProperty('--message-size', size.value);
  }, [prefs.theme, prefs.textSize]);

  const update = useCallback((patch) => setPrefs((p) => ({ ...p, ...patch })), []);

  const value = useMemo(
    () => ({ ...prefs, layout: prefs.layout ?? defaultLayout(), update }),
    [prefs, update]
  );
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error('usePrefs must be used inside PrefsProvider');
  return ctx;
}
