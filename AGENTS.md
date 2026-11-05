# Agent notes

Small personal typing practice web app. Static site, no server.

## Commands

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` must all pass before a PR.

## Rules

- Every change goes through a feature branch and a pull request. Never push to `main`.
- Ask before each deploy, database migration, or other external change.
- TypeScript strict. Keep files to one job: game logic in `src/game` (pure, unit-tested), storage and progress in `src/lib`, UI in `src/components`, content in `src/data`.
- Comment only what the code cannot say: a non-obvious why or a constraint.
- Scoring, lesson unlocking, and import parsing need unit tests.
- Fix review findings in the branch; don't defer fixable work to issues.
- Keep the README generic: no personal names or details.
- Text passages are original writing, never quotes from shows, books, or songs.
- When Supabase is added: RLS on every table, never use the service-role key.
