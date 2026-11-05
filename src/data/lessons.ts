export type LessonKind = 'keys' | 'shift' | 'punctuation' | 'numbers' | 'sentences';

export type Lesson = {
  id: number;
  level: number;
  title: string;
  kind: LessonKind;
  newKeys: string[];
  tip: string;
};

export const levels = [
  { id: 1, title: 'Home row' },
  { id: 2, title: 'Top row' },
  { id: 3, title: 'Bottom row' },
  { id: 4, title: 'Capitals and punctuation' },
  { id: 5, title: 'Numbers and real text' },
];

/** Classic touch-typing order: home row outwards, then the rows above and below. */
export const lessons: Lesson[] = [
  { id: 1, level: 1, title: 'Find your spot: F and J', kind: 'keys', newKeys: ['f', 'j'], tip: 'Rest your index fingers on F and J. Feel the little bumps? That is home.' },
  { id: 2, level: 1, title: 'Middle fingers: D and K', kind: 'keys', newKeys: ['d', 'k'], tip: 'Your middle fingers sit next to your index fingers, on D and K.' },
  { id: 3, level: 1, title: 'Ring and little fingers', kind: 'keys', newKeys: ['s', 'l', 'a', ';'], tip: 'Ring fingers on S and L, little fingers on A and ;. All eight fingers are home now.' },
  { id: 4, level: 1, title: 'Reach in: G and H', kind: 'keys', newKeys: ['g', 'h'], tip: 'Slide your index fingers one key inwards for G and H, then come straight back.' },
  { id: 5, level: 2, title: 'Reach up: E and I', kind: 'keys', newKeys: ['e', 'i'], tip: 'Left middle finger reaches up for E, right middle finger for I.' },
  { id: 6, level: 2, title: 'Reach up: R and U', kind: 'keys', newKeys: ['r', 'u'], tip: 'Index fingers reach up and slightly left for R and U.' },
  { id: 7, level: 2, title: 'Reach up: T, Y, W and O', kind: 'keys', newKeys: ['t', 'y', 'w', 'o'], tip: 'Index fingers stretch up and in for T and Y; ring fingers reach up for W and O.' },
  { id: 8, level: 2, title: 'Reach up: Q and P', kind: 'keys', newKeys: ['q', 'p'], tip: 'Little fingers reach up for Q and P. Keep the other fingers home.' },
  { id: 9, level: 3, title: 'Reach down: V and M', kind: 'keys', newKeys: ['v', 'm'], tip: 'Index fingers curl down for V and M.' },
  { id: 10, level: 3, title: 'Reach down: C, X, comma, full stop', kind: 'keys', newKeys: ['c', 'x', ',', '.'], tip: 'Middle fingers curl down for C and comma, ring fingers for X and full stop.' },
  { id: 11, level: 3, title: 'Reach down: Z and slash', kind: 'keys', newKeys: ['z', '/'], tip: 'Little fingers curl down for Z and /.' },
  { id: 12, level: 3, title: 'Last letters: B and N', kind: 'keys', newKeys: ['b', 'n'], tip: 'Left index reaches down and in for B, right index down for N. That is every letter!' },
  { id: 13, level: 4, title: 'Capitals with Shift', kind: 'shift', newKeys: [], tip: 'Hold Shift with the little finger of the other hand, then press the letter.' },
  { id: 14, level: 4, title: 'Names and places', kind: 'shift', newKeys: [], tip: 'More capitals. Let go of Shift as soon as the letter is down.' },
  { id: 15, level: 4, title: "Quotes and questions: ' and ?", kind: 'punctuation', newKeys: ["'", '?'], tip: "Right little finger: ' is next to ;, and ? is Shift + /." },
  { id: 16, level: 4, title: 'Punctuation practice', kind: 'punctuation', newKeys: [], tip: 'Commas, full stops, quotes and questions all together.' },
  { id: 17, level: 5, title: 'Numbers 1 to 5', kind: 'numbers', newKeys: ['1', '2', '3', '4', '5'], tip: 'Left hand reaches up two rows: little finger 1, ring 2, middle 3, index 4 and 5.' },
  { id: 18, level: 5, title: 'Numbers 6 to 0', kind: 'numbers', newKeys: ['6', '7', '8', '9', '0'], tip: 'Right hand: index 6 and 7, middle 8, ring 9, little finger 0.' },
  { id: 19, level: 5, title: 'Real sentences', kind: 'sentences', newKeys: [], tip: 'Full sentences about things you love. Steady and accurate.' },
  { id: 20, level: 5, title: 'The final stretch', kind: 'sentences', newKeys: [], tip: 'Longer passages. Finish this and you are a touch typist.' },
];

export const STEPS_PER_LESSON = 8;
export const STEP_WORDS = 20;
export const PASS_ACCURACY = 90;

export function keysUpTo(lessonId: number): Set<string> {
  return new Set(lessons.filter((l) => l.id <= lessonId).flatMap((l) => l.newKeys));
}

export function findLesson(id: number): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}

/** Extra beginner-friendly words so early lessons still use real words. */
export const lessonWordPool = `a as ad add all ask asks fad fall falls flask lad lads lass sad salad dad dads ja la sala alfalfa
gas glad flag hall half has had dash hash shall flash slash lash sash
see sea seed feel feed fee field fill kid kids lid side slide ideal deal deals idle hike like likes
red read rid ride rule sure dues fur fuel hurt use user rude sugar real fire dear jade lure
the tie tea that this they yet try type tree art eat hat sit sky style dirty kitty truly
we wet wow owl low slow word work world worth two too foot food root roof yellow follow
quiet quite equal paper people pop top tip trip spot spirit happy quote quietly
move movie view very ever even mom me my time more simply value five love lovely
cat cake cool could cozy cute catch call ice nice coffee
fix six box text extra taxi relax
zoo lazy zero crazy fizz quiz
nab bun bean been blue book brown be bad bed bank banana fun sun run nan man`.split(/\s+/);

/** Short contractions and questions for the punctuation lesson. */
export const punctuationPool = [
  "don't", "it's", "you're", "i'm", "we're", "can't", "that's", "let's", "she's", "isn't",
  'ready?', 'why?', 'really?', 'how?', 'what?', 'tonight?', 'coffee?', 'sushi?', 'now?', 'yes?',
];
