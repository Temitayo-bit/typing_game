-- Passages typed in each test, so the app can serve new ones first on every device.
alter table public.results
  add column text_keys text[] not null default '{}'
  check (cardinality(text_keys) <= 50);
