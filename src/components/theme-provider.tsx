import 'expo-sqlite/localStorage/install';

import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';

import {
  THEME_STORAGE_KEY,
  getThemeMode,
  isThemeId,
  type ThemeId,
  type ThemeMode,
} from '@/constants/theme';

type ThemeContextValue = {
  themeId: ThemeId;
  mode: ThemeMode;
  setThemeId: (themeId: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Synchronous read (SQLite-backed localStorage on native, browser localStorage on web). */
function readStoredThemeId(): ThemeId {
  try {
    if (typeof localStorage === 'undefined') return 'system';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const deviceScheme = useColorScheme();
  const [themeId, setThemeIdState] = useState<ThemeId>(readStoredThemeId);

  const setThemeId = useCallback((next: ThemeId) => {
    setThemeIdState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Persistence is best-effort; the in-memory choice still applies.
    }
  }, []);

  const mode = getThemeMode(themeId, deviceScheme);

  const value = useMemo(() => ({ themeId, mode, setThemeId }), [themeId, mode, setThemeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
