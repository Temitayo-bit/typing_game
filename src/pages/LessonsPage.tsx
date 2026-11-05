import { levels, lessons, STEPS_PER_LESSON } from '../data/lessons';
import type { SavedResult } from '../lib/history';
import { lessonStatus, type StepRef } from '../lib/progress';
import type { Route } from '../lib/route';

type Props = { results: SavedResult[]; unlocked: StepRef; go: (r: Route) => void };

export function LessonsPage({ results, unlocked, go }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="m-0 font-display text-[34px] font-semibold">Learn to type, one row at a time</h1>
        <p className="m-0 mt-1 text-muted">20 lessons in 5 levels. Each lesson has {STEPS_PER_LESSON} practices, and 90% accuracy unlocks the next one.</p>
      </div>
      {levels.map((level) => (
        <section key={level.id} className="flex flex-col gap-3">
          <h2 className="m-0 font-display text-xl font-semibold">
            <span className="text-berry">Level {level.id}</span> · {level.title}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {lessons
              .filter((l) => l.level === level.id)
              .map((l) => {
                const status = lessonStatus(results, l.id, unlocked);
                const locked = status.state === 'locked';
                const current = l.id === unlocked.lessonId && status.state !== 'done';
                return (
                  <button
                    key={l.id}
                    disabled={locked}
                    onClick={() => go({ page: 'lesson', lessonId: l.id })}
                    className={`flex items-center gap-3.5 rounded-[18px] border border-line p-4 text-left transition ${
                      current ? 'bg-petal' : 'bg-white'
                    } ${locked ? 'cursor-not-allowed opacity-70' : 'hover:border-rose'}`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold ${
                        status.state === 'done' ? 'bg-[#CDEFD9] text-[#1E5C3A]' : current ? 'bg-accent text-white' : 'bg-line text-muted'
                      }`}
                    >
                      {locked ? <Lock /> : l.id}
                    </span>
                    <span className="flex-1">
                      <span className="block font-bold">{l.title}</span>
                      <span className="block text-sm text-muted">
                        {status.state === 'done'
                          ? `Done · best ${Math.round(status.bestAccuracy ?? 0)}% accuracy`
                          : locked
                            ? 'Locked'
                            : `${status.passedSteps} of ${STEPS_PER_LESSON} practices`}
                      </span>
                    </span>
                  </button>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Lock() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-label="locked">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
