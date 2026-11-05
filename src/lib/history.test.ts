import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, importResults, loadResults, type SavedResult } from './history';

function result(over: Partial<SavedResult>): SavedResult {
  return {
    wpm: 30, rawWpm: 32, accuracy: 95, correctChars: 100, typedChars: 104, durationMs: 30_000,
    missedKeys: {}, wpmBySecond: [], mode: 'time-30', finishedAt: 1_000, ...over,
  };
}
const file = (results: SavedResult[]) => JSON.stringify({ version: 1, results });

describe('importResults', () => {
  beforeEach(() => db.results.clear());

  it('adds nothing when the same file is imported twice', async () => {
    const json = file([result({}), result({ finishedAt: 2_000 })]);
    expect(await importResults(json)).toBe(2);
    expect(await importResults(json)).toBe(0);
    expect(await loadResults()).toHaveLength(2);
  });

  it('skips duplicates inside one file but keeps a different mode at the same time', async () => {
    expect(await importResults(file([result({}), result({ wpm: 31 }), result({ mode: 'words-10' })]))).toBe(2);
  });

  it('adds nothing when any record is malformed', async () => {
    const json = JSON.stringify({ version: 1, results: [result({}), { wpm: 'fast' }] });
    await expect(importResults(json)).rejects.toThrow();
    expect(await loadResults()).toHaveLength(0);
  });

  it('rejects text that is not JSON', async () => {
    await expect(importResults('not json')).rejects.toThrow("isn't a progress export");
  });
});

describe('switchHistory', () => {
  it('gives each account its own results', async () => {
    const { switchHistory, saveResult } = await import('./history');
    switchHistory('user-a');
    await saveResult(result({ finishedAt: 5 }));
    switchHistory('user-b');
    expect(await loadResults()).toEqual([]);
    switchHistory('user-a');
    expect(await loadResults()).toHaveLength(1);
    switchHistory(null);
  });
});
