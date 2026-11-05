export const themes = ['rose', 'lavender', 'peach', 'mint'] as const;
export type Theme = (typeof themes)[number];
export type Settings = { sounds: boolean; music: boolean; theme: Theme };

const keyFor = (userId: string | null) => (userId ? `typing-game-settings-${userId}` : 'typing-game-settings');
export const defaultSettings: Settings = { sounds: true, music: false, theme: 'rose' };
const defaults = defaultSettings;

export function loadSettings(userId: string | null = null): Settings {
  try {
    return parseSettings(localStorage.getItem(keyFor(userId)));
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
export function storeSettings(s: Settings, userId: string | null = null): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(s));
  } catch {
    // Private mode or blocked storage: nothing to recover.
  }
}
