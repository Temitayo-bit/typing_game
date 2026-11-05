-- Presses per expected key in each test, so weak keys are ranked by miss rate, not raw misses.
alter table public.results
  add column key_presses jsonb not null default '{}'
  check (jsonb_typeof(key_presses) = 'object'),
  add constraint results_key_presses_size check (pg_column_size(key_presses) <= 4096);
