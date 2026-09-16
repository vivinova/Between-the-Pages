# Between the Pages

An anonymous confession board. Say what you can't say elsewhere, sorted into
a category, published with no name, no login, and no trace back to you.
Other visitors can react to and reply on a published confession — also
anonymously.

## Status

**Phases 1-3 of 4 are complete.** You can browse categories, read a
confession, submit one (real moderation gate, real anonymous delete link),
react to it, reply on it, report it, and save it to a local list. The admin
moderation dashboard (Phase 4) is not built yet — there is currently no way
to review the moderation queue except directly in the Supabase dashboard.

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
- **Reaction dedup ("has this visitor already reacted?") goes through the
  admin client end to end**, unlike confessions/replies. There's no text
  to moderate in a reaction, so the only interesting question is identity —
  and like rate limiting, RLS has no way to verify "this fingerprint
  belongs to the requester," so `toggleReaction` reads and writes via the
  admin client, with the fingerprint always computed server-side from the
  request's own cookies (`getFingerprintHash()`), never trusted from
  client input. The unique index on `(confession_id, type,
  fingerprint_hash)` is a second backstop against a race inserting a
  duplicate reaction.
- **A duplicate report isn't an error.** `reports` has a unique constraint
  on `(target_type, target_id, reporter_fingerprint_hash)`, so a second
  report from the same visitor on the same thing raises a Postgres unique
  violation (`23505`) — `reportContent` catches specifically that code and
  still returns `ok: true`, since from the visitor's perspective nothing
  went wrong; they already reported it.

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
  split since everything is public now) and landing page.

**Built in Phase 2 (Core submission + browsing):**
- `src/lib/validation/confessions.ts` + `src/lib/actions/confessions.ts`:
  `submitConfession` runs the same two-step pattern as the previous
  version's `submitBook` — moderation check, insert as `pending_review`
  via the RLS-scoped client, then (only if the check didn't require human
  review) a second update to `published` via the admin client.
  `deleteMyConfession` re-hashes the presented token and compares against
  `owner_token_hash` via the admin client (anon has no delete policy on
  `confessions` at all).
- `/confess`: category select, body textarea with a live character count,
  a live PII warning (`checkForPossiblePii`, client-side, same heuristic
  the server re-checks) and `CrisisResourceNotice` as you type, an
  optional "email me about interactions" toggle. On success, shows
  published-vs-pending-review state, the confession's own text (no
  round-trip needed — it's already in the form), and a one-time delete
  option; the id/token pair is saved to `localStorage`
  (`src/lib/my-confessions.ts`) so the same browser can delete it again
  later from the confession's own page.
- `/categories`: grid of the 12 categories, plus a "Surprise me" link to
  `/confessions/random` (picks randomly among the 50 most recent published
  confessions — same `pickRandom` helper the previous version's Find Me
  Something used).
- `/categories/[slug]`: published confessions in that category, newest
  first, reading only from `public_confessions` (never the base table).
- `/confessions/[id]`: full confession text, no owner/date shown (nothing
  to hide an owner from, but an exact timestamp could still help someone
  correlate a confession with a real event, so it's omitted the same way
  the previous version hid exact dates on book pages); a
  `DeleteConfessionButton` that checks `localStorage` client-side after
  mount and renders nothing if this browser didn't submit this confession.

**Built in Phase 3 (Live interactions):**
- `toggleReaction` (`src/lib/actions/interactions.ts`): "Me too" and
  "Sending love" on `/confessions/[id]`, deduped per fingerprint via the
  admin client (see the architecture note above), with an optimistic UI
  (`ReactionButtons`) that rolls back if the server call fails or
  disagrees with the client's assumption.
- `submitReply`: the same two-step pending-review/promote pattern as
  confessions, applied to a 500-character reply. Replies list oldest
  first under a confession (a natural conversation order, unlike the
  confessions feed itself, which is newest-first).
- `reportContent` (`src/lib/actions/reports.ts`): reports a confession or
  a reply against one of 8 reasons (`src/lib/report-reasons.ts`), rate
  limited, silently idempotent on a duplicate report from the same
  visitor (see the architecture note above). No report reading/review UI
  yet — that's `/admin` in Phase 4.
- Save for later (`src/lib/saved-confessions.ts`, `/saved`): entirely
  client-side, no server round-trip, no accounts to sync across devices —
  by design, per the earlier decision to keep bookmarking simple.

**Explicitly mocked or deferred — this is an in-progress rebuild, not a
finished app:**
- **The moderation dashboard doesn't exist yet** — Phase 4. There is
  currently no way to approve/reject a `pending_review` confession or
  reply, or review a report, except directly in the Supabase dashboard.
- **No reply editing or deletion** — unlike confessions, a submitted
  reply has no owner-token delete flow. Deferred to keep Phase 3's scope
  tight; the same bearer-token pattern confessions use would extend to
  replies without much new design if it's wanted later.
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

**What to verify manually** (this sandbox has no real Supabase project, so
none of this has been exercised against a live database — see "Getting
started" below):
1. Apply the migration and seed to a real project, then confirm `/categories`
   shows all 12 categories and `/categories/<slug>` loads for each.
2. Submit an ordinary confession from `/confess` and confirm it shows as
   published immediately, with a working "View it" link.
3. Submit one containing an email address or the phrase "want to end my
   life" and confirm it shows as awaiting review instead — then check the
   Supabase dashboard directly and confirm the row is `pending_review` with
   `moderation_reasons` populated, not `published`.
4. Delete a confession you just submitted, in the same browser, both from
   the success panel and from the confession's own page. Confirm the row is
   gone in the Supabase dashboard. Then open the confession's URL in a
   private/incognito window and confirm there's no delete button (no
   `localStorage` entry there).
5. Try `GET /rest/v1/confessions?select=contact_email` directly against
   your project's REST API with the anon key (after opting into an email on
   a test submission) and confirm it's rejected — this is the
   `revoke select` from the migration actually taking effect, not just
   present in the SQL file.
6. Click "Surprise me" a few times and confirm it lands on different
   published confessions (and doesn't error when there are very few).
7. On a published confession, click "Me too" and confirm the count goes up
   and the button stays highlighted after a page refresh; click it again
   and confirm it un-reacts. Open the same confession in a private window
   and confirm the button starts unhighlighted there (a different
   fingerprint).
8. Submit an ordinary reply and confirm it appears immediately; submit one
   containing an email address and confirm it doesn't appear but the
   confession's reply count/list doesn't error — check the Supabase
   dashboard and confirm it's sitting there as `pending_review`.
9. Report a confession, then try reporting it again from the same browser
   and confirm the UI doesn't show an error (the duplicate is silently
   accepted per the architecture note above) — then check the Supabase
   dashboard and confirm exactly one row exists in `reports` for it, not
   two.
10. Save a confession from its detail page, confirm it appears on
    `/saved`, then remove it from `/saved` and confirm it's gone from both
    places. Confirm `/saved` in a private window shows nothing (per-device
    by design).

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
    page.tsx                    # Landing page
    categories/                  # Category grid
    categories/[slug]/            # Published confessions in one category
    confess/                     # Submission form
    confessions/[id]/              # Confession detail: reactions, replies,
                                    # report, save, delete-your-own
    confessions/random/            # "Surprise me" redirect
    saved/                        # localStorage-only saved confessions list
    support/                     # Crisis resource page
    admin/                        # Moderator dashboard — Phase 4
    layout.tsx                   # Root layout: nav, footer disclaimer, skip-link
  components/
    confess/                     # ConfessForm, DeleteConfessionButton
    confessions/                  # ReactionButtons, ReplyForm, ReportButton,
                                   # SaveConfessionButton
    support/                     # CrisisResourceNotice
    ui/                           # Button, LinkButton, Field
  lib/
    actions/
      confessions.ts              # submitConfession, deleteMyConfession
      interactions.ts             # toggleReaction, submitReply, reaction reads
      reports.ts                  # reportContent
    validation/
      confessions.ts              # Zod schema for submission
      interactions.ts             # Zod schemas for reactions/replies/reports
    admin/
      session.ts                  # Stateless HMAC session token (Edge + Node safe)
      require-admin-session.ts    # The real /admin auth boundary (server actions)
      audit-log.ts                 # recordAuditLog() — service-role only
    moderation/                   # ModerationProvider interface, mock + Anthropic
                                   # providers, PII heuristic, shared crisis check
    supabase/                   # Anon-key server client + service-role admin client
    env.ts                       # Typed, fail-fast environment variable access
    fingerprint.ts                # Anonymous cookie id + IP → SHA-256 hash
    my-confessions.ts             # localStorage record of confessions this browser submitted
    saved-confessions.ts          # localStorage "save for later" list
    report-reasons.ts             # The 8 report reasons, shared by the form and (later) /admin
    rate-limit.ts                  # Sliding-window limiter, admin-client-only
supabase/
  migrations/0001_confessions.sql
  seed.sql                       # The 12 confession categories
tests/
  unit/                          # Vitest — moderation, PII/crisis heuristics,
                                  # admin session tokens, confession/interaction validation
  e2e/                           # Playwright — accessibility scan + navigation,
                                  # every page reachable without the admin passphrase
```
