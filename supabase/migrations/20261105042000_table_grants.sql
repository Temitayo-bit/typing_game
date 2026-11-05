-- This project doesn't grant table access to API roles by default, so grant exactly
-- what the app uses to signed-in users. RLS still limits every row to its owner.
revoke all on public.profiles, public.results, public.settings from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert on public.results to authenticated;
grant select, insert, update on public.settings to authenticated;
