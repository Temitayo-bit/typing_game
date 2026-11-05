import { addMissing, loadResults, parseExport, type SavedResult } from './history';
import { parseSettings, type Settings } from './settings';
import { supabase } from './supabase';

// Local storage is the source of truth while she types; the server is a backup that
// follows. Results are keyed by finish time + mode, so re-sending one is harmless.

const key = (r: Pick<SavedResult, 'finishedAt' | 'mode'>) => `${r.finishedAt}|${r.mode}`;

/** Results in `a` that `b` doesn't have yet. */
export function missingFrom<T extends Pick<SavedResult, 'finishedAt' | 'mode'>>(a: readonly T[], b: readonly Pick<SavedResult, 'finishedAt' | 'mode'>[]): T[] {
  const have = new Set(b.map(key));
  return a.filter((r) => !have.has(key(r)));
}

type Row = {
  user_id?: string; mode: string; finished_at: number; wpm: number; raw_wpm: number; accuracy: number; correct_chars: number;
  typed_chars: number; duration_ms: number; missed_keys: unknown; wpm_by_second: unknown; text_keys?: unknown;
};

export function toRow(r: SavedResult, userId?: string): Row {
  return {
    ...(userId ? { user_id: userId } : {}),
    // Durations come from performance.now() and can be fractional; the columns are integers.
    mode: r.mode, finished_at: Math.round(r.finishedAt), wpm: r.wpm, raw_wpm: r.rawWpm, accuracy: r.accuracy,
    correct_chars: Math.round(r.correctChars), typed_chars: Math.round(r.typedChars), duration_ms: Math.round(r.durationMs),
    missed_keys: r.missedKeys, wpm_by_second: r.wpmBySecond, text_keys: r.textKeys ?? [],
  };
}

/** Rows come from the network, so they go through the same validation as an imported file. */
export function fromRows(rows: readonly Row[]): SavedResult[] {
  return parseExport({
    version: 1,
    results: rows.map((w) => ({
      mode: w.mode, finishedAt: Number(w.finished_at), wpm: w.wpm, rawWpm: w.raw_wpm, accuracy: w.accuracy,
      correctChars: w.correct_chars, typedChars: w.typed_chars, durationMs: w.duration_ms,
      missedKeys: w.missed_keys, wpmBySecond: w.wpm_by_second, textKeys: w.text_keys,
    })),
  });
}

const COLUMNS = 'mode, finished_at, wpm, raw_wpm, accuracy, correct_chars, typed_chars, duration_ms, missed_keys, wpm_by_second, text_keys';

// The user id is sent explicitly so a session that changed mid-sync is rejected by RLS
// instead of filing one account's results under another.
async function upload(userId: string, results: readonly SavedResult[]): Promise<void> {
  if (!supabase || results.length === 0) return;
  const { error } = await supabase
    .from('results')
    .upsert(results.map((r) => toRow(r, userId)), { onConflict: 'user_id,finished_at,mode', ignoreDuplicates: true });
  if (error) throw new Error("Couldn't back up results");
}

/** Two-way merge for the signed-in account. Returns how many results came down from the server. */
const PAGE = 1000; // PostgREST's default row cap per request

export async function syncResults(userId: string, stillCurrent: () => boolean): Promise<number> {
  if (!supabase) return 0;
  const remote: SavedResult[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('results')
      .select(COLUMNS)
      .eq('user_id', userId)
      .order('finished_at')
      .range(from, from + PAGE - 1);
    if (error) throw new Error("Couldn't reach the server");
    remote.push(...fromRows(data as Row[]));
    if (data.length < PAGE) break;
  }
  // The account may have changed while we were waiting; never write into someone else's store.
  if (!stillCurrent()) return 0;
  const pulled = await addMissing(remote);
  if (!stillCurrent()) return pulled;
  await upload(userId, missingFrom(await loadResults(), remote));
  return pulled;
}

export function backUpResult(userId: string, r: SavedResult): Promise<void> {
  return upload(userId, [r]);
}

export async function pullSettings(): Promise<Settings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('settings').select('sounds, music, theme').maybeSingle();
  if (error) throw new Error("Couldn't load settings");
  return data ? parseSettings(JSON.stringify(data)) : null;
}

export async function pushSettings(s: Settings): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('settings').upsert({ ...s, updated_at: new Date().toISOString() });
  if (error) throw new Error("Couldn't save settings");
}
