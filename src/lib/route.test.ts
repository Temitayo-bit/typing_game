import { describe, expect, it } from 'vitest';
import { parseRoute, routeHash } from './route';

describe('routes', () => {
  it('parses hashes', () => {
    expect(parseRoute('')).toEqual({ page: 'home' });
    expect(parseRoute('#/practice')).toEqual({ page: 'practice' });
    expect(parseRoute('#/lessons/7')).toEqual({ page: 'lesson', lessonId: 7 });
    expect(parseRoute('#/lessons/x')).toEqual({ page: 'lessons' });
    expect(parseRoute('#/nope')).toEqual({ page: 'home' });
  });

  it('round-trips', () => {
    for (const r of [{ page: 'home' }, { page: 'notes' }, { page: 'lesson', lessonId: 3 }] as const) {
      expect(parseRoute(routeHash(r))).toEqual(r);
    }
  });
});
