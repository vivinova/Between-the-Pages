-- Anonymous Confessions — Foundation
--
-- No accounts anywhere in this schema. Every public-facing table is
-- writable by the `anon` role directly (no auth.uid() to scope by), so the
-- guarantees that used to come from "owner_id = auth.uid()" RLS policies
-- instead come from: (1) moderation-state triggers that only let anon
-- insert content as 'pending_review', never 'published', (2) a
-- fingerprint hash (anonymous cookie id + IP, hashed — see
-- src/lib/fingerprint.ts) standing in for identity where dedup/rate
-- limiting needs *a* key, without that key being personally identifying,
-- and (3) the service-role client for anything that needs to read across
-- fingerprints or promote pending content (moderation, rate limiting,
-- the delete-by-owner-token action) — exactly the same "two-step
-- insert-then-admin-promote" pattern the previous version of this app
-- used for its owner-based RLS, just without an owner.

create extension if not exists "pgcrypto";

create type public.moderation_state as enum ('pending_review', 'published', 'removed');
create type public.interaction_type as enum ('me_too', 'sending_love', 'reply');
create type public.report_target as enum ('confession', 'interaction');
create type public.report_review_state as enum ('open', 'resolved', 'dismissed', 'escalated');

-- ---------------------------------------------------------------------------
-- categories — fixed, seeded content (see supabase/seed.sql). No public
-- write policy; managed exclusively via the service-role client.
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text not null,
  sort_order integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "categories are publicly readable"
  on public.categories for select
  to anon, authenticated
  using (not is_hidden);

-- ---------------------------------------------------------------------------
-- confessions
-- ---------------------------------------------------------------------------

create table public.confessions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id),
  body_text text not null check (char_length(body_text) between 20 and 3000),
  moderation_state public.moderation_state not null default 'pending_review',
  moderation_reasons text[] not null default '{}',
  -- Optional, opt-in. Never exposed to anon/authenticated reads — see the
  -- public_confessions view below, which is the only thing the app reads
  -- from on behalf of a visitor. Only the service-role client (moderation,
  -- the future digest job) reads this table directly.
  contact_email text,
  email_opt_in boolean not null default false,
  -- sha256 of a token generated at submission and shown to the author
  -- exactly once ("save this link to delete your confession later"). Lets
  -- a submitter delete their own confession without an account — the
  -- token itself is the credential, verified server-side against this
  -- hash via the service-role client (see deleteMyConfession).
  owner_token_hash text not null,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index confessions_category_id_idx on public.confessions (category_id);
create index confessions_moderation_state_idx on public.confessions (moderation_state);

alter table public.confessions enable row level security;

create policy "published confessions are publicly readable"
  on public.confessions for select
  to anon, authenticated
  using (moderation_state = 'published');

create policy "anyone can submit a confession as pending review"
  on public.confessions for insert
  to anon, authenticated
  with check (moderation_state = 'pending_review');

-- No public update/delete policy: promoting to 'published' and the
-- owner-token delete flow both go through the service-role client, which
-- bypasses RLS — the same trust boundary the moderation dashboard already
-- relies on.

-- RLS above only restricts *rows* (published vs. not) — it does nothing to
-- restrict *columns*, so without this, a direct REST call selecting
-- contact_email on a published row would succeed and leak it. Revoke
-- table-level SELECT entirely and force every anon/authenticated read
-- through the column-restricted view below.
revoke select on public.confessions from anon, authenticated;

-- Column-restricted read surface for anonymous browsing — excludes
-- contact_email, email_opt_in, owner_token_hash, and moderation_reasons.
-- security_invoker means the view re-checks RLS as the querying role
-- rather than as the view's owner (which would bypass RLS entirely and
-- silently leak pending/removed confessions) — the explicit WHERE clause
-- below is redundant with the base table's RLS policy by design (defense
-- in depth), not a substitute for it.
create view public.public_confessions
  with (security_invoker = true)
  as
  select id, category_id, body_text, created_at, published_at
  from public.confessions
  where moderation_state = 'published';

grant select on public.public_confessions to anon, authenticated;

-- ---------------------------------------------------------------------------
-- interactions — reactions (me_too, sending_love) publish immediately
-- since they carry no text; replies go through the same pending-review
-- gate as confessions. The trigger below is the only thing enforcing that
-- split — RLS just checks "did you follow the trigger's rules", since
-- there's no update policy for anon to ever revisit afterward.
-- ---------------------------------------------------------------------------

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  confession_id uuid not null references public.confessions (id) on delete cascade,
  type public.interaction_type not null,
  body_text text,
  moderation_state public.moderation_state not null,
  moderation_reasons text[] not null default '{}',
  fingerprint_hash text not null,
  created_at timestamptz not null default now(),
  constraint reply_has_body_text check (
    (type = 'reply' and body_text is not null and char_length(body_text) between 1 and 500)
    or (type <> 'reply' and body_text is null)
  )
);

create index interactions_confession_id_idx on public.interactions (confession_id);
create index interactions_moderation_state_idx on public.interactions (moderation_state);

-- One reaction per (confession, type, fingerprint) — replies are excluded
-- so the same visitor can leave multiple replies.
create unique index interactions_unique_reaction
  on public.interactions (confession_id, type, fingerprint_hash)
  where type <> 'reply';

create or replace function public.enforce_interaction_insert()
returns trigger
language plpgsql
as $$
begin
  if new.type = 'reply' then
    if new.moderation_state <> 'pending_review' then
      raise exception 'replies must be inserted as pending_review';
    end if;
  else
    if new.moderation_state <> 'published' then
      raise exception 'reactions must be inserted as published';
    end if;
  end if;
  return new;
end;
$$;

create trigger interactions_enforce_insert
  before insert on public.interactions
  for each row execute function public.enforce_interaction_insert();

alter table public.interactions enable row level security;

create policy "published interactions are publicly readable"
  on public.interactions for select
  to anon, authenticated
  using (moderation_state = 'published');

create policy "anyone can react or reply"
  on public.interactions for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- reports — write-only for anon/authenticated; reading is admin-only via
-- the service-role client, same as the previous version of this app.
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null,
  reporter_fingerprint_hash text not null,
  review_state public.report_review_state not null default 'open',
  created_at timestamptz not null default now(),
  unique (target_type, target_id, reporter_fingerprint_hash)
);

alter table public.reports enable row level security;

create policy "anyone can file a report"
  on public.reports for insert
  to anon, authenticated
  with check (review_state = 'open');

-- ---------------------------------------------------------------------------
-- rate_limit_events — no RLS policy for any role, so anon/authenticated
-- get zero access (same "no policy = default deny" pattern as audit_log
-- below). There is no auth.uid() to scope rows to their own actor by
-- anymore, so unlike the previous version of this app, rate limiting is
-- necessarily an admin-client-only operation — see src/lib/rate-limit.ts.
-- ---------------------------------------------------------------------------

create table public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  action text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_events_key_action_idx on public.rate_limit_events (key, action);

alter table public.rate_limit_events enable row level security;

-- ---------------------------------------------------------------------------
-- audit_log — service-role only, same as before, minus the actor_id FK
-- (there are no accounts to reference; every action is taken by whoever
-- holds the shared admin passphrase, so actor is just a free-text label).
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null default 'admin',
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
