import { describe, expect, it } from 'vitest';
import { parseSettings } from './settings';

describe('parseSettings', () => {
  const defaults = { sounds: true, music: false, theme: 'rose' };

  it('falls back to defaults on missing or bad data', () => {
    for (const raw of [null, '', 'not json', '[]', '42', '{"sounds":"yes"}']) {
      expect(parseSettings(raw)).toEqual(defaults);
    }
  });

  it('keeps valid fields and defaults the rest', () => {
    expect(parseSettings('{"music":true}')).toEqual({ ...defaults, music: true });
    expect(parseSettings('{"sounds":false,"music":true,"theme":"mint"}')).toEqual({ sounds: false, music: true, theme: 'mint' });
    expect(parseSettings('{"theme":"neon"}')).toEqual(defaults);
  });
});
