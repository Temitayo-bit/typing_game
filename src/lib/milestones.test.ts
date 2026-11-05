import { describe, expect, it } from 'vitest';
import type { SavedResult } from './history';
import { newMilestones } from './milestones';

function result(over: Partial<SavedResult>): SavedResult {
  return {
    wpm: 10, rawWpm: 12, accuracy: 80, correctChars: 100, typedChars: 105, durationMs: 30_000,
    missedKeys: {}, wpmBySecond: [], mode: 'time-30', finishedAt: new Date(2026, 10, 5).getTime(), ...over,
  };
}

describe('newMilestones', () => {
  it('celebrates the first test once', () => {
    const first = result({});
    expect(newMilestones([], [first]).map((m) => m.id)).toEqual(['first-test']);
    expect(newMilestones([first], [first, result({})])).toEqual([]);
  });

  it('only shows a speed milestone the first time it is crossed', () => {
    const before = [result({ wpm: 25 })];
    const ids = newMilestones(before, [...before, result({ wpm: 41, accuracy: 96 })]).map((m) => m.id);
    expect(ids).toEqual(['wpm-30', 'wpm-40', 'accuracy-95']);
    const later = [...before, result({ wpm: 41 }), result({ wpm: 42 })];
    expect(newMilestones(later.slice(0, 2), later)).toEqual([]);
  });

  it('does not repeat a streak milestone after the streak lapses', () => {
    const day = (d: number) => result({ finishedAt: new Date(2026, 4, d, 12).getTime() });
    const first = [day(3), day(2), day(1)];
    const again = [day(23), day(22), day(21), ...first];
    expect(newMilestones(again.slice(1), again).map((m) => m.id)).not.toContain('streak-3');
  });

  it('ignores lesson drills for speed records', () => {
    expect(newMilestones([result({})], [result({}), result({ mode: 'lesson-1-1', wpm: 90 })])).toEqual([]);
  });

  it('marks a lesson complete when all its practices pass', () => {
    const steps = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => result({ mode: `lesson-2-${s}`, accuracy: 95 }));
    const ids = newMilestones([result({}), ...steps.slice(0, 7)], [result({}), ...steps]).map((m) => m.id);
    expect(ids).toEqual(['lesson-2']);
  });

  it('celebrates a streak the first time it is reached', () => {
    const day = (d: number) => result({ finishedAt: new Date(2026, 4, d, 12).getTime() });
    const rs = [day(3), day(2), day(1)];
    expect(newMilestones(rs.slice(1), rs).map((m) => m.id)).toContain('streak-3');
  });

  it('counts exactly 20 wpm and a perfect run', () => {
    const ids = newMilestones([result({})], [result({}), result({ wpm: 20, accuracy: 100 })]).map((m) => m.id);
    expect(ids).toEqual(['wpm-20', 'accuracy-95', 'accuracy-100']);
  });

  it('completes a lesson only when all 8 steps pass, and only once', () => {
    const step = (s: number, accuracy = 90) => result({ mode: `lesson-1-${s}`, accuracy });
    const seven = [1, 2, 3, 4, 5, 6, 7].map((s) => step(s));
    expect(newMilestones([result({}), ...seven], [result({}), ...seven, step(8, 89)])).toEqual([]);
    const all = [result({}), ...seven, step(8)];
    expect(newMilestones(all.slice(0, -1), all).map((m) => m.id)).toEqual(['lesson-1']);
    expect(newMilestones(all, [...all, step(8)])).toEqual([]);
  });

  it('counts a lesson drill as the first test', () => {
    expect(newMilestones([], [result({ mode: 'lesson-1-1' })]).map((m) => m.id)).toEqual(['first-test']);
  });
});
