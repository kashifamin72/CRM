import { useTheme, Theme, ThemeColors, ThemeLabels } from '../contexts/ThemeContext';
import { Palette, Sun, Moon } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme, mode, setMode } = useTheme();

  const themes: Theme[] = ['default', 'emerald', 'sunset', 'rose', 'cyan', 'amber'];

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-2 px-3 mb-3">
          <Palette className="h-3.5 w-3.5 text-white/40" />
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Theme
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-1">
          {themes.map((t) => {
            const isActive = theme === t;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                title={ThemeLabels[t]}
                className={`h-7 w-7 rounded-full border-2 transition-all duration-150 shrink-0 hover:scale-110 ${
                  isActive ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{
                  backgroundColor: ThemeColors[t],
                  boxShadow: isActive
                    ? `0 0 0 2px ${ThemeColors[t]}, 0 0 0 3px rgba(255,255,255,0.8)`
                    : 'none',
                }}
              />
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 px-3 mb-2">
          <Sun className="h-3.5 w-3.5 text-white/40" />
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
            Mode
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <button
            onClick={() => setMode('light')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-150 ${
              mode === 'light'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/50 hover:text-white/70 hover:bg-white/10'
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            Light
          </button>
          <button
            onClick={() => setMode('dark')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all duration-150 ${
              mode === 'dark'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-white/50 hover:text-white/70 hover:bg-white/10'
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            Dark
          </button>
        </div>
      </div>
    </div>
  );
}
