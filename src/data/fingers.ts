export type Finger =
  | 'left pinky' | 'left ring' | 'left middle' | 'left index'
  | 'right index' | 'right middle' | 'right ring' | 'right pinky' | 'thumb';

export const keyboardRows = ['1234567890-=', 'qwertyuiop[]', "asdfghjkl;'", 'zxcvbnm,./'];

const byFinger: Record<Finger, string> = {
  'left pinky': '1qaz',
  'left ring': '2wsx',
  'left middle': '3edc',
  'left index': '45rfvtgb',
  'right index': '67yhnujm',
  'right middle': '8ik,',
  'right ring': '9ol.',
  'right pinky': "0p;/'-=[]",
  thumb: ' ',
};

const fingerOf = new Map<string, Finger>(
  (Object.entries(byFinger) as [Finger, string][]).flatMap(([finger, keys]) => [...keys].map((k) => [k, finger])),
);

/** US layout: the character Shift produces on each key. */
const shifted: Record<string, string> = {
  '!': '1', '@': '2', '#': '3', $: '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
  _: '-', '+': '=', '{': '[', '}': ']', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/',
};

/** The physical key for a character, and whether Shift is needed. */
export function keyFor(char: string): { key: string; shift: boolean } {
  if (shifted[char]) return { key: shifted[char], shift: true };
  const lower = char.toLowerCase();
  return { key: lower, shift: lower !== char };
}

export function fingerFor(key: string): Finger | undefined {
  return fingerOf.get(key.toLowerCase());
}

/** Shift is pressed by the little finger of the hand not typing the letter. */
export function shiftHand(key: string): 'left' | 'right' {
  return fingerFor(key)?.startsWith('left') ? 'right' : 'left';
}

export const fingerColor: Record<Finger, string> = {
  'left pinky': '#FFD6E5',
  'left ring': '#FFE9C7',
  'left middle': '#E8D5FF',
  'left index': '#CDEFD9',
  'right index': '#C9E7FF',
  'right middle': '#E8D5FF',
  'right ring': '#FFE9C7',
  'right pinky': '#FFD6E5',
  thumb: '#FFF0F5',
};

/** Every finger pressing down for a character: its key's finger, plus the opposite pinky when Shift is needed. */
export function fingersFor(char: string): Finger[] {
  const { key, shift } = keyFor(char);
  const finger = fingerFor(key);
  if (!finger) return [];
  return shift ? [finger, `${shiftHand(key)} pinky` as const] : [finger];
}

/** Where each finger rests between presses. */
export const homeKey: Record<Finger, string> = {
  'left pinky': 'a', 'left ring': 's', 'left middle': 'd', 'left index': 'f',
  'right index': 'j', 'right middle': 'k', 'right ring': 'l', 'right pinky': ';',
  thumb: ' ',
};
