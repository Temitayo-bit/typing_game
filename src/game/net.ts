/**
 * Characters that count toward net WPM: every correctly typed word plus the
 * space after it, plus the correct prefix of a word still in progress.
 */
export function netChars(targets: readonly string[], typed: readonly string[], wordIndex: number): number {
  let total = 0;
  typed.forEach((word, i) => {
    const target = targets[i] ?? '';
    const committed = i < wordIndex;
    if (word === target) total += target.length + (committed ? 1 : 0);
    else if (!committed && target.startsWith(word)) total += word.length;
  });
  return total;
}
