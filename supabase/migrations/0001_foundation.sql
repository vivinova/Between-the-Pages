-- Between the Pages — Phase 1: Foundation
-- Auth-adjacent tables, private journal storage, and audit logging.
--
-- Every table has Row Level Security enabled. Tables with no policy for a
-- given role are inaccessible to that role by default (Postgres RLS denies
-- unless a policy grants) — this is intentional for audit_log, which must
-- only ever be touched via the service-role key from server-side code.

create extension if not exists "pgcrypto";

create type user_role as enum ('user', 'moderator', 'admin');
create type content_label as enum (
  'grief_death',
  'self_harm',
  'abuse_violence',
  'eating_disorders',
  'addiction',
  'sexual_content'
);

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'user',
  age_confirmed boolean not null default false,
  blocked_labels content_label[] not null default '{}',
  notification_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by their owner"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles are updatable by their owner"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No insert/delete policy for authenticated/anon: profile rows are created
-- exclusively by the trigger below and removed via cascade on account
-- deletion (auth.users delete), both of which run as the table owner and
-- bypass RLS.

-- Auto-create a profile row whenever a new auth.users row appears.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, age_confirmed)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'age_confirmed')::boolean, false)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- journal_entries — private. No policy ever grants access to any user
-- other than the owner. Moderators and the service role do not get a
-- bypass policy here; the service-role key skips RLS at the connection
-- level, so the guarantee that matters is that this app never uses the
-- service-role client to read journal_entries on another user's behalf.
-- ---------------------------------------------------------------------------

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  prompt_id uuid,
  title text,
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index journal_entries_owner_id_idx on public.journal_entries (owner_id);

alter table public.journal_entries enable row level security;

create policy "journal entries are only visible to their owner"
  on public.journal_entries for select
  to authenticated
  using (owner_id = auth.uid());

create policy "journal entries are only insertable by their owner"
  on public.journal_entries for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "journal entries are only updatable by their owner"
  on public.journal_entries for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "journal entries are only deletable by their owner"
  on public.journal_entries for delete
  to authenticated
  using (owner_id = auth.uid());

create trigger set_journal_entries_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- audit_log — service-role only. No RLS policy is created for any role,
-- so anon/authenticated clients get zero access under RLS; only the
-- service-role key (which bypasses RLS) can read or write this table,
-- and only server-side code ever holds that key.
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
