-- Between the Pages — Phase 5: Community interactions
-- I needed this, pressed flowers, margin notes, and the quiet inbox.

-- ---------------------------------------------------------------------------
-- Retrofit: close a Phase 3 gap found while designing this phase.
--
-- books' INSERT policy only ever checked owner_id, never moderation_state —
-- a raw PostgREST insert could create a book already 'published', bypassing
-- moderation entirely at creation (enforce_book_update_limits only guards
-- UPDATEs on an existing row). The fix: the user's own session can only
-- ever insert a book as 'pending_review'. Auto-approving a low-risk
-- submission is now a second step, done via the admin (service_role)
-- client from submitBook — never the user's own session — so "insert
-- already published" is no longer something any client-held credential can
-- do. Interactions get the equivalent treatment below from the start.
-- ---------------------------------------------------------------------------

drop policy "authenticated users can submit their own books" on public.books;

create policy "authenticated users can submit their own books"
  on public.books for insert
  to authenticated
  with check (owner_id = auth.uid() and moderation_state = 'pending_review');

-- ---------------------------------------------------------------------------
-- interactions — needed_this, pressed_flower, margin_note.
-- ---------------------------------------------------------------------------

create type interaction_type as enum ('needed_this', 'pressed_flower', 'margin_note');
create type interaction_moderation_state as enum ('pending_review', 'published', 'rejected', 'removed');

create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  reader_id uuid not null references public.profiles (id) on delete cascade,
  type interaction_type not null,
  -- Only populated for margin_note; enforced below rather than with a
  -- column-level check, since the constraint depends on type.
  note_text text,
  moderation_state interaction_moderation_state not null default 'published',
  moderation_reasons text[] not null default '{}',
  -- Per-note contributor choice: whether this *approved* note is shown to
  -- future readers, not just the contributor. Meaningless for the other
  -- two types. Initialized from books.notes_visible_to_readers (the
  -- contributor's general stance, set at submission time) when a note is
  -- approved, and adjustable per-note afterward — see setMarginNoteVisibility.
  is_visible_to_readers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint margin_note_has_text check (
    (type = 'margin_note' and note_text is not null and char_length(note_text) <= 240)
    or (type <> 'margin_note' and note_text is null)
  ),
  unique (book_id, reader_id, type)
);

create index interactions_book_id_idx on public.interactions (book_id);

alter table public.interactions enable row level security;

create policy "interactions are visible to their author, the book owner, or when approved and public"
  on public.interactions for select
  to anon, authenticated
  using (
    reader_id = auth.uid()
    or exists (
      select 1 from public.books b
      where b.id = interactions.book_id
        and b.owner_id = auth.uid()
        and (interactions.type <> 'margin_note' or interactions.moderation_state = 'published')
    )
    or (
      interactions.type = 'margin_note'
      and interactions.moderation_state = 'published'
      and interactions.is_visible_to_readers = true
    )
  );

-- Mirrors the books retrofit above: needed_this/pressed_flower carry no
-- text, so publishing them immediately is safe, but a margin_note must
-- always start pending_review from the user's own session — only the
-- admin client (after running the moderation provider) may promote one to
-- published.
create policy "authenticated users can add their own interactions"
  on public.interactions for insert
  to authenticated
  with check (
    reader_id = auth.uid()
    and (
      (type = 'margin_note' and moderation_state = 'pending_review')
      or (type <> 'margin_note' and moderation_state = 'published')
    )
  );

create policy "authors and book owners can update within limits"
  on public.interactions for update
  to authenticated
  using (
    reader_id = auth.uid()
    or exists (select 1 from public.books b where b.id = interactions.book_id and b.owner_id = auth.uid())
  )
  with check (
    reader_id = auth.uid()
    or exists (select 1 from public.books b where b.id = interactions.book_id and b.owner_id = auth.uid())
  );

create policy "authors can delete their own interactions"
  on public.interactions for delete
  to authenticated
  using (reader_id = auth.uid());

create trigger set_interactions_updated_at
  before update on public.interactions
  for each row execute function public.set_updated_at();

-- As with books, RLS alone can restrict an UPDATE to "you're the author or
-- the book owner," but can't compare old and new values or tell those two
-- cases apart. This trigger is the real boundary: the author may only edit
-- note_text while still pending, and may never touch moderation_state; the
-- book owner may only toggle is_visible_to_readers on an approved margin
-- note belonging to their own book, and nothing else. service_role (the
-- Phase 6 moderator dashboard, and the admin-client auto-approve step in
-- submitMarginNote) bypasses this entirely.
create function public.enforce_interaction_update_limits()
returns trigger
language plpgsql
as $$
declare
  is_book_owner boolean;
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if old.reader_id = auth.uid() then
    if new.type is distinct from old.type
       or new.book_id is distinct from old.book_id
       or new.reader_id is distinct from old.reader_id
       or new.moderation_state is distinct from old.moderation_state
       or new.moderation_reasons is distinct from old.moderation_reasons
       or new.is_visible_to_readers is distinct from old.is_visible_to_readers then
      raise exception 'Only a moderator can change this field';
    end if;
    if new.note_text is distinct from old.note_text and old.moderation_state <> 'pending_review' then
      raise exception 'A note can only be edited while pending review';
    end if;
    return new;
  end if;

  select (b.owner_id = auth.uid()) into is_book_owner
  from public.books b
  where b.id = old.book_id;

  if is_book_owner then
    if new.note_text is distinct from old.note_text
       or new.type is distinct from old.type
       or new.book_id is distinct from old.book_id
       or new.reader_id is distinct from old.reader_id
       or new.moderation_state is distinct from old.moderation_state
       or new.moderation_reasons is distinct from old.moderation_reasons then
      raise exception 'Only a moderator can change this field';
    end if;
    if new.is_visible_to_readers is distinct from old.is_visible_to_readers
       and (old.type <> 'margin_note' or old.moderation_state <> 'published') then
      raise exception 'Only an approved margin note''s visibility can be changed';
    end if;
    return new;
  end if;

  raise exception 'Not permitted to update this interaction';
end;
$$;

create trigger enforce_interaction_update_limits
  before update on public.interactions
  for each row execute function public.enforce_interaction_update_limits();

-- ---------------------------------------------------------------------------
-- notifications — the quiet inbox. Always created by the admin client
-- (service_role), never by a user's own session: a notification's
-- recipient is nearly always *someone else* (the book owner, or a margin
-- note's author), so "insert your own row" RLS can't apply here the way it
-- does everywhere else. There is deliberately no insert policy for anon or
-- authenticated — only service_role, which bypasses RLS, may create one.
-- ---------------------------------------------------------------------------

create type notification_type as enum (
  'needed_this',
  'pressed_flower',
  'margin_note_approved',
  'margin_note_rejected'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type notification_type not null,
  book_id uuid references public.books (id) on delete cascade,
  interaction_id uuid references public.interactions (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_id_idx on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy "recipients can see their own notifications"
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());

create policy "recipients can mark their own notifications read"
  on public.notifications for update
  to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy "recipients can dismiss their own notifications"
  on public.notifications for delete
  to authenticated
  using (recipient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reports — extend to also target a specific interaction (a margin note),
-- not just a book. Exactly one of book_id/interaction_id is set.
-- ---------------------------------------------------------------------------

alter table public.reports
  alter column book_id drop not null,
  add column interaction_id uuid references public.interactions (id) on delete cascade,
  add constraint reports_target_exactly_one check (
    (book_id is not null and interaction_id is null)
    or (book_id is null and interaction_id is not null)
  ),
  drop constraint reports_reporter_id_book_id_key;

-- Nullable columns make a plain UNIQUE(reporter_id, book_id) ineffective
-- (Postgres treats NULLs as distinct), so duplicate prevention is two
-- partial unique indexes instead, one per target type.
create unique index reports_reporter_book_unique
  on public.reports (reporter_id, book_id)
  where book_id is not null;

create unique index reports_reporter_interaction_unique
  on public.reports (reporter_id, interaction_id)
  where interaction_id is not null;
