# Between the Pages

An anonymous confession board. Say what you can't say elsewhere, sorted into
a category, published with no name, no login, and no trace back to you.
Other visitors can react to and reply on a published confession — also
anonymously.

## Status

**Phase 1 of 4 (Foundation) is complete.** Categories/browsing/submission
(Phase 2), live reactions/replies (Phase 3), and the admin moderation
dashboard (Phase 4) are not built yet — right now this is schema, moderation
plumbing, and an app shell with two "coming soon" pages. Nothing here is
usable end-to-end yet.

### Why the pivot

This started as a private-journal-plus-shared-library app with full Supabase
Auth accounts — six phases, fully built and verified (see git history before
this rewrite). It's been rebuilt as a simpler, account-free confession board
instead: no signup/login/password-reset flows, no per-user data to protect
or export or delete, smaller footprint for a portfolio piece — while keeping
the ideas that mattered (anonymous publishing behind a real moderation
provider, live community interaction, a genuine two-tier authorization
model) without the accounts surface.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Supabase**: Postgres + Row Level Security as the authorization
  boundary — no Supabase Auth. Every public table is writable by the `anon`
  role directly; moderation-state triggers and RLS row-visibility policies
  do the work "owner_id = auth.uid()" used to do in the previous version.
- **Claude API** (`claude-opus-5`) for content moderation — carried over
  from the previous version's `AnthropicModerationProvider` essentially
  unchanged, just re-pointed at confessions/replies instead of journal
  excerpts/margin notes.
- **React Hook Form + Zod** for form validation (client and re-validated
  server-side)
- **Vitest** (unit) + **Playwright** + **@axe-core/playwright** (E2E,
  accessibility)

## Architecture notes

- **No accounts means no `auth.uid()` for RLS to scope rows by**, so
  identity where it's still needed (reaction dedup, rate limiting) comes
  from a fingerprint hash instead: a long-lived httpOnly anonymous cookie
  id, combined with a coarse IP signal and hashed with SHA-256
  (`src/lib/fingerprint.ts`), never the raw IP. It's weaker than a real
  account — clearing cookies resets it — but that's an accepted,
  documented gap, not an oversight.
- **The submission pipeline still uses the two-step "insert as
  pending_review, then a separate promote-to-published step" pattern**
  from the previous version: RLS lets `anon` insert a confession or reply
  only with `moderation_state = 'pending_review'`; only the service-role
  admin client can move it to `published`. This is the actual safety
  boundary, not application code discipline — even a bug in the submit
  action can't directly publish something.
- **Rate limiting has to be admin-client-only now.** The previous version
  scoped `rate_limit_events` rows to `actor_id = auth.uid()` via RLS, which
  no longer exists. Since there's no way to prove "this fingerprint belongs
  to the requester" from inside a Postgres RLS policy, `rate_limit_events`
  has no RLS policy for `anon`/`authenticated` at all (default-deny), and
  `checkRateLimit()` always goes through the service-role client — the
  server action itself is the trust boundary instead.
- **Hiding the optional contact email from public reads needs more than
  RLS.** RLS policies only restrict *rows*, not *columns* — a row-scoped
  "published confessions are readable" policy would still let a direct
  REST call select `contact_email` off a published row. The migration
  explicitly `revoke`s table-level `SELECT` on `confessions` from
  `anon`/`authenticated` and exposes a `public_confessions` view (with
  `security_invoker = true`, so it re-checks RLS as the querying role
  instead of running with the view owner's own bypass) that excludes
  `contact_email`, `email_opt_in`, `owner_token_hash`, and
  `moderation_reasons` entirely. The app only ever reads through the view
  for public browsing; the service-role client reads the base table
  directly for moderation and any future digest job.
- **Deleting your own confession without an account** works via a
  bearer-token pattern: a random token is generated at submission, shown to
  the author exactly once, and only its SHA-256 hash is stored
  (`owner_token_hash`). Deleting later means presenting the original token,
  which the server re-hashes and compares — same shape as a password reset
  link, minus the account.
- **The `/admin` moderator dashboard has no per-moderator accounts either**
  — a single shared passphrase (`ADMIN_PASSWORD`) gates it, verified in a
  server action that issues a stateless, HMAC-signed session cookie
  (`src/lib/admin/session.ts`, Web Crypto only — no `node:crypto` — so the
  same verification code runs in both the Edge middleware and Node server
  actions). Same dual-authorization split as the previous version's
  role-based dashboard: middleware redirecting an unauthenticated visitor
  away from `/admin` is a UI convenience; `requireAdminSession()`
  re-checking the same cookie inside every moderation server action is the
  real boundary, since a direct POST to a server action skips middleware
  entirely.

## Implementation status

**Built in Phase 1 (Foundation):**
- Migration (`supabase/migrations/0001_confessions.sql`): `categories`,
  `confessions`, `interactions` (reactions publish immediately since they
  carry no text; replies go through the pending-review gate, enforced by
  a `BEFORE INSERT` trigger, not just app-code discipline), `reports`,
  `rate_limit_events`, `audit_log`, and the `public_confessions` view
  described above. Seed: the 12 confession categories
  (`supabase/seed.sql`).
- Stripped the entire previous accounts system: Supabase Auth, `profiles`,
  `journal_entries`, prompts, the role-based `/admin`, per-account
  settings/notifications/export/deletion, and the `@supabase/ssr`
  dependency along with it (there's no session to sync anymore, so a plain
  `@supabase/supabase-js` client is enough — see
  `src/lib/supabase/server.ts`).
- Re-pointed the moderation module at the new content shape: `checkForCrisisLanguage`/`checkForPossiblePii`
  (unchanged), `AnthropicModerationProvider`'s system prompt rewritten for
  a confession board instead of a journal library, `ModerationContext`
  narrowed to `"confession" | "reply"`.
- `rate-limit.ts` adapted to fingerprint-based, admin-client-only checks
  (see above).
- `/admin` passphrase-auth infrastructure (`src/lib/admin/session.ts`,
  `require-admin-session.ts`, `middleware.ts`) — the login page and the
  actual moderation queues are Phase 4.
- New app shell (single root layout, no more authenticated-vs-public route
  split since everything is public now), landing page, and two
  placeholder pages (`/categories`, `/confess`) that Phase 2 replaces with
  the real thing.

**Explicitly mocked or deferred — this is an in-progress rebuild, not a
finished app:**
- **Categories, submission, browsing, reactions, replies, and the
  moderation dashboard don't exist yet** — Phases 2 through 4. Right now
  `/categories` and `/confess` are literally "Coming soon" pages.
- **The moderation provider defaults to the local keyword/regex mock**,
  same as before — set `MODERATION_PROVIDER=anthropic` and
  `ANTHROPIC_API_KEY` for real moderation. See the previous phase's README
  section on this (carried over unchanged in spirit): it's opt-in, fails
  closed on error/refusal, and has no eval set measuring its accuracy on
  this app's actual content.
- **The weekly email digest is not built.** `confessions.contact_email` /
  `email_opt_in` capture the data at submission time, but there's no cron
  job or email service wired up yet — deliberately deferred (see the
  conversation that led to this rewrite): it's a comparable amount of new
  infrastructure (a transactional email provider, an unsubscribe flow, a
  scheduled job) to everything else in this MVP combined, and isn't needed
  for the core confession/react/reply loop to work.
- **No admin UI to change `ADMIN_PASSWORD`** — it's a single env var,
  rotated by redeploying with a new value.
- **Saved/bookmarked confessions are localStorage-only, client-side, no
  server round-trip** (per-device, not portable) — Phase 3.

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
# Also set ADMIN_PASSWORD and ADMIN_SESSION_SECRET (see .env.example).
```

### Database

Apply the migration and seed to your Supabase project. With the Supabase
CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
psql "$(supabase db url)" -f supabase/seed.sql   # or run seed.sql via the dashboard's SQL editor
```

### Run locally

```bash
npm run dev
```

### Checks

```bash
npm run lint
npm run typecheck
npm run test        # unit (Vitest)
npm run test:e2e     # E2E + accessibility (Playwright — run `npm run build && npm run start` first, or let Playwright's webServer do it)
npm run build
```

## Environment variables

See `.env.example`. `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, and
`ADMIN_SESSION_SECRET` must never be committed and must never be referenced
from a file that can end up in a client bundle — `src/lib/supabase/admin.ts`
and `src/lib/admin/session.ts` are the only places that read them,
`admin.ts` guarded by the `server-only` package.

## Project structure

```
src/
  app/
    page.tsx                 # Landing page
    categories/               # Browse by category — placeholder, Phase 2
    confess/                  # Submission form — placeholder, Phase 2
    support/                  # Crisis resource page
    admin/                     # Moderator dashboard — Phase 4
    layout.tsx                # Root layout: nav, footer disclaimer, skip-link
  components/
    support/                  # CrisisResourceNotice
    ui/                        # Button, LinkButton, Field
  lib/
    admin/
      session.ts               # Stateless HMAC session token (Edge + Node safe)
      require-admin-session.ts # The real /admin auth boundary (server actions)
      audit-log.ts              # recordAuditLog() — service-role only
    moderation/                # ModerationProvider interface, mock + Anthropic
                                # providers, PII heuristic, shared crisis check
    supabase/                # Anon-key server client + service-role admin client
    env.ts                    # Typed, fail-fast environment variable access
    fingerprint.ts             # Anonymous cookie id + IP → SHA-256 hash
    rate-limit.ts               # Sliding-window limiter, admin-client-only
supabase/
  migrations/0001_confessions.sql
  seed.sql                    # The 12 confession categories
tests/
  unit/                       # Vitest — moderation, PII/crisis heuristics,
                                # admin session tokens
  e2e/                        # Playwright — accessibility scan of every
                                # page reachable without the admin passphrase
```
