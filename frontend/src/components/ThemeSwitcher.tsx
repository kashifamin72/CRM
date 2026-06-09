import { useTheme, Theme, ThemeColors, ThemeLabels } from '../contexts/ThemeContext';
import { Palette } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes: Theme[] = ['default', 'emerald', 'sunset', 'purple', 'midnight'];

  return (
    <div>
      <div className="flex items-center gap-2 px-3 mb-3">
        <Palette className="h-3.5 w-3.5 text-slate-500" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
  );
}
