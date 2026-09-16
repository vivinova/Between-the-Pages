# Between the Pages

A private digital journal connected to **The Library** — a shared, anonymous
collection of short reflections. Write for yourself first; choose deliberately
what, if anything, becomes a passage a stranger might find.

Full product requirements live in the project's PRD (not included in this
repo). This README covers what's implemented and how to run it.

## Status

**Phase 4 of 6 (Library) is complete.** See [Implementation status](#implementation-status)
below for what exists today versus what's still a placeholder.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — warm cream / dark wood / muted forest / dusty blue /
  faded burgundy palette; serif for passage text, sans for UI chrome
- **Supabase**: Postgres, Auth, and Row Level Security as the sole
  authorization boundary for user data
- **React Hook Form + Zod** for all form validation (client and re-validated
  server-side)
- **Framer Motion** for restrained animation (not yet used — introduced when
  the journal editor and book reader are built)
- **Vitest** for unit tests, **Playwright** for critical end-to-end flows

## Architecture notes

- **Private journal entries and public "books" are separate database
  records.** `journal_entries` is never exposed by RLS to anyone but its
  owner — not even to the service role from client-reachable code paths.
  `books.source_entry_id` links a public excerpt back to its private source
  for the owner's and moderators' own traceability only; it is never joined
  into a reader-facing query, and it's set null (not cascaded) if the
  source entry is later deleted — the book is fully independent from the
  moment it's created.
- **RLS alone can't stop a moderation-state bypass, so a trigger does.**
  Postgres RLS policies can restrict an UPDATE by row ownership, but can't
  compare a row's old and new values — so "owners can update their own
  books" as a policy would, by itself, let a user flip their own
  `pending_review` book straight to `published` with a raw PostgREST call,
  bypassing the app entirely. `enforce_book_update_limits()` (a BEFORE
  UPDATE trigger in `0003_publishing.sql`) is the actual enforcement: it
  locks `shelf_id`/`labels`/`owner_id`/`source_entry_id` after submission,
  only allows `excerpt_text` to change as part of removal, only allows
  `published`/`archived` → `archived`/`removed` for the row owner, and is
  bypassed entirely for `service_role` (the Phase 6 moderator dashboard).
  Whenever an update needs "only in this state transition" logic, reach for
  a trigger, not just a policy.
- **The Supabase service-role key is server-only.** `src/lib/supabase/admin.ts`
  imports the `server-only` package, which fails the build if that module is
  ever pulled into a client bundle. It is reserved for moderation/admin
  server actions in later phases.
- **RLS is the real authorization boundary**, not application code. See
  `supabase/migrations/0001_foundation.sql` for the current policies:
  `profiles` (owner read/update only), `journal_entries` (owner-only CRUD,
  no exceptions), `audit_log` (no policies at all — service-role only).
- **Auth**: Supabase email/sign-up with a required 18+ attestation checkbox
  (stored on the profile), sign in, sign out, and password reset, all as
  Next.js Server Actions. Session cookies are refreshed in `middleware.ts`,
  which also redirects unauthenticated visitors away from account-only
  routes (`/today`, `/journal`, `/bookmarks`, `/inbox`, `/settings`).
  `/library` and `/` are intentionally left open — anonymous browsing of
  the library is a product requirement.
- **A `SECURITY DEFINER` RPC, not RLS, handles view counting.** Any reader —
  including anon — needs to bump a published book's `view_count`, but "owners
  can update their own books" RLS means only the owner could otherwise write
  to that row at all. `increment_book_view_count(target_book_id)` runs as
  its (non-RLS-bound) owner and is deliberately narrow: its SQL body can
  only ever touch `view_count`, only on a `published` row — there's no way
  to smuggle another column change through it. `view_count` itself is never
  selected into any reader-facing query; it exists purely to bias "which
  book should this reader see next" toward less-seen books (see
  `pickLibraryBook`) and is never counted, compared, or displayed as a
  number anywhere in the UI, per the product requirement.
- **`src/lib/supabase/types.ts` is hand-written**, matching the migrations
  in `supabase/migrations/`. It must include `Relationships` on every table
  and `Views`/`Functions` on the schema object — without them the Supabase
  client's generics silently fall back to `never` for every `.from(table)`
  call (no type error, just no column checking at all). Keep
  `@supabase/ssr` reasonably current, too: an old version pinned against a
  pre-rewrite `@supabase/supabase-js` type surface breaks the same way,
  silently. Once the Supabase CLI is available, prefer generating this file
  (`supabase gen types typescript --local`) over hand-editing it.

## Implementation status

**Built in Phase 1 (Foundation):**
- Project scaffold (Next.js, TypeScript, Tailwind, ESLint, Vitest, Playwright)
- Supabase browser/server/admin client helpers
- Database migration: `profiles`, `journal_entries`, `audit_log`, plus the
  `user_role` and `content_label` enums later phases will use
- Auth flows: sign up (with age attestation and required email
  confirmation), sign in, sign out, request password reset, confirm new
  password, OAuth-style callback route
- Base app shell: themed root layout, authenticated app shell with nav,
  public landing page, placeholder pages for Today/Journal/Library/
  Bookmarks/Inbox/Settings

**Built in Phase 2 (Journal):**
- Migration: `prompts` table + RLS, FK from `journal_entries.prompt_id`
- Seed: 24 daily journal prompts
- Today page: deterministic daily featured prompt (`src/lib/prompts.ts`),
  a client-side "try another prompt" shuffle, write-about-this/write-freely
  entry points, recent entries
- Journal editor: create and edit, debounced autosave, manual save,
  save-status indicator, character/word count, two-step delete
  confirmation, private-by-default messaging, a (currently stub) entry
  point into Phase 3's sharing flow
- Journal history: list sorted by most recently updated, search by
  title/body, empty/loading/error states, owner-only access (RLS-enforced;
  a non-owner id resolves to a themed 404)

**Built in Phase 3 (Publishing):**
- Migration: `shelves` (seeded with the 8 launch shelves) and `books`, a
  6-state `book_moderation_state` enum, and the `enforce_book_update_limits`
  trigger described above
- `src/lib/moderation/`: a `ModerationProvider` interface and a
  `MockModerationProvider` (crisis-keyword + PII-heuristic based),
  explicitly marked `isProductionReady: false` and logged as such on first
  use — see the interface's doc comment before swapping in a real provider
- `src/lib/moderation/pii.ts`: a heuristic PII detector (reliable for
  emails/phone numbers, coarse for "possibly a name or place") shared by
  the pre-submission warning and the moderation provider's risk flagging
- Leave-a-passage wizard (`/journal/[id]/share`): compose or highlight-and-
  carry-over text from the entry editor → preview with the PII warning and
  a required private-entry confirmation → shelf/content-warning/margin-
  note classification → final anonymous-publishing confirmation → submit.
  Nothing is written to the database until the final step.
- Your passages page (`/journal/passages`): the contributor's own books
  with status badges and archive/remove actions

**Built in Phase 4 (Library):**
- Migration: `books.view_count` + the `increment_book_view_count` RPC
  described above, `bookmarks` (private to the reader), `reports` (9
  reasons, one per reader per book, immediately excludes that book from the
  reporter's own future queries)
- `pickLibraryBook` (`src/lib/actions/library.ts`): the single selection
  function behind shelf entry, Find Me Something, and "read/find another" —
  respects blocked labels, previously-reported books, and (for Find Me
  Something) the reader's own books, and approximates "prioritize fewer
  views" by capping candidates to the 15 least-viewed and picking randomly
  among them
- Library landing (`/library`): shelf grid, "recently added" (no
  popularity ranking, no infinite scroll), Find Me Something entry point
- Shelf browsing (`/library/shelves/[slug]`): picks one eligible book and
  goes straight to it — no list view, consistent with "one book at a time"
- Find Me Something (`/library/find`): choose a shelf or "surprise me"
- Book reader (`/library/books/[id]`): content-warning gate before
  revealing labeled text, bookmark, report, shelf-aware "read/find
  another"; never renders owner identity, exact date, or any count
- Bookmarks page: real implementation, with lazy cleanup of bookmarks
  pointing at books that are no longer published

**Explicitly mocked or deferred — do not treat as production-ready:**
- There is no reader/contributor interaction (I needed this, pressed
  flowers, margin notes), inbox, or moderator dashboard yet. `/inbox` and
  `/settings` are still one-line placeholders, and the book reader shows a
  static note that gentle responses are coming in Phase 5.
- A book that lands in `pending_review` has no way to become `published`
  until the Phase 6 dashboard exists — that's expected, not a bug, for
  anything the mock moderation provider flags.
- The moderation provider is a keyword/regex heuristic, not real safety
  moderation — see the doc comment on `MockModerationProvider`. It cannot
  detect harassment, graphic content, or dangerous instructions, and its
  crisis-language and PII checks are intentionally narrow.
- Reports are filed and immediately hide the book from the reporter, but
  there is no moderator queue yet to actually review, resolve, or escalate
  them — `review_state` just sits at `open`.
- No rate limiting yet (Phase 6) — publishing, bookmarking, and reporting
  have no submission throttle.
- No blocked-topic Settings UI yet (Phase 6) — `profiles.blocked_labels` is
  already respected everywhere the library queries for eligible books, but
  there's no page to actually set it, so it stays empty (no filtering) for
  every account until then.
- No fictional sample books are seeded. Seeding a book requires a real
  `auth.users` row (the FK chain is `books.owner_id → profiles.id →
  auth.users.id`), which a plain SQL seed file can't create — that needs
  the Supabase Admin API. The library will be empty until at least one book
  is published through Phase 3's own flow, or until a dedicated
  service-role seed script is written.
- Session-interruption recovery relies entirely on the ~1.5s autosave to
  the database — there is no separate localStorage draft layer, so content
  typed in the last second or two before a hard crash is not recovered.
  This applies to journal entries; the passage-composition step in the
  leave-a-passage flow isn't persisted at all until final submission
  (by design — canceling must never affect the private entry).

**What to verify manually:**
1. Create a real Supabase project and fill in `.env.local` from
   `.env.example`, then run `npm run dev` and confirm sign-up (including
   the "check your email" confirmation step), sign-in, sign-out, and
   password reset all work end-to-end against real Supabase Auth (this
   repo's automated tests only exercise it against a live server with
   placeholder credentials, so they don't cover successful auth).
2. Apply the migrations in `supabase/migrations/` and `supabase/seed.sql`
   to that project (see below) and confirm in the Supabase dashboard that
   RLS is enabled on all eight tables and that a new `profiles` row appears
   automatically when a user signs up.
3. Confirm `/today`, `/journal`, `/bookmarks`, `/inbox`, `/settings`
   redirect to `/login` when signed out, and are reachable when signed in.
4. Confirm `/library` and `/` load without signing in.
5. On the Today page, confirm the featured prompt is present, "Try another
   prompt" cycles without a page reload, and both "Write about this" and
   "Write freely" open the editor correctly (with vs. without the prompt
   attached).
6. In the journal editor, type a few words, wait ~2 seconds, and confirm
   the status changes to "Saved" and the URL updates from `/journal/new`
   to `/journal/<id>` without a page reload. Refresh the page and confirm
   the content persisted. Confirm delete requires the two-step
   confirmation and actually removes the entry.
7. On `/journal`, confirm search matches on both title and body, and that
   entries you don't own are not retrievable by guessing another entry's
   `/journal/<id>` URL.
8. Walk the full leave-a-passage flow from an entry: highlight text and
   confirm it carries over to the share page; compose a passage containing
   an email address or a name-like phrase and confirm the PII warning
   appears; submit a benign passage and confirm it shows as "Published" on
   `/journal/passages`; submit one containing an email address or a phrase
   like "want to end my life" and confirm it shows as "Pending review"
   instead. Confirm canceling the flow at any step leaves the journal entry
   unchanged.
9. Archive a published passage, then remove it, confirming each requires
   its own two-step confirmation and that removal actually replaces the
   stored excerpt text (check the row in the Supabase dashboard).
10. As a deliberate check of the DB-level enforcement (not just the UI):
    using the Supabase dashboard's SQL editor or REST API directly as the
    book's owner, try to update one of your own `pending_review` books'
    `moderation_state` to `published`, or edit its `excerpt_text` after
    submission. Both should be rejected by `enforce_book_update_limits`
    with a raised exception — if either silently succeeds, the trigger has
    a gap and needs fixing before this phase can be trusted.
11. Publish 2-3 books through the Phase 3 flow (different shelves, at least
    one with a content label) so the library has something to show, then:
    open `/library` and confirm the shelf grid and "recently added" both
    load; open a labeled book and confirm the content-warning gate hides
    the text until you click Continue; bookmark it, then confirm it shows
    up on `/bookmarks` and that removing it there also un-bookmarks it (no
    longer showing as "Bookmarked" if you revisit the book); report a
    different book and confirm it stops appearing in your own shelf/Find Me
    Something results afterward (a second Supabase account should still see
    it normally — reports are per-reporter).
12. Click "Read another from this shelf" and "Find me something" (both
    "surprise me" and a specific shelf) enough times to confirm they don't
    immediately repeat the book you were just on, and that a shelf/search
    with zero eligible books shows the empty state instead of erroring.
13. Confirm the book reader never shows who wrote a passage, its exact
    date, a view or reaction count, or a link to the same contributor's
    other books — there is no code path that should be able to show any of
    these, but this is worth eyeballing directly since it's a hard privacy
    requirement.

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project ([supabase.com](https://supabase.com)), or the
  [Supabase CLI](https://supabase.com/docs/guides/cli) for local development

### Setup

```bash
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and
# SUPABASE_SERVICE_ROLE_KEY from your Supabase project's API settings.
```

### Database

Apply the migration in `supabase/migrations/` to your Supabase project. With
the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Without the CLI, paste the contents of each file in
`supabase/migrations/` (in order) into the Supabase dashboard's SQL editor,
then run `supabase/seed.sql` the same way to load the 24 seed journal
prompts and the 8 launch shelves. This seed data is real product content
(not fictional placeholders), so it's safe to run in any environment. A
later phase will add clearly-marked fictional sample books here, gated so
they never reach production.

### Run locally

```bash
npm run dev
```

### Checks

```bash
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test        # Vitest unit tests
npm run build       # Production build
npm run test:e2e    # Playwright (starts its own prod server unless
                     # PLAYWRIGHT_BASE_URL is set)
```

## Environment variables

See `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` must never be committed and
must never be referenced from a file that can end up in a client bundle —
`src/lib/supabase/admin.ts` is the only place that reads it, and it is
guarded by the `server-only` package.

## Project structure

```
src/
  app/
    (public)/        # Landing page — no auth required
    (auth)/           # Sign up, sign in, password reset
    (app)/             # Authenticated app shell + Today/Journal/Library/
                         # Bookmarks/Inbox/Settings
    auth/callback/       # Supabase auth code exchange
    not-found.tsx          # Themed 404 (also covers non-owner entry ids)
  components/
    ui/                       # Small shared UI primitives
    today/                     # Today page's prompt card
    journal/                    # Journal entry editor
    publishing/                  # Leave-a-passage wizard, passage status/actions
    library/                      # Content-warning gate, bookmark/report, "read another"
  lib/
    actions/                # Server Actions (auth, journal, books, library, bookmarks, reports)
    moderation/               # ModerationProvider interface, mock provider, PII heuristic
    supabase/                # Browser/server/admin Supabase clients
    validation/                # Zod schemas shared by forms and actions
    prompts.ts                  # Daily-featured-prompt selection logic
    content-labels.ts            # Shared content-label metadata (value + display name)
    library.ts                    # Reader exclusions (blocked labels, reported books)
    random.ts                      # pickRandom — used by the discovery picker
  middleware.ts                 # Session refresh + route protection
supabase/
  migrations/                     # SQL migrations, applied in order
  seed.sql                         # Local/dev seed data (prompts + shelves so far)
tests/
  unit/                               # Vitest
  e2e/                                 # Playwright
```
