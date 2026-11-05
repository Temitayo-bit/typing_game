import { describe, expect, it } from 'vitest';
import type { SavedResult } from './history';
import { MIN_MEASURED_TESTS, MIN_PRESSES, RECENT_TESTS, weakKeys } from './weakKeys';

const times = (n: number, over: Partial<SavedResult>) => Array.from({ length: n }, (_, i) => result({ finishedAt: i, ...over }));

function result(over: Partial<SavedResult>): SavedResult {
  return {
    wpm: 40, rawWpm: 42, accuracy: 95, correctChars: 100, typedChars: 105, durationMs: 30_000,
    missedKeys: {}, wpmBySecond: [], mode: 'time-30', finishedAt: 0, ...over,
  };
}

describe('weakKeys', () => {
  it('ranks by miss rate, not by raw misses', () => {
    // e is missed more often but typed far more; q is missed a third of the time.
    const rs = times(MIN_MEASURED_TESTS, { missedKeys: { e: 6, q: 4 }, keyPresses: { e: 300, q: 12 } });
    expect(weakKeys(rs).map((w) => w.key)).toEqual(['q', 'e']);
  });

  it('ignores keys with too few presses or a single slip', () => {
    const rs = [result({ missedKeys: { z: 3, x: 1 }, keyPresses: { z: MIN_PRESSES - 1, x: 50 } }), ...times(MIN_MEASURED_TESTS - 1, { keyPresses: { z: 0 } })];
    expect(weakKeys(rs)).toEqual([]);
  });

  it('only looks at recent tests', () => {
    const old = Array.from({ length: RECENT_TESTS }, (_, i) => result({ finishedAt: i, missedKeys: { k: 5 }, keyPresses: { k: 20 } }));
    const fresh = Array.from({ length: RECENT_TESTS }, (_, i) => result({ finishedAt: 1000 + i, missedKeys: { j: 2 }, keyPresses: { j: 20, k: 20 } }));
    expect(weakKeys([...old, ...fresh]).map((w) => w.key)).toEqual(['j']);
  });

  it('sums presses and misses across tests', () => {
    const rs = [
      result({ finishedAt: 99, missedKeys: { a: 1 }, keyPresses: { a: 5 } }),
      result({ finishedAt: 98, missedKeys: { a: 2 }, keyPresses: { a: 7 } }),
      ...times(MIN_MEASURED_TESTS - 2, { keyPresses: { a: 0 } }),
    ];
    expect(weakKeys(rs)).toEqual([{ key: 'a', misses: 3, presses: 12 }]);
  });

  it('keeps using old results until enough new tests have press counts', () => {
    const old = times(10, { missedKeys: { k: 3 } });
    const fresh = times(MIN_MEASURED_TESTS - 1, { finishedAt: 100, missedKeys: { j: 2 }, keyPresses: { j: 20 } });
    expect(weakKeys([...old, ...fresh])[0]?.key).toBe('k');
    const more = [...fresh, result({ finishedAt: 200, keyPresses: { j: 20 } })];
    expect(weakKeys([...old, ...more]).map((w) => w.key)).toEqual(['j']);
  });

  it('falls back to raw misses when only old results exist', () => {
    const rs = [result({ missedKeys: { e: 2, a: 1 } }), result({ missedKeys: { e: 1, t: 3 } })];
    expect(weakKeys(rs, 2)).toEqual([{ key: 'e', misses: 3 }, { key: 't', misses: 3 }]);
  });
});
