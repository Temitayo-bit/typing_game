export type Random = () => number;

export function pickWords(source: readonly string[], count: number, random: Random = Math.random): string[] {
  if (source.length === 0) throw new Error('Word source is empty');
  const words: string[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.floor(random() * source.length);
    let word = source[index]!;
    // Avoid the same word twice in a row by walking forward to the next different one.
    for (let step = 1; word === words[i - 1] && step < source.length; step++) {
      word = source[(index + step) % source.length]!;
    }
    words.push(word);
  }
  return words;
}

export function splitText(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}
