export type NoteUnlock = { kind: 'start' } | { kind: 'streak'; days: number } | { kind: 'tests'; count: number };

export type NoteStats = { streak: number; longestStreak: number; tests: number };

export type Note = { id: string; tag: string; text: string; unlock: NoteUnlock };

/**
 * Love notes she unlocks by practising. PLACEHOLDERS: replace each `text`
 * with a real note before giving her the app; keep ids stable once she has used it.
 */
export const notes: Note[] = [
  { id: 'hello', tag: 'Welcome', text: 'i made this just for you, so every word you type here is a little bit of me cheering you on', unlock: { kind: 'start' } },
  { id: 'first-date', tag: 'The first date', text: 'you ordered for both of us and somehow got it exactly right, and i knew then that i was in trouble', unlock: { kind: 'tests', count: 5 } },
  { id: 'little-things', tag: 'Little things', text: 'i love the way you laugh at your own jokes before you even finish telling them', unlock: { kind: 'streak', days: 3 } },
  { id: 'proud', tag: 'Proud of you', text: 'look how far you have come, one key at a time, and you never gave up on a single lesson', unlock: { kind: 'tests', count: 15 } },
  { id: 'week', tag: 'One whole week', text: 'seven days in a row, you are officially more consistent than my gym routine', unlock: { kind: 'streak', days: 7 } },
  { id: 'thirty', tag: 'Test number 30', text: 'thirty tests done, so here is a reminder that you are brilliant at everything you decide to learn', unlock: { kind: 'tests', count: 30 } },
];

export function noteUnlocked(note: Note, stats: NoteStats): boolean {
  switch (note.unlock.kind) {
    case 'start':
      return true;
    case 'streak':
      return stats.longestStreak >= note.unlock.days;
    case 'tests':
      return stats.tests >= note.unlock.count;
  }
}

export function unlockHint(note: Note, stats: NoteStats): string {
  switch (note.unlock.kind) {
    case 'start':
      return '';
    case 'streak': {
      const left = note.unlock.days - stats.streak;
      return `practise ${note.unlock.days} days in a row to open this (${left} to go)`;
    }
    case 'tests': {
      const left = note.unlock.count - stats.tests;
      return `${left} more test${left === 1 ? '' : 's'} to open this`;
    }
  }
}

/** Short cheers shown on the results screen. */
export const cheers = [
  'faster than yesterday and you barely looked at the keys. proud of you, babe.',
  'every test is a tiny step. you are taking so many of them.',
  'your fingers are learning even when it feels slow. keep going, pretty.',
  'that was lovely. one more?',
  'if typing were a k-drama, this is the episode where you win.',
];
