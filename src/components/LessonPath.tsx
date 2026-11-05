import { lessons, passWpm, PASS_ACCURACY } from '../data/lessons';

type Props = { unlocked: number; current: number; onSelect: (id: number) => void };

export function LessonPath({ unlocked, current, onSelect }: Props) {
  const lesson = lessons.find((l) => l.id === current);
  return (
    <nav className="space-y-3 text-center" aria-label="Lessons">
      <div className="flex flex-wrap justify-center gap-2">
        {lessons.map((l) => {
          const locked = l.id > unlocked;
          return (
            <button
              key={l.id}
              disabled={locked}
              aria-pressed={l.id === current}
              title={locked ? 'pass the lesson before to unlock' : l.title}
              onClick={(e) => {
                onSelect(l.id);
                e.currentTarget.blur();
              }}
              className={`h-10 w-10 rounded-full text-sm font-bold transition ${
                l.id === current
                  ? 'bg-blush-500 text-white shadow'
                  : locked
                    ? 'cursor-not-allowed bg-white/40 text-blush-200'
                    : l.id < unlocked
                      ? 'bg-blush-200 text-blush-700 hover:bg-blush-300'
                      : 'bg-white/80 text-blush-600 hover:bg-blush-100'
              }`}
            >
              {locked ? '🔒' : l.id}
            </button>
          );
        })}
      </div>
      {lesson && (
        <p className="text-blush-700">
          <span className="font-semibold">Lesson {lesson.id}: {lesson.title}</span>
          {' · new keys '}
          {lesson.newKeys.map((k) => (
            <kbd key={k} className="mx-0.5 rounded-md bg-white px-2 py-0.5 font-mono shadow-sm">{k}</kbd>
          ))}
          <span className="block text-sm text-blush-700/80">
            pass with {PASS_ACCURACY}% accuracy and {passWpm(lesson.id)} wpm. keep your fingers on the bumps of f and j
          </span>
        </p>
      )}
    </nav>
  );
}
