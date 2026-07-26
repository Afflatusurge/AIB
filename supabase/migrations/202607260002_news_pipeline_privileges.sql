-- Restrict the private editorial pipeline to the operations used by the
-- server-side release monitor.

revoke all on table public.news_sources from anon, authenticated, service_role;
revoke all on table public.source_entries from anon, authenticated, service_role;
revoke all on table public.news_candidates from anon, authenticated, service_role;

grant select, insert, update on table public.news_sources to service_role;
grant select, insert, update on table public.source_entries to service_role;
grant select, insert, update on table public.news_candidates to service_role;
