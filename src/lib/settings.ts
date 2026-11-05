export const themes = ['rose', 'lavender', 'peach', 'mint'] as const;
export type Theme = (typeof themes)[number];
export type Settings = { sounds: boolean; music: boolean; theme: Theme };

const KEY = 'typing-game-settings';
const defaults: Settings = { sounds: true, music: false, theme: 'rose' };

export function loadSettings(): Settings {
  try {
    return parseSettings(localStorage.getItem(KEY));
  } catch {
    return defaults;
  }
}

export function parseSettings(raw: string | null): Settings {
  if (!raw) return defaults;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return defaults;
    const p = parsed as Partial<Record<keyof Settings, unknown>>;
    return {
      sounds: typeof p.sounds === 'boolean' ? p.sounds : defaults.sounds,
      music: typeof p.music === 'boolean' ? p.music : defaults.music,
      theme: themes.find((t) => t === p.theme) ?? defaults.theme,
    };
  } catch {
    return defaults;
  }
}

/** Settings are a convenience; if storage is blocked they just reset next visit. */
export function storeSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // Private mode or blocked storage: nothing to recover.
  }
}
