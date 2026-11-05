import { describe, expect, it } from 'vitest';
import type { SavedResult } from './history';
import { MIN_PRESSES, RECENT_TESTS, weakKeys } from './weakKeys';

function result(over: Partial<SavedResult>): SavedResult {
  return {
    wpm: 40, rawWpm: 42, accuracy: 95, correctChars: 100, typedChars: 105, durationMs: 30_000,
    missedKeys: {}, wpmBySecond: [], mode: 'time-30', finishedAt: 0, ...over,
  };
}

describe('weakKeys', () => {
  it('ranks by miss rate, not by raw misses', () => {
    // e is missed more often but typed far more; q is missed a third of the time.
    const rs = [result({ missedKeys: { e: 6, q: 4 }, keyPresses: { e: 300, q: 12 } })];
    expect(weakKeys(rs).map((w) => w.key)).toEqual(['q', 'e']);
  });

  it('ignores keys with too few presses or a single slip', () => {
    const rs = [result({ missedKeys: { z: 3, x: 1 }, keyPresses: { z: MIN_PRESSES - 1, x: 50 } })];
    expect(weakKeys(rs)).toEqual([]);
  });

  it('only looks at recent tests', () => {
    const old = Array.from({ length: RECENT_TESTS }, (_, i) => result({ finishedAt: i, missedKeys: { k: 5 }, keyPresses: { k: 20 } }));
    const fresh = Array.from({ length: RECENT_TESTS }, (_, i) => result({ finishedAt: 1000 + i, missedKeys: { j: 2 }, keyPresses: { j: 20, k: 20 } }));
    expect(weakKeys([...old, ...fresh]).map((w) => w.key)).toEqual(['j']);
  });

  it('sums presses and misses across tests', () => {
    const rs = [
      result({ finishedAt: 2, missedKeys: { a: 1 }, keyPresses: { a: 5 } }),
      result({ finishedAt: 1, missedKeys: { a: 2 }, keyPresses: { a: 7 } }),
    ];
    expect(weakKeys(rs)).toEqual([{ key: 'a', misses: 3, presses: 12 }]);
  });

  it('falls back to raw misses when only old results exist', () => {
    const rs = [result({ missedKeys: { e: 2, a: 1 } }), result({ missedKeys: { e: 1, t: 3 } })];
    expect(weakKeys(rs, 2)).toEqual([{ key: 'e', misses: 3 }, { key: 't', misses: 3 }]);
  });
});
