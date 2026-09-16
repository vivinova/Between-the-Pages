-- Between the Pages — Phase 6: Safety & launch hardening
-- Rate limiting, moderator escalation, and per-account preferences.

-- ---------------------------------------------------------------------------
-- rate_limit_events — a plain sliding-window counter. Each row is one
-- attempt at a rate-limited action; checkRateLimit() prunes rows outside
-- the window for that actor+action before counting, so the table
-- self-cleans rather than growing unbounded. RLS lets a user manage only
-- their own rows, which is all the app ever needs (there is no
-- cross-user read of rate-limit state).
-- ---------------------------------------------------------------------------

create table public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_events_actor_action_idx
  on public.rate_limit_events (actor_id, action, created_at);

alter table public.rate_limit_events enable row level security;

create policy "users manage only their own rate limit events"
  on public.rate_limit_events for all
  to authenticated
  using (actor_id = auth.uid())
  with check (actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reports — add 'escalated' so a moderator can flag a high-risk report for
-- priority handling, per the moderator-dashboard requirement. This is a
-- status marker only; there is no paging/external-notification system
-- behind it in the MVP (the PRD itself defers the real escalation policy
-- to legal/safety review before public launch).
-- ---------------------------------------------------------------------------

alter table public.reports drop constraint reports_review_state_check;
alter table public.reports add constraint reports_review_state_check
  check (review_state in ('open', 'reviewing', 'resolved', 'dismissed', 'escalated'));

-- ---------------------------------------------------------------------------
-- profiles — per-account preferences that Settings now exposes.
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column reduced_motion boolean not null default false,
  add column default_allow_margin_notes boolean not null default true,
  add column default_notes_visible_to_readers boolean not null default false;
