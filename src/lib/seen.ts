import { lessons } from '../data/lessons';
import { packs } from '../data/packs';

/** Lowercase letters and digits only, so a passage matches however it was capitalised or punctuated. */
function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** A short stable id for a passage (FNV-1a), so history stores ids instead of whole texts. */
export function textKey(passage: string): string {
  let h = 0x811c9dc5;
  for (const ch of normalise(passage)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

const known = [...new Set([...packs.flatMap((p) => p.passages), ...lessons.flatMap((l) => l.passages ?? [])])]
  .map((p) => ({ text: ` ${normalise(p)} `, key: textKey(p) }))
  .filter((p) => p.text.trim().length > 0);

/** Ids of every known passage typed in full in these words. */
export function passagesIn(words: readonly string[]): string[] {
  const typed = ` ${normalise(words.join(' '))} `;
  return [...new Set(known.filter((p) => typed.includes(p.text)).map((p) => p.key))];
}

/** Every passage id in a history. */
export function seenTexts(results: readonly { textKeys?: readonly string[] }[]): Set<string> {
  return new Set(results.flatMap((r) => r.textKeys ?? []));
}

/** Passages not typed yet; once every one has been typed, all of them come round again. */
export function unseen(passages: readonly string[], seen: ReadonlySet<string>): string[] {
  const fresh = passages.filter((p) => !seen.has(textKey(p)));
  return fresh.length > 0 ? fresh : [...passages];
}
