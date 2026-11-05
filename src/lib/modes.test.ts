import { describe, expect, it } from 'vitest';
import { engineMode, isLessonKey, isModeKey, isSpeedTest, modeLabel, selectionKey } from './modes';

describe('selectionKey', () => {
  it('gives a stable key for each kind', () => {
    expect(selectionKey({ kind: 'time', seconds: 30 })).toBe('time-30');
    expect(selectionKey({ kind: 'words', count: 25 })).toBe('words-25');
    expect(selectionKey({ kind: 'pack', packId: 'kdrama' })).toBe('pack-kdrama');
    expect(selectionKey({ kind: 'lesson', lessonId: 3, step: 2 })).toBe('lesson-3-2');
    expect(selectionKey({ kind: 'weak', keys: ['e'] })).toBe('weak-keys');
    expect(selectionKey({ kind: 'note', noteId: 'first-date' })).toBe('note-first-date');
  });

  it('round-trips through isModeKey', () => {
    for (const k of ['time-30', 'words-10', 'pack-from-me', 'lesson-15-5', 'weak-keys', 'note-a1']) {
      expect(isModeKey(k)).toBe(true);
    }
    for (const k of ['bogus', 'time-', 'lesson-1', 'lesson-1.5-2', 'pack-', 'note-', 3, null]) {
      expect(isModeKey(k)).toBe(false);
    }
  });

  it('classifies keys', () => {
    expect(isLessonKey('lesson-2-1')).toBe(true);
    expect(isLessonKey('time-15')).toBe(false);
    expect(isSpeedTest('time-15')).toBe(true);
    expect(isSpeedTest('pack-food')).toBe(true);
    expect(isSpeedTest('lesson-2-1')).toBe(false);
    expect(isSpeedTest('weak-keys')).toBe(false);
  });

  it('labels keys for people', () => {
    expect(modeLabel('time-30')).toBe('30s');
    expect(modeLabel('words-50')).toBe('50 words');
    expect(modeLabel('lesson-3-2')).toBe('lesson 3.2');
    expect(modeLabel('pack-modern-family')).toBe('modern family');
  });
});

describe('engineMode', () => {
  it('only time selections are timed', () => {
    expect(engineMode({ kind: 'time', seconds: 60 })).toEqual({ kind: 'time', seconds: 60 });
    expect(engineMode({ kind: 'lesson', lessonId: 1, step: 1 })).toEqual({ kind: 'text' });
    expect(engineMode({ kind: 'pack', packId: 'food' })).toEqual({ kind: 'text' });
  });
});
