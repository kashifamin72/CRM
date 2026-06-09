import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type Theme = 'default' | 'emerald' | 'sunset' | 'purple' | 'midnight';

export const ThemeLabels: Record<Theme, string> = {
  default: 'Default Blue',
  emerald: 'Emerald',
  sunset: 'Sunset',
  purple: 'Purple',
  midnight: 'Midnight',
};

export const ThemeColors: Record<Theme, string> = {
  default: '#2563eb',
  emerald: '#059669',
  sunset: '#ea580c',
  purple: '#9333ea',
  midnight: '#4f46e5',
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme');
    if (stored && ['default', 'emerald', 'sunset', 'purple', 'midnight'].includes(stored)) {
      return stored as Theme;
    }
  } catch {}
  return 'default';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('theme', newTheme);
    } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
