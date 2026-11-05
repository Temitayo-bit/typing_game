import Dexie, { type EntityTable } from 'dexie';
import type { Result } from '../game/stats';
import { isModeKey, type ModeKey } from './modes';

export type SavedResult = Result & { id?: number; mode: ModeKey; finishedAt: number };

const db = new Dexie('typing-game') as Dexie & { results: EntityTable<SavedResult, 'id'> };
db.version(1).stores({ results: '++id, mode, finishedAt' });

export async function saveResult(result: SavedResult): Promise<void> {
  await db.results.add(result);
}

export async function loadResults(): Promise<SavedResult[]> {
  return db.results.orderBy('finishedAt').reverse().toArray();
}

export async function exportResults(): Promise<string> {
  return JSON.stringify({ version: 1, results: await db.results.toArray() });
}

/** Adds results from an export file, skipping ones already stored. Returns how many were added. */
export async function importResults(json: string): Promise<number> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("That file isn't a progress export");
  }
  const results = parseExport(parsed);
  let added = 0;
  await db.transaction('rw', db.results, async () => {
    for (const r of results) {
      const same = await db.results
        .where('finishedAt')
        .equals(r.finishedAt)
        .filter((e) => e.mode === r.mode && e.wpm === r.wpm)
        .count();
      if (same === 0) {
        await db.results.add(r);
        added++;
      }
    }
  });
  return added;
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
