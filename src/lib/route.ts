import { useEffect, useState } from 'react';
import { findLevel } from '../data/exams';
import { findLesson } from '../data/lessons';

export type Route =
  | { page: 'home' }
  | { page: 'practice' }
  | { page: 'lessons' }
  | { page: 'lesson'; lessonId: number }
  | { page: 'exam'; level: number }
  | { page: 'progress' }
  | { page: 'notes' }
  | { page: 'profile' };

export function parseRoute(hash: string): Route {
  const [page, arg] = hash.replace(/^#\/?/, '').split('/');
  switch (page) {
    case 'practice':
    case 'lessons':
    case 'progress':
    case 'notes':
    case 'profile':
      if (page === 'lessons' && arg && /^[1-9]\d*$/.test(arg) && findLesson(Number(arg))) return { page: 'lesson', lessonId: Number(arg) };
      return { page };
    case 'exam':
      if (arg && /^[1-9]\d*$/.test(arg) && findLevel(Number(arg))) return { page: 'exam', level: Number(arg) };
      return { page: 'lessons' };
    default:
      return { page: 'home' };
  }
}

export function routeHash(r: Route): string {
  if (r.page === 'lesson') return `#/lessons/${r.lessonId}`;
  if (r.page === 'exam') return `#/exam/${r.level}`;
  return r.page === 'home' ? '#/' : `#/${r.page}`;
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const onHash = () => setRoute(parseRoute(location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return [route, (r) => (location.hash = routeHash(r))];
}
