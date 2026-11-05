import Dexie, { type EntityTable } from 'dexie';
import type { Result } from '../game/stats';
import { isModeKey, type ModeKey } from './modes';

export type SavedResult = Result & { id?: number; mode: ModeKey; finishedAt: number };

type HistoryDb = Dexie & { results: EntityTable<SavedResult, 'id'> };

function openDb(name: string): HistoryDb {
  const d = new Dexie(name) as HistoryDb;
  d.version(1).stores({ results: '++id, mode, finishedAt' });
  return d;
}

/** The store in use. Each signed-in account gets its own, so two people on one browser never mix. */
export let db: HistoryDb = openDb('typing-game');

export function switchHistory(userId: string | null): void {
  const name = userId ? `typing-game-${userId}` : 'typing-game';
  if (db.name === name) return;
  // The old handle isn't closed: a save still finishing for the previous account completes
  // into its own store instead of failing.
  db = openDb(name);
}

const LEGACY_CLAIMED = 'typing-game-legacy-claimed';

/**
 * Results saved before accounts existed live in the shared store. The first account to sign
 * in on this browser takes them over, once, so nobody's earlier progress disappears.
 */
export async function claimLegacyResults(userId: string): Promise<void> {
  try {
    if (localStorage.getItem(LEGACY_CLAIMED)) return;
    localStorage.setItem(LEGACY_CLAIMED, userId);
  } catch {
    return;
  }
  const legacy = openDb('typing-game');
  try {
    const old = await legacy.results.toArray();
    if (old.length > 0) await addMissing(old);
  } finally {
    legacy.close();
  }
}

/** Adds results that aren't stored yet (same finish time and mode). Returns how many were added. */
export async function addMissing(results: readonly SavedResult[]): Promise<number> {
  let added = 0;
  await db.transaction('rw', db.results, async () => {
    for (const r of results) {
      const same = await db.results.where('finishedAt').equals(r.finishedAt).filter((e) => e.mode === r.mode).count();
      if (same === 0) {
        const { id: _id, ...rest } = r;
        await db.results.add(rest);
        added++;
      }
    }
  });
  return added;
}

export async function saveResult(result: SavedResult): Promise<void> {
  await db.results.add(result);
}

export async function loadResults(): Promise<SavedResult[]> {
  return db.results.orderBy('finishedAt').reverse().toArray();
}

export async function exportResults(): Promise<string> {
  return JSON.stringify({ version: 1, results: await db.results.toArray() });
}

/** Adds results from an export file, skipping ones already stored (same finish time and mode). */
export async function importResults(json: string): Promise<number> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("That file isn't a progress export");
  }
  return addMissing(parseExport(parsed));
}

export function parseExport(value: unknown): SavedResult[] {
  if (!isRecord(value) || value.version !== 1 || !Array.isArray(value.results)) {
    throw new Error("That file isn't a progress export");
  }
  return value.results.map((r: unknown, i) => {
    const parsed = parseResult(r);
    if (!parsed) throw new Error(`Result ${i + 1} in the file is malformed`);
    return parsed;
  });
}

function parseResult(r: unknown): SavedResult | null {
  if (!isRecord(r)) return null;
  const { wpm, rawWpm, accuracy, correctChars, typedChars, durationMs, missedKeys, wpmBySecond, mode, finishedAt } = r;
  if (!isNumber(wpm) || !isNumber(rawWpm) || !isNumber(accuracy) || !isNumber(correctChars)) return null;
  if (!isNumber(typedChars) || !isNumber(durationMs) || !isNumber(finishedAt)) return null;
  if (!isModeKey(mode) || !isCountMap(missedKeys)) return null;
  if (!Array.isArray(wpmBySecond) || !wpmBySecond.every(isNumber)) return null;
  return {
    wpm,
    rawWpm,
    accuracy,
    correctChars,
    typedChars,
    durationMs,
    finishedAt,
    mode,
    missedKeys,
    wpmBySecond,
  };
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isCountMap(v: unknown): v is Record<string, number> {
  return isRecord(v) && !Array.isArray(v) && Object.values(v).every(isNumber);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
