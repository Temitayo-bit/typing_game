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
  mode: string; finished_at: number; wpm: number; raw_wpm: number; accuracy: number; correct_chars: number;
  typed_chars: number; duration_ms: number; missed_keys: unknown; wpm_by_second: unknown;
};

export function toRow(r: SavedResult): Row {
  return {
    mode: r.mode, finished_at: r.finishedAt, wpm: r.wpm, raw_wpm: r.rawWpm, accuracy: r.accuracy,
    correct_chars: r.correctChars, typed_chars: r.typedChars, duration_ms: r.durationMs,
    missed_keys: r.missedKeys, wpm_by_second: r.wpmBySecond,
  };
}

/** Rows come from the network, so they go through the same validation as an imported file. */
export function fromRows(rows: readonly Row[]): SavedResult[] {
  return parseExport({
    version: 1,
    results: rows.map((w) => ({
      mode: w.mode, finishedAt: Number(w.finished_at), wpm: w.wpm, rawWpm: w.raw_wpm, accuracy: w.accuracy,
      correctChars: w.correct_chars, typedChars: w.typed_chars, durationMs: w.duration_ms,
      missedKeys: w.missed_keys, wpmBySecond: w.wpm_by_second,
    })),
  });
}

const COLUMNS = 'mode, finished_at, wpm, raw_wpm, accuracy, correct_chars, typed_chars, duration_ms, missed_keys, wpm_by_second';

async function upload(results: readonly SavedResult[]): Promise<void> {
  if (!supabase || results.length === 0) return;
  const { error } = await supabase
    .from('results')
    .upsert(results.map(toRow), { onConflict: 'user_id,finished_at,mode', ignoreDuplicates: true });
  if (error) throw new Error("Couldn't back up results");
}

/** Two-way merge for the signed-in account. Returns how many results came down from the server. */
export async function syncResults(): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase.from('results').select(COLUMNS).order('finished_at').limit(10_000);
  if (error) throw new Error("Couldn't reach the server");
  const remote = fromRows(data as Row[]);
  const pulled = await addMissing(remote);
  await upload(missingFrom(await loadResults(), remote));
  return pulled;
}

export function backUpResult(r: SavedResult): Promise<void> {
  return upload([r]);
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
