# Between the Pages

A private digital journal connected to **The Library** — a shared, anonymous
collection of short reflections. Write for yourself first; choose deliberately
what, if anything, becomes a passage a stranger might find.

Full product requirements live in the project's PRD (not included in this
repo). This README covers what's implemented and how to run it.

## Status

**Phase 1 of 6 (Foundation) is complete.** See [Implementation status](#implementation-status)
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

## Implementation status

**Built in Phase 1:**
- Project scaffold (Next.js, TypeScript, Tailwind, ESLint, Vitest, Playwright)
- Supabase browser/server/admin client helpers
- Database migration: `profiles`, `journal_entries`, `audit_log`, plus the
  `user_role` and `content_label` enums later phases will use
- Auth flows: sign up (with age attestation), sign in, sign out, request
  password reset, confirm new password, OAuth-style callback route
- Base app shell: themed root layout, authenticated app shell with nav,
  public landing page, placeholder pages for Today/Journal/Library/
  Bookmarks/Inbox/Settings

**Explicitly mocked or deferred — do not treat as production-ready:**
- There is no daily prompt, journal editor, publishing flow, library
  content, interactions, moderation, or admin dashboard yet. Every page
  under `(app)/` beyond auth is a one-line placeholder stating which phase
  builds it.
- No moderation provider exists yet (arrives in Phase 3). When it does, the
  mock implementation will be clearly labeled as a development-only stub,
  not a safety system.
- No rate limiting yet (Phase 6).

**What to verify manually:**
1. Create a real Supabase project and fill in `.env.local` from
   `.env.example`, then run `npm run dev` and confirm sign-up, sign-in,
   sign-out, and password reset all work end-to-end against real Supabase
   Auth (this repo's automated tests only exercise it against a live server
   with placeholder credentials, so they don't cover successful auth).
2. Apply `supabase/migrations/0001_foundation.sql` to that project (see
   below) and confirm in the Supabase dashboard that RLS is enabled on all
   three tables and that a new `profiles` row appears automatically when a
   user signs up.
3. Confirm `/today`, `/journal`, `/bookmarks`, `/inbox`, `/settings` redirect
   to `/login` when signed out, and are reachable when signed in.
4. Confirm `/library` and `/` load without signing in.

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
`supabase/migrations/` (in order) into the Supabase dashboard's SQL editor.

`supabase/seed.sql` is currently empty — it will gain shelf and prompt seed
data in later phases.

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
  components/ui/          # Small shared UI primitives
  lib/
    actions/                # Server Actions
    supabase/                # Browser/server/admin Supabase clients
    validation/                # Zod schemas shared by forms and actions
  middleware.ts                 # Session refresh + route protection
supabase/
  migrations/                     # SQL migrations, applied in order
  seed.sql                         # Local/dev seed data
tests/
  unit/                               # Vitest
  e2e/                                 # Playwright
```
