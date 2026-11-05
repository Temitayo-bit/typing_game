import type { SavedResult } from './history';

export type WeakKey = {
  key: string;
  misses: number;
  /** Missing when only old results (saved before presses were counted) are available. */
  presses?: number;
};

/** Only recent tests count, so a key she has since fixed drops off the list. */
export const RECENT_TESTS = 20;
/** Fewer presses than this is too little to judge a key by. */
export const MIN_PRESSES = 10;
/** Until this many recent tests carry press counts, old results (raw misses) still decide. */
export const MIN_MEASURED_TESTS = 5;
/** One slip is not a weakness. */
export const MIN_MISSES = 2;

/** Keys she misses most often, worst first, judged by miss rate over her recent tests. */
export function weakKeys(results: readonly SavedResult[], limit = 5): WeakKey[] {
  const recent = [...results].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, RECENT_TESTS);
  const measured = recent.filter((r) => r.keyPresses);
  if (measured.length < MIN_MEASURED_TESTS) return byMisses(recent, limit);

  const misses = sum(measured.map((r) => r.missedKeys));
  const presses = sum(measured.map((r) => r.keyPresses!));
  return Object.entries(misses)
    .map(([key, n]) => ({ key, misses: n, presses: Math.max(presses[key] ?? 0, n) }))
    .filter((k) => k.presses >= MIN_PRESSES && k.misses >= MIN_MISSES)
    .sort((a, b) => b.misses / b.presses - a.misses / a.presses || b.misses - a.misses)
    .slice(0, limit);
}

export function missRate(k: WeakKey): number | undefined {
  return k.presses ? k.misses / k.presses : undefined;
}

/** Old results only know how often a key was missed, not how often it came up. */
function byMisses(results: readonly SavedResult[], limit: number): WeakKey[] {
  return Object.entries(sum(results.map((r) => r.missedKeys)))
    .filter(([, n]) => n >= MIN_MISSES)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, n]) => ({ key, misses: n }));
}

function sum(maps: readonly Record<string, number>[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const m of maps) for (const [k, n] of Object.entries(m)) totals[k] = (totals[k] ?? 0) + n;
  return totals;
}
