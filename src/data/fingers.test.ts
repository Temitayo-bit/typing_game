import { describe, expect, it } from 'vitest';
import { fingerFor, fingersFor, homeKey, keyFor, shiftHand } from './fingers';

describe('fingers', () => {
  it('maps keys to fingers', () => {
    expect(fingerFor('f')).toBe('left index');
    expect(fingerFor('J')).toBe('right index');
    expect(fingerFor('0')).toBe('right pinky');
    expect(fingerFor(' ')).toBe('thumb');
  });

  it('knows which characters need shift', () => {
    expect(keyFor('A')).toEqual({ key: 'a', shift: true });
    expect(keyFor('?')).toEqual({ key: '/', shift: true });
    expect(keyFor('a')).toEqual({ key: 'a', shift: false });
  });

  it('uses the opposite hand for shift', () => {
    expect(shiftHand('a')).toBe('right');
    expect(shiftHand('k')).toBe('left');
  });

  it('lists the fingers pressing for a character, shift pinky included', () => {
    expect(fingersFor('f')).toEqual(['left index']);
    expect(fingersFor('F')).toEqual(['left index', 'right pinky']);
    expect(fingersFor('?')).toEqual(['right pinky', 'left pinky']);
    expect(fingersFor(' ')).toEqual(['thumb']);
    expect(fingersFor('§')).toEqual([]);
  });

  it('rests every finger on a key that finger types', () => {
    for (const [finger, key] of Object.entries(homeKey)) expect(fingerFor(key)).toBe(finger);
  });
});
