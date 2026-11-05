-- Level exams save their results as mode 'exam-<level>', so the mode check has to allow them.
-- Kept in step with isModeKey in src/lib/modes.ts.
alter table public.results drop constraint results_mode_check;
alter table public.results add constraint results_mode_check
  check (mode ~ '^(?:(?:time|words|exam)-\d+|lesson-\d+-\d+|weak-keys|(?:pack|note)-[a-z0-9-]+)$');
