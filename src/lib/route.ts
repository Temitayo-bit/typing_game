import { useEffect, useState } from 'react';
import { findLesson } from '../data/lessons';

export type Route =
  | { page: 'home' }
  | { page: 'practice' }
  | { page: 'lessons' }
  | { page: 'lesson'; lessonId: number }
  | { page: 'progress' }
  | { page: 'notes' };

export function parseRoute(hash: string): Route {
  const [page, arg] = hash.replace(/^#\/?/, '').split('/');
  switch (page) {
    case 'practice':
    case 'lessons':
    case 'progress':
    case 'notes':
      if (page === 'lessons' && arg && /^[1-9]\d*$/.test(arg) && findLesson(Number(arg))) return { page: 'lesson', lessonId: Number(arg) };
      return { page };
    default:
      return { page: 'home' };
  }
}

export function routeHash(r: Route): string {
  return r.page === 'lesson' ? `#/lessons/${r.lessonId}` : r.page === 'home' ? '#/' : `#/${r.page}`;
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
