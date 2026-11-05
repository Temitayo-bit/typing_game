import { describe, expect, it } from 'vitest';
import type { SavedResult } from './history';
import { fromRows, missingFrom, toRow } from './sync';

const r = (over: Partial<SavedResult> = {}): SavedResult => ({
  wpm: 30, rawWpm: 32, accuracy: 95, correctChars: 100, typedChars: 104, durationMs: 30_000,
  missedKeys: { e: 1 }, wpmBySecond: [20, 30], mode: 'time-30', finishedAt: 1_000, ...over,
});

describe('sync', () => {
  it('finds results the other side is missing by finish time and mode', () => {
    const local = [r(), r({ finishedAt: 2_000 }), r({ mode: 'words-10' })];
    expect(missingFrom(local, [r({ wpm: 99 })])).toEqual([local[1], local[2]]);
  });

  it('round-trips a result through a database row', () => {
    expect(fromRows([toRow(r())])).toEqual([r()]);
  });

  it('accepts bigint finish times that arrive as strings', () => {
    const row = { ...toRow(r()), finished_at: '1000' as unknown as number };
    expect(fromRows([row])[0]?.finishedAt).toBe(1000);
  });

  it('rejects malformed rows instead of saving them', () => {
    expect(() => fromRows([{ ...toRow(r()), accuracy: 'high' as unknown as number }])).toThrow();
  });
});
