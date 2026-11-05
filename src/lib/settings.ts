export const themes = ['rose', 'lavender', 'peach', 'mint'] as const;
export type Theme = (typeof themes)[number];
export type Settings = { sounds: boolean; music: boolean; theme: Theme };

const keyFor = (userId: string | null) => (userId ? `typing-game-settings-${userId}` : 'typing-game-settings');
export const defaultSettings: Settings = { sounds: true, music: false, theme: 'rose' };
const defaults = defaultSettings;

export function loadSettings(userId: string | null = null): Settings {
  try {
    // Before accounts, settings were stored without an id; carry them over the first time.
    return parseSettings(localStorage.getItem(keyFor(userId)) ?? localStorage.getItem(keyFor(null)));
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

const unsyncedKey = (userId: string) => `typing-game-settings-unsynced-${userId}`;

/** Marks local edits the server hasn't confirmed, so a later pull doesn't overwrite them. */
export function markUnsynced(userId: string, unsynced: boolean): void {
  try {
    if (unsynced) localStorage.setItem(unsyncedKey(userId), '1');
    else localStorage.removeItem(unsyncedKey(userId));
  } catch {
    // Storage blocked: worst case the server copy wins on next load.
  }
}

export function hasUnsynced(userId: string): boolean {
  try {
    return localStorage.getItem(unsyncedKey(userId)) !== null;
  } catch {
    return false;
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
