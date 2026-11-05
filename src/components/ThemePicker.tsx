import { themes, type Theme } from '../lib/settings';
import { useSettings } from '../lib/sound';

const swatch: Record<Theme, string> = { rose: '#D6336C', lavender: '#7B4FD6', peach: '#C8552A', mint: '#1F7F58' };

export function ThemePicker() {
  const [settings, update] = useSettings();
  return (
    <div className="flex flex-wrap gap-3">
      {themes.map((t) => (
        <button
          key={t}
          aria-pressed={settings.theme === t}
          onClick={() => update({ theme: t })}
          className={`flex min-h-11 items-center gap-2 rounded-full border px-4 font-bold capitalize ${
            settings.theme === t ? 'border-ink bg-white' : 'border-line bg-white/70'
          }`}
        >
          <span className="h-5 w-5 rounded-full" style={{ background: swatch[t] }} />
          {t}
        </button>
      ))}
    </div>
  );
}
