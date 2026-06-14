import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type Theme = 'default' | 'emerald' | 'sunset' | 'midnight';
export type Mode = 'light' | 'dark';

export const ThemeLabels: Record<Theme, string> = {
  default: 'Indigo',
  emerald: 'Emerald',
  sunset: 'Sunset',
  midnight: 'Midnight',
};

export const ThemeColors: Record<Theme, string> = {
  default: '#6366f1',
  emerald: '#10b981',
  sunset: '#f97316',
  midnight: '#3b82f6',
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme');
    if (stored && ['default', 'emerald', 'sunset', 'midnight'].includes(stored)) {
      return stored as Theme;
    }
  } catch {}
  return 'default';
}

function getInitialMode(): Mode {
  try {
    const stored = localStorage.getItem('mode');
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch {}
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [mode, setModeState] = useState<Mode>(getInitialMode);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;
  }, [theme, mode]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch {}
  }, []);

  const setMode = useCallback((newMode: Mode) => {
    setModeState(newMode);
    try {
      localStorage.setItem('mode', newMode);
    } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
