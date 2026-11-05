import { describe, expect, it } from 'vitest';
import { notes } from '../data/notes';
import { packs } from '../data/packs';
import { practiceLevel, practiceWords, wordSource } from './sources';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 2 ** 32;
  return seed / 2 ** 32;
};

describe('adaptive practice', () => {
  it('uses only learned letters for a beginner', () => {
    const source = wordSource({ kind: 'words', count: 25 }, { lessonId: 5, step: 1 }, seeded(1));
    const words = source(60);
    expect(words).toHaveLength(25);
    expect(words.join('')).toMatch(/^[asdfjkl;ghei]+$/);
  });

  it('falls back to lesson drills when there are too few real words', () => {
    const words = wordSource({ kind: 'time', seconds: 30 }, { lessonId: 1, step: 3 }, seeded(2))(60);
    expect(words).toHaveLength(60);
    expect(words.join('')).toMatch(/^[fj]+$/);
  });

  it('opens up to every word once all letters are learned', () => {
    expect(practiceLevel({ lessonId: 12, step: 1 }).letters).toBeNull();
    expect(practiceLevel({ lessonId: 11, step: 8 }).letters?.has('b')).toBe(false);
    expect(practiceWords(practiceLevel({ lessonId: 20, step: 1 })).length).toBeGreaterThan(100);
  });
});

describe('fixed texts', () => {
  it('serves a whole passage for a pack', () => {
    const words = wordSource({ kind: 'pack', packId: 'kdrama' }, { lessonId: 1, step: 1 }, () => 0)(60);
    expect(words.join(' ')).toBe(packs[0]!.passages[0]);
  });

  it('serves the chosen note', () => {
    const note = notes[1]!;
    expect(wordSource({ kind: 'note', noteId: note.id }, { lessonId: 1, step: 1 })(60).join(' ')).toBe(note.text);
  });

  it('builds a weak-key drill', () => {
    const words = wordSource({ kind: 'weak', keys: ['z'] }, { lessonId: 20, step: 1 }, seeded(3))(0);
    expect(words).toHaveLength(25);
  });

  it('fills a fixed word count from drills early on', () => {
    expect(wordSource({ kind: 'words', count: 25 }, { lessonId: 1, step: 1 }, seeded(4))(60)).toHaveLength(25);
  });

  it('throws on unknown lessons, packs and notes', () => {
    const at = { lessonId: 1, step: 1 };
    expect(() => wordSource({ kind: 'lesson', lessonId: 99, step: 1 }, at)).toThrow();
    expect(() => wordSource({ kind: 'pack', packId: 'nope' }, at)).toThrow();
    expect(() => wordSource({ kind: 'note', noteId: 'nope' }, at)).toThrow();
  });

  it('falls back to all words for a weak drill when few are learned', () => {
    expect(wordSource({ kind: 'weak', keys: ['z'] }, { lessonId: 1, step: 1 }, seeded(5))(0)).toHaveLength(25);
  });
});
