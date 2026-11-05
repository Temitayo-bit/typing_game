import type { Route } from '../lib/route';
import { Heart } from './ui';

const links: { label: string; route: Route; match: Route['page'][] }[] = [
  { label: 'Home', route: { page: 'home' }, match: ['home'] },
  { label: 'Practice', route: { page: 'practice' }, match: ['practice'] },
  { label: 'Lessons', route: { page: 'lessons' }, match: ['lessons', 'lesson', 'exam'] },
  { label: 'Progress', route: { page: 'progress' }, match: ['progress'] },
  { label: 'From me', route: { page: 'notes' }, match: ['notes'] },
];

type Props = { route: Route; go: (r: Route) => void; name: string; photo: string | null };

export function Header({ route, go, name, photo }: Props) {
  return (
    <header className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 border-b border-line bg-white px-4 py-4 sm:flex sm:justify-between sm:px-10 sm:py-5">
      <button onClick={() => go({ page: 'home' })} className="flex items-center gap-2.5 font-display text-[22px] font-semibold text-berry">
        <Heart />
        keys &amp; kisses
      </button>
      <nav className="order-last col-span-2 flex flex-wrap gap-1.5 sm:order-none sm:col-span-1 text-[15px] font-bold" aria-label="Main">
        {links.map((l) => {
          const active = l.match.includes(route.page);
          return (
            <button
              key={l.label}
              onClick={(e) => {
                go(l.route);
                e.currentTarget.blur();
              }}
              aria-current={active ? 'page' : undefined}
              className={`min-h-11 rounded-full px-4 py-2.5 ${active ? 'bg-petal text-wine' : 'text-muted hover:bg-cream'}`}
            >
              {l.label}
            </button>
          );
        })}
      </nav>
      <button
        onClick={() => go({ page: 'profile' })}
        aria-label={`Profile and settings for ${name}`}
        aria-current={route.page === 'profile' ? 'page' : undefined}
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-accent font-display text-lg text-white ring-offset-2 hover:ring-2 hover:ring-rose"
      >
        {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : (name[0] ?? '♥').toUpperCase()}
      </button>
    </header>
  );
}
