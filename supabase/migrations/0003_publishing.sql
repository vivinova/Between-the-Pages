-- Between the Pages — Phase 3: Publishing
-- Shelves, public books, and the moderation-state machine.

create type book_moderation_state as enum (
  'draft',
  'pending_review',
  'published',
  'rejected',
  'removed',
  'archived'
);

-- ---------------------------------------------------------------------------
-- shelves
-- ---------------------------------------------------------------------------

create table public.shelves (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order int not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.shelves enable row level security;

create policy "visible shelves are publicly readable"
  on public.shelves for select
  to anon, authenticated
  using (is_hidden = false);

-- No insert/update/delete policy for anon/authenticated: shelves are
-- managed by moderators via the service role (Phase 6 dashboard), which
-- bypasses RLS entirely.

-- ---------------------------------------------------------------------------
-- books
-- ---------------------------------------------------------------------------

create table public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  -- Internal traceability only. Never joined into a reader-facing query —
  -- readers only ever see excerpt_text, shelf_id, and labels. Set null (not
  -- cascaded) if the source entry is later deleted, since the book is a
  -- fully independent public record from that point on.
  source_entry_id uuid references public.journal_entries (id) on delete set null,
  excerpt_text text not null check (char_length(excerpt_text) <= 500),
  shelf_id uuid not null references public.shelves (id),
  labels content_label[] not null default '{}',
  allow_margin_notes boolean not null default true,
  -- Whether an *approved* margin note may be shown to future readers, not
  -- just the contributor. Distinct from allow_margin_notes (whether notes
  -- are accepted at all) — see the Phase 5 margin-notes feature.
  notes_visible_to_readers boolean not null default false,
  moderation_state book_moderation_state not null default 'pending_review',
  -- Reasons the moderation provider flagged this submission, if any (e.g.
  -- 'possible_pii', 'crisis_language'). Categorical labels only — never
  -- free text derived from the submission itself.
  moderation_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  archived_at timestamptz,
  removed_at timestamptz
);

create index books_owner_id_idx on public.books (owner_id);
create index books_shelf_id_moderation_state_idx
  on public.books (shelf_id, moderation_state)
  where moderation_state = 'published';

alter table public.books enable row level security;

create policy "published books are public; owners see all their own"
  on public.books for select
  to anon, authenticated
  using (moderation_state = 'published' or owner_id = auth.uid());

create policy "authenticated users can submit their own books"
  on public.books for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "owners can update their own books"
  on public.books for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create trigger set_books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- The owner-update RLS policy above only checks *ownership*, not which
-- columns or which moderation_state transitions are legal — Postgres RLS
-- can't compare a row's old and new values, only a trigger can. Without
-- this trigger, an owner could bypass the app entirely (a raw PostgREST
-- call) and flip their own pending_review or rejected book straight to
-- 'published', or edit excerpt_text after a moderator has already reviewed
-- it. This is the actual enforcement boundary; submitBook/archiveBook/
-- removeBook in the app are just the intended way to stay inside it.
--
-- service_role (the moderator dashboard, arriving in Phase 6) bypasses
-- this entirely and may make any change.
create function public.enforce_book_update_limits()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.shelf_id is distinct from old.shelf_id
     or new.labels is distinct from old.labels
     or new.owner_id is distinct from old.owner_id
     or new.source_entry_id is distinct from old.source_entry_id then
    raise exception 'Only a moderator can change this field after submission';
  end if;

  -- excerpt_text may only change as part of the owner removing the book
  -- (to scrub the original text) — never as a standalone edit, and never
  -- smuggled in alongside an archive transition.
  if new.excerpt_text is distinct from old.excerpt_text
     and new.moderation_state is distinct from 'removed' then
    raise exception 'Only a moderator can change this field after submission';
  end if;

  if new.moderation_state is distinct from old.moderation_state then
    if not (
      old.moderation_state in ('published', 'archived')
      and new.moderation_state in ('archived', 'removed')
    ) then
      raise exception
        'Owners may only archive or remove a published/archived book (attempted % -> %)',
        old.moderation_state, new.moderation_state;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_book_update_limits
  before update on public.books
  for each row execute function public.enforce_book_update_limits();
