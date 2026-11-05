import { useLayoutEffect, useRef, useState } from 'react';
import type { TestState } from '../game/engine';

const LINE_HEIGHT_REM = 2.9;

export function WordsView({ test, faded }: { test: TestState; faded: boolean }) {
  const activeRef = useRef<HTMLSpanElement>(null);
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    const el = activeRef.current;
    if (!el) return;
    const lineTop = el.offsetTop;
    const lineHeightPx = el.offsetHeight || 1;
    // Keep the active word on the second visible line once past the first.
    setOffset(Math.max(0, lineTop - lineHeightPx));
  }, [test.wordIndex]);

  return (
    <div
      className={`relative overflow-hidden font-mono text-[26px] tracking-[0.01em] transition-opacity ${faded ? 'opacity-40 blur-[1px]' : ''}`}
      style={{ height: `${LINE_HEIGHT_REM * 3}rem`, lineHeight: `${LINE_HEIGHT_REM}rem` }}
      role="region"
      aria-label="Text to type"
    >
      <div className="flex flex-wrap gap-x-[0.6em]" style={{ transform: `translateY(-${offset}px)` }}>
        {test.targets.map((target, i) => (
          <Word
            key={i}
            target={target}
            typed={test.typed[i]}
            active={i === test.wordIndex && test.status !== 'finished'}
            committed={i < test.wordIndex}
            ref={i === test.wordIndex ? activeRef : undefined}
          />
        ))}
      </div>
    </div>
  );
}

type WordProps = {
  target: string;
  typed: string | undefined;
  active: boolean;
  committed: boolean;
  ref?: React.Ref<HTMLSpanElement>;
};

function Word({ target, typed, active, committed, ref }: WordProps) {
  const text = typed ?? '';
  const wrong = committed && text !== target;
  const extra = text.slice(target.length);
  return (
    <span ref={ref} className={`relative ${wrong ? 'underline decoration-error decoration-2 underline-offset-8' : ''}`}>
      {[...target].map((ch, i) => (
        <span key={i} className={`relative ${charClass(ch, text[i])}`}>
          {active && i === text.length && <Caret />}
          {ch}
        </span>
      ))}
      {[...extra].map((ch, i) => (
        <span key={`x${i}`} className="text-error/70">{ch}</span>
      ))}
      {active && text.length >= target.length && (
        <span className="relative inline-block w-0">
          <Caret />
        </span>
      )}
    </span>
  );
}

function charClass(expected: string, typed: string | undefined): string {
  if (typed === undefined) return 'text-faint';
  return typed === expected ? 'text-ink' : 'text-error underline decoration-2';
}

function Caret() {
  return <span className="caret-blink absolute -left-px top-[0.4em] h-[1.1em] w-[3px] rounded bg-accent" />;
}
