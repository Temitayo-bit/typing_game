import { describe, expect, it } from 'vitest';
import { parseRoute, routeHash } from './route';

describe('routes', () => {
  it('parses hashes', () => {
    expect(parseRoute('')).toEqual({ page: 'home' });
    expect(parseRoute('#/practice')).toEqual({ page: 'practice' });
    expect(parseRoute('#/lessons/7')).toEqual({ page: 'lesson', lessonId: 7 });
    expect(parseRoute('#/lessons/x')).toEqual({ page: 'lessons' });
    expect(parseRoute('#/nope')).toEqual({ page: 'home' });
    expect(parseRoute('#practice')).toEqual({ page: 'practice' });
    expect(parseRoute('#/exam/3')).toEqual({ page: 'exam', level: 3 });
    for (const bad of ['#/exam/0', '#/exam/11', '#/exam/', '#/exam/x']) expect(parseRoute(bad)).toEqual({ page: 'lessons' });
    for (const bad of ['#/lessons/0', '#/lessons/41', '#/lessons/007', '#/lessons/']) expect(parseRoute(bad)).toEqual({ page: 'lessons' });
  });

  it('round-trips', () => {
    for (const r of [{ page: 'home' }, { page: 'notes' }, { page: 'lesson', lessonId: 3 }, { page: 'exam', level: 2 }] as const) {
      expect(parseRoute(routeHash(r))).toEqual(r);
    }
  });
});
