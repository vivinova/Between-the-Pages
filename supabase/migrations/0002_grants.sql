-- Real bug found testing against a live Supabase project: RLS policies
-- describe WHAT a role may do (e.g. "insert a confession only as
-- pending_review"), but they don't grant the underlying table privilege
-- to do it at all — Postgres checks the base GRANT first, and only then
-- evaluates RLS. Supabase's default privileges for a fresh project only
-- cover SELECT for anon/authenticated on the public schema (which is why
-- browsing categories/confessions already worked); INSERT was never
-- granted, so every submission failed with "permission denied for table
-- confessions" — a privilege error, not an RLS rejection (those look
-- different: "new row violates row-level security policy").
--
-- Only INSERT is granted here, matching what each RLS insert policy
-- already allows — anon/authenticated still have no UPDATE/DELETE
-- privilege on any of these tables, so promoting to published, editing,
-- or deleting still requires the service-role admin client, same as
-- before this fix.

grant insert on public.confessions to anon, authenticated;
grant insert on public.interactions to anon, authenticated;
grant insert on public.reports to anon, authenticated;
