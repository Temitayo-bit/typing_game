import { describe, expect, it } from 'vitest';
import { noteUnlocked, unlockHint, type Note } from './notes';

const tests5: Note = { id: 't', tag: '', text: 'x', unlock: { kind: 'tests', count: 5 } };
const streak3: Note = { id: 's', tag: '', text: 'x', unlock: { kind: 'streak', days: 3 } };
const stats = (o: Partial<{ streak: number; longestStreak: number; tests: number }>) => ({ streak: 0, longestStreak: 0, tests: 0, ...o });

describe('notes', () => {
  it('opens a test-count note exactly at the count', () => {
    expect(noteUnlocked(tests5, stats({ tests: 4 }))).toBe(false);
    expect(noteUnlocked(tests5, stats({ tests: 5 }))).toBe(true);
    expect(unlockHint(tests5, stats({ tests: 4 }))).toBe('1 more test to open this');
  });

  it('keeps a streak note open after the streak lapses', () => {
    expect(noteUnlocked(streak3, stats({ streak: 0, longestStreak: 3 }))).toBe(true);
    expect(noteUnlocked(streak3, stats({ streak: 2, longestStreak: 2 }))).toBe(false);
    expect(unlockHint(streak3, stats({ streak: 1, longestStreak: 1 }))).toContain('3 days in a row');
  });
});
