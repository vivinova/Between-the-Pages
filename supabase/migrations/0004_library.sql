-- Between the Pages — Phase 4: Library
-- View tracking (internal ranking signal only — never rendered to anyone),
-- bookmarks, and a minimal reporting capability.

alter table public.books
  add column view_count integer not null default 0 check (view_count >= 0);

-- Lets any caller (anon or authenticated) bump a published book's view
-- count without needing UPDATE access to the row — the "owners can update
-- their own books" RLS policy only covers the owner, and readers viewing
-- someone else's book are neither the owner nor service_role. security
-- definer runs this as the function owner, bypassing RLS entirely, so the
-- function body itself is the whole security boundary: it can only ever
-- touch view_count, and only on a published book.
create function public.increment_book_view_count(target_book_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.books
  set view_count = view_count + 1
  where id = target_book_id and moderation_state = 'published';
$$;

grant execute on function public.increment_book_view_count(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- bookmarks — private to the reader. Not visible to the book's contributor,
-- and there is deliberately no RLS exception for owner_id: the "contributor
-- is not notified when someone bookmarks their book" requirement means the
-- contributor has no legitimate read path to this table at all.
-- ---------------------------------------------------------------------------

create table public.bookmarks (
  reader_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reader_id, book_id)
);

alter table public.bookmarks enable row level security;

create policy "readers manage only their own bookmarks"
  on public.bookmarks for all
  to authenticated
  using (reader_id = auth.uid())
  with check (reader_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reports — minimal capability for this phase: a reader can report a book,
-- which immediately excludes it from their own future shelf/discovery
-- queries (enforced in application queries, not RLS, since it's a "don't
-- show me this" preference rather than an access boundary). Triage
-- (reviewing, resolving, escalating) is a Phase 6 moderator-dashboard
-- concern; for now review_state just sits at 'open'.
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  book_id uuid not null references public.books (id) on delete cascade,
  reason text not null check (reason in (
    'harassment',
    'hate_speech',
    'dangerous_advice',
    'graphic_content',
    'personal_information',
    'spam',
    'incorrect_labels',
    'immediate_safety_concern',
    'other'
  )),
  review_state text not null default 'open' check (review_state in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (reporter_id, book_id)
);

alter table public.reports enable row level security;

create policy "reporters can file reports"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "reporters can see their own reports"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid());

-- No update/delete policy for authenticated: a filed report can't be
-- edited or withdrawn by the reporter, and review_state only ever changes
-- via the service role (Phase 6).
