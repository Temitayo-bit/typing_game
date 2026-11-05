import { useSettings } from '../lib/sound';

export function SoundToggle() {
  const [settings, update] = useSettings();
  return (
    <div className="flex gap-2 font-sans text-sm font-bold">
      <Toggle on={settings.music} label={`Soft music: ${settings.music ? 'on' : 'off'}`} onClick={() => update({ music: !settings.music })} icon={<path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />} />
      <Toggle on={settings.sounds} label={`Key pops: ${settings.sounds ? 'on' : 'off'}`} onClick={() => update({ sounds: !settings.sounds })} icon={<><path d="M11 5 6 9H2v6h4l5 4V5z" />{settings.sounds && <path d="M15.5 8.5a5 5 0 0 1 0 7" />}</>} />
    </div>
  );
}

function Toggle({ on, label, icon, onClick }: { on: boolean; label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      aria-pressed={on}
      onClick={(e) => {
        onClick();
        e.currentTarget.blur();
      }}
      className={`flex min-h-11 items-center gap-2 rounded-full border border-line px-3.5 py-2 transition ${on ? 'bg-white text-wine' : 'bg-white/60 text-muted'}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {icon}
      </svg>
      {label}
    </button>
  );
}
