# Between the Pages

A private digital journal connected to **The Library** — a shared, anonymous
collection of short reflections. Write for yourself first; choose deliberately
what, if anything, becomes a passage a stranger might find.

Full product requirements live in the project's PRD (not included in this
repo). This README covers what's implemented and how to run it.

## Status

**Phase 2 of 6 (Journal) is complete.** See [Implementation status](#implementation-status)
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
  When Publishing (Phase 3) is built, `books.source_entry_id` will link a
  public excerpt back to its private source for the owner's and moderators'
  audit trail only; it is never joined into a reader-facing query.
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
  the library is a product requirement, even though the Library itself
  isn't built until Phase 4.
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

**Explicitly mocked or deferred — do not treat as production-ready:**
- There is no publishing flow, library content, interactions, moderation,
  or admin dashboard yet. `/library`, `/bookmarks`, `/inbox`, `/settings`,
  and `/journal/[id]/share` are still one-line placeholders stating which
  phase builds them.
- No moderation provider exists yet (arrives in Phase 3). When it does, the
  mock implementation will be clearly labeled as a development-only stub,
  not a safety system.
- No rate limiting yet (Phase 6).
- Session-interruption recovery relies entirely on the ~1.5s autosave to
  the database — there is no separate localStorage draft layer, so content
  typed in the last second or two before a hard crash is not recovered.

**What to verify manually:**
1. Create a real Supabase project and fill in `.env.local` from
   `.env.example`, then run `npm run dev` and confirm sign-up (including
   the "check your email" confirmation step), sign-in, sign-out, and
   password reset all work end-to-end against real Supabase Auth (this
   repo's automated tests only exercise it against a live server with
   placeholder credentials, so they don't cover successful auth).
2. Apply the migrations in `supabase/migrations/` and `supabase/seed.sql`
   to that project (see below) and confirm in the Supabase dashboard that
   RLS is enabled on all four tables and that a new `profiles` row appears
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
prompts. Seed data is real product content (not fictional placeholders), so
it's safe to run in any environment. Later phases will add clearly-marked
fictional sample books here, gated so they never reach production.

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
  lib/
    actions/                # Server Actions (auth, journal)
    supabase/                # Browser/server/admin Supabase clients
    validation/                # Zod schemas shared by forms and actions
    prompts.ts                  # Daily-featured-prompt selection logic
  middleware.ts                 # Session refresh + route protection
supabase/
  migrations/                     # SQL migrations, applied in order
  seed.sql                         # Local/dev seed data (24 prompts so far)
tests/
  unit/                               # Vitest
  e2e/                                 # Playwright
```
