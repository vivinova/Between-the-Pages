# Between the Pages

A private digital journal connected to **The Library** — a shared, anonymous
collection of short reflections. Write for yourself first; choose deliberately
what, if anything, becomes a passage a stranger might find.

Full product requirements live in the project's PRD (not included in this
repo). This README covers what's implemented and how to run it.

## Status

**All 6 phases are complete — this is a feature-complete MVP**, not a
production-ready deployment. See [Implementation status](#implementation-status)
for what's real versus explicitly mocked, and read that section before
treating anything here as safe to launch publicly. The top former gap — a
real moderation provider — is now implemented (`AnthropicModerationProvider`,
Claude-based classification; see below), but it is **opt-in, not the
default**: set `MODERATION_PROVIDER=anthropic` and `ANTHROPIC_API_KEY` to use
it, otherwise the app still runs on the local keyword/regex mock. A
deployment left on the default is not using real safety moderation.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — warm cream / dark wood / muted forest / dusty blue /
  faded burgundy palette; serif for passage text, sans for UI chrome
- **Supabase**: Postgres, Auth, and Row Level Security as the sole
  authorization boundary for user data
- **React Hook Form + Zod** for all form validation (client and re-validated
  server-side)
- Restrained motion via plain CSS transitions, not a JS animation library —
  there wasn't enough motion in this MVP (a few hover/reveal transitions) to
  justify Framer Motion's bundle weight, so it was removed as a dependency.
  Reduced motion is respected two ways: the OS-level `prefers-reduced-motion`
  media query, and a per-account override (`profiles.reduced_motion`, set in
  Settings) applied as `data-reduced-motion="true"` on the authenticated app
  shell — see `globals.css`.
- **Vitest** for unit tests, **Playwright** (+ `@axe-core/playwright` for
  automated accessibility scans) for critical end-to-end flows

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
- **The INSERT path needs the same discipline as UPDATE — a gap found and
  fixed while building Phase 5.** The trigger above only guards UPDATEs on
  an existing row; it took designing `interactions` (which has the exact
  same "some rows need review, some don't" shape as `books`) to notice
  that `books`' original INSERT policy checked only `owner_id`, not
  `moderation_state` — so a raw PostgREST call could create a book already
  `published`, skipping moderation at creation time entirely. Both tables
  now enforce the same rule at the RLS INSERT policy: a user's own session
  may only ever insert `pending_review` (for `books`; `interactions` splits
  this by type — `margin_note` must start `pending_review`, the text-free
  `needed_this`/`pressed_flower` may insert straight to `published` since
  there's no content to review). Auto-approving a low-risk submission is
  always a *second* step, done with the admin client
  (`createAdminClient()`), never the inserting user's own session — so
  "insert already published" isn't something any client-held credential
  can do, for either table. `submitBook` and `submitMarginNote` are the
  reference implementations of this two-step pattern.
- **The Supabase service-role key is server-only.** `src/lib/supabase/admin.ts`
  imports the `server-only` package, which fails the build if that module is
  ever pulled into a client bundle. It is used for the auto-approve step
  described below and for `notify()` (`src/lib/notifications.ts`): a
  notification's `recipient_id` is almost always *someone else* (the book
  owner, not the reader who triggered it), which the acting user's own
  session could never legitimately write under "insert your own row" RLS —
  so notification creation, and the read of the recipient's own
  `notification_settings` that gates it, both always go through the admin
  client.
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
- **The moderator dashboard (`/admin`) is authorized twice, and the two
  checks do different jobs.** `src/app/admin/layout.tsx` redirects a
  non-moderator away — that's a UI convenience, not security, since a
  Server Action is just a POST endpoint any signed-in browser could call
  directly regardless of which page rendered the button. The real boundary
  is `requireRole()` (`src/lib/admin/require-role.ts`), which every action
  in `src/lib/actions/moderation.ts` and `admin-content.ts` calls first,
  checking the caller's own `profiles.role` before touching anything with
  the admin client. There's a second, related trap specific to reads: even
  a moderator's own authenticated session can't see `pending_review`
  content, because RLS on `books`/`interactions` grants read access by
  ownership or published state, not by role — so every `/admin/*` page
  reads through the admin client too (see the comment atop
  `src/app/admin/page.tsx`), relying on the layout's redirect for
  authorization rather than RLS for that page. There is no self-service way
  to become a moderator — see "Bootstrapping a moderator" below.
- **Rate limiting is a plain sliding-window counter, not Vercel/Supabase
  infrastructure.** `checkRateLimit()` (`src/lib/rate-limit.ts`) prunes
  expired rows in `rate_limit_events` for that actor+action, counts what's
  left, and records the attempt if under the limit — self-cleaning, no
  background job needed. Applied to publishing, margin notes, and
  reporting; not to toggles like bookmarks/needed-this/flowers, which are
  already capped at one per reader per book by a unique constraint.
- **`LinkButton`, not `<Link><Button></Button></Link>`.** Every "link
  styled as a button" in this codebase renders a single `<a>`
  (`src/components/ui/link-button.tsx`), sharing `Button`'s classes. Wrapping
  a `<button>` inside a `<Link>` is invalid HTML (nested interactive
  content) and a real accessibility failure — it's what an automated axe
  scan caught on the landing page during the Phase 6 accessibility pass,
  and the same pattern turned out to be used in eight other places across
  the app. If you need a link that looks like a button, use `LinkButton`;
  if `Button`'s `onClick` needs to navigate imperatively after some async
  work, use `Button` plus `useRouter().push()`, not a `Link` wrapper.

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

**Built in Phase 5 (Community interactions):**
- Migration: `interactions` (needed_this/pressed_flower/margin_note, the
  `enforce_interaction_update_limits` trigger), `notifications`
  (admin-insert-only), and an extension to `reports` so a report can target
  a margin note as well as a book
- I needed this / pressed flower: toggleable, one per reader per book,
  notify the book owner (skipped for your own book), no public count —
  same personal-toggle privacy model as bookmarks
- Margin notes: compose with suggested-prompt starters, 240-char limit,
  edit while pending, delete anytime, contributor-only per-note visibility
  toggle, report as abusive. Always inserted as `pending_review`; a
  low-risk note is promoted to `published` by the admin client, same
  two-step pattern as `submitBook`
- Book reader: real `NeededThisButton`/`PressedFlowerButton`, approved and
  contributor-visible margin notes (excluding any the current reader has
  personally reported), and a submission form gated on the book's
  `allow_margin_notes` setting
- Quiet inbox (`/inbox`): type-specific notification copy, mark
  read/dismiss/mark-all-read, links back to the relevant book, minimal
  per-category notification toggles
- Contributor margin-note management (`/journal/passages/[id]`): accept or
  stop accepting new notes, change the visibility default, review approved
  notes with per-note visibility and report-as-abusive

**Built in Phase 6 (Safety & launch hardening):**
- Migration: `rate_limit_events` + RLS, `reports.review_state` gains
  `escalated`, and three new `profiles` columns Settings now exposes
  (`reduced_motion`, `default_allow_margin_notes`,
  `default_notes_visible_to_readers`)
- Rate limiting (`src/lib/rate-limit.ts`) wired into `submitBook`,
  `submitMarginNote`, `reportBook`, and `reportInteraction` — see the
  architecture note above for the mechanism and limits
- Crisis resource surfacing: a shared `checkForCrisisLanguage()`
  (`src/lib/moderation/crisis.ts`) — the same keyword list
  `MockModerationProvider` already used, now factored out so the client can
  show it too — drives a live, non-blocking `CrisisResourceNotice` on the
  publish preview and margin-note form, plus a persistent footer
  disclaimer and a standalone `/support` page
- Moderator dashboard (`/admin`): pending-books and pending-margin-notes
  queues (approve/reject with reason, inline relabeling), a reports queue
  (resolve/dismiss/escalate, plus a one-click "remove the reported
  content" shortcut), shelf and prompt management, and an audit-log
  history view. Every decision is recorded via `recordAuditLog()`
  (`src/lib/admin/audit-log.ts`) — actor, action, target, and reason.
  Rejecting a margin note now actually sends the `margin_note_rejected`
  notification Phase 5 only modeled the schema for.
- Settings (`/settings`, replacing the Phase 1 stub): blocked content
  labels, notification-category preferences (same toggles as the inbox,
  writing to the same `profiles.notification_settings`), margin-note
  defaults (pre-fills the leave-a-passage wizard's classification step),
  reduced-motion override, password change (reusing the existing
  `UpdatePasswordForm`), a data-export download, and account deletion
- `GET /api/export`: downloads the signed-in user's journal entries, their
  own books, bookmarks, and interactions as one JSON file
- Account deletion (`src/lib/actions/account.ts`): deletes the
  `auth.users` row via the admin client's `auth.admin.deleteUser` — every
  other table cascades from `profiles` via existing `ON DELETE CASCADE`
  foreign keys (`audit_log.actor_id` is `ON DELETE SET NULL` instead,
  preserving moderation history without keeping a live reference to the
  deleted account)
- Accessibility: a skip-to-content link, `prefers-reduced-motion` +
  per-account override CSS, and the `LinkButton` fix described above,
  caught and verified by an automated axe-core scan
  (`tests/e2e/accessibility.spec.ts`) covering every page reachable
  without a Supabase session in this sandbox
- `scripts/seed-dev-content.ts` (`npm run seed:dev`): the fictional sample
  content the earlier phases had to defer, now unblocked — see "Seeding
  fictional content" below

**Added after Phase 6: a real moderation provider.**
`AnthropicModerationProvider` (`src/lib/moderation/anthropic-provider.ts`)
classifies each submission with `claude-opus-5` via structured outputs
(`jsonSchemaOutputFormat`), asking it to choose from seven categories —
PII, active-crisis language, harassment, graphic/violent content, hate or
discrimination, sexual content, and spam/incoherent content — with a system
prompt that's explicit about the app's purpose: writing honestly about hard
things (including past self-harm or grief) is normal use and must not be
flagged as crisis language on its own; only language suggesting the writer
may be at risk *right now* should be. It still runs the same deterministic
`checkForPossiblePii`/`checkForCrisisLanguage` heuristics the mock provider
uses and unions their results in — belt-and-suspenders, not a replacement,
since regex is more reliable than an LLM for exact patterns like emails. It
fails closed: a classifier refusal (`stop_reason === "refusal"`) or any
API/network error is caught and routed straight to human review (new
`ModerationReason`s `flagged_by_safety_classifier` and
`moderation_check_failed`) rather than guessed at — and because every
submission is still inserted as `pending_review` first and only promoted to
`published` by a second admin-client step (see the two-step pattern above),
the worst a moderation-provider failure can do is leave something in the
`/admin` queue a little longer, never auto-publish or silently drop it.
Select it with `MODERATION_PROVIDER=anthropic` and `ANTHROPIC_API_KEY` (see
"Environment variables"); the mock remains the default so a deployment
that forgets to set these fails obviously (everything queues for review,
`isProductionReady` warns in the server log) rather than looking like real
moderation when it isn't.

**Explicitly mocked or deferred — this is an MVP, not a launch-ready app:**
- **The default moderation provider is still the local keyword/regex mock**
  — real moderation exists (above) but is opt-in. Even with the Anthropic
  provider enabled: there is no eval set or labeled test corpus measuring
  its accuracy on this app's actual content, no human-in-the-loop appeal
  path beyond the existing moderator dashboard, and every submission costs
  one live API call with the latency and spend that implies — none of that
  has been load- or cost-tested. Treat it as a substantial improvement over
  the mock, not as a substitute for the legal/safety review the PRD calls
  for before public launch.
- Reports can be escalated but escalation has no paging/external
  notification behind it — a human still has to be checking `/admin/reports`.
  The PRD itself defers the real escalation policy to legal/safety review
  before public launch; this MVP doesn't attempt to guess at one.
- Rate limits (5 publishes/hour, 20 notes/hour, 10 reports/hour) are
  conservative defaults, not researched thresholds — revisit once there's
  real usage data.
- No admin UI to promote a user to moderator/admin — see "Bootstrapping a
  moderator" below.
- Session-interruption recovery relies entirely on the ~1.5s autosave to
  the database — there is no separate localStorage draft layer, so content
  typed in the last second or two before a hard crash is not recovered.
  This applies to journal entries; the passage-composition step in the
  leave-a-passage flow isn't persisted at all until final submission
  (by design — canceling must never affect the private entry).
- Deletion/backup retention policy is a placeholder (soft-delete-style
  behavior isn't even implemented for most content — most deletes are
  immediate hard deletes today), pending the legal/retention review the
  PRD explicitly calls for before beta.
- Region-specific crisis resources: only US resources (988, Crisis Text
  Line) are shown, matching the PRD's "begin in one language and limited
  regions where crisis resources are verified."
- No automated integration/RLS tests run against a live Postgres — this
  sandbox has no real Supabase project. Everything DB-level (RLS policies,
  the two moderation-state triggers, the view-count RPC) has been reasoned
  through carefully and is called out with a specific manual check below,
  but "reasoned through" is not the same as "tested."

**What to verify manually:**
1. Create a real Supabase project and fill in `.env.local` from
   `.env.example`, then run `npm run dev` and confirm sign-up (including
   the "check your email" confirmation step), sign-in, sign-out, and
   password reset all work end-to-end against real Supabase Auth (this
   repo's automated tests only exercise it against a live server with
   placeholder credentials, so they don't cover successful auth).
2. Apply the migrations in `supabase/migrations/` and `supabase/seed.sql`
   to that project (see below) and confirm in the Supabase dashboard that
   RLS is enabled on all eleven tables and that a new `profiles` row appears
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
14. With two Supabase accounts (a contributor and a reader), on the
    contributor's published book: as the reader, click "I needed this" and
    press a flower, then confirm the contributor sees a notification for
    each on `/inbox` (and that undoing either as the reader makes the
    corresponding notification disappear, read or not). As the reader,
    submit a margin note with ordinary text and confirm it shows as
    "Approved" on the note itself and generates a `margin_note_approved`
    notification for the contributor; submit another containing an email
    address and confirm it shows as "Awaiting review" instead, with no
    notification yet — it now sits in the moderator queue (item 18 covers
    approving it from there). As the
    contributor, open `/journal/passages/<id>` for that book, confirm the
    approved note appears, toggle its visibility, and confirm a *third*
    Supabase account only sees it on the book page when that toggle is on.
    Turn off "Accept new margin notes" and confirm the reader's submission
    form disappears from the book page.
15. As a deliberate check of the same class of DB-level enforcement as
    item 10: using the Supabase dashboard directly as the note's author,
    try to update your own margin note's `moderation_state` straight to
    `published`, or edit its text after it's been approved. As a
    *different* user (not the book's owner), try to toggle
    `is_visible_to_readers` on someone else's margin note. All three
    should be rejected by `enforce_interaction_update_limits`.
16. In the inbox, dismiss a notification and confirm it's gone on refresh
    (not just hidden client-side); use "Mark all as read" and confirm the
    button disappears once nothing is unread; toggle a notification
    category off and confirm that action no longer creates notifications
    for you (test from a second account acting on your content).
17. Promote an account to moderator (see "Bootstrapping a moderator"
    below), confirm `/admin` is reachable for that account and redirects
    to `/today` for an ordinary account, and that `/admin` itself redirects
    to `/login` when signed out.
18. On `/admin/books`, approve a pending book and confirm it appears in the
    library; reject another and confirm it's gone from `/admin/books` but
    never appeared publicly. Edit a pending book's labels before approving
    and confirm the change sticks. Do the same on `/admin/notes` for a
    pending margin note, and confirm rejecting it creates a
    `margin_note_rejected` notification for the note's *author* (not the
    book's contributor).
19. File a report as one account, then as the moderator account open
    `/admin/reports`, confirm it's listed with the right content preview,
    and try Resolve, Dismiss, and Escalate. Use "Remove content" on a
    reported book and confirm it disappears from the library immediately.
20. On `/admin/shelves`, add a shelf and confirm it appears in the library
    grid; hide one and confirm it stops appearing there (existing books on
    it should still be reachable directly, just not listed). On
    `/admin/prompts`, add a prompt and activate/archive one, and confirm
    Today's rotation reflects it.
21. Open `/admin/history` and confirm every action taken in items 18-20
    shows up with the correct actor, action, target, and (where given) reason.
22. On `/settings`, block a content label and confirm a book with that
    label stops appearing anywhere in `/library`; change your password and
    confirm you can sign in with the new one; set margin-note defaults and
    confirm a new leave-a-passage submission pre-fills them; toggle reduced
    motion and confirm `data-reduced-motion="true"` appears on the app
    shell in devtools. Download your data export and confirm it's valid
    JSON containing your journal entries.
23. As a genuinely last, deliberate step: create a throwaway account,
    write an entry, publish a passage, then delete the account from
    Settings. Confirm in the Supabase dashboard that the `auth.users` row,
    `profiles` row, the journal entry, and the published book are all
    gone, and that the book no longer appears in `/library` for other
    accounts. This is the one action in the whole app that can't be undone
    — test it on a throwaway account, never your primary one.
24. With `MODERATION_PROVIDER=anthropic` and a real `ANTHROPIC_API_KEY` set,
    repeat the two moderation checks from items 8 and 14 (an ordinary
    passage/note publishes immediately; one with an email address queues
    for review) and confirm the outcome still matches — then submit a
    passage that's graphic, hateful, or sexually explicit (content the
    keyword mock would never catch) and confirm it's queued for review
    with the correct reason(s) on `/admin/books`. Also confirm ordinary
    writing about a hard past experience (grief, having survived something
    difficult) still auto-publishes — over-flagging normal journal content
    is a real failure mode here, not just under-flagging. Then unset
    `ANTHROPIC_API_KEY` (leaving `MODERATION_PROVIDER=anthropic`) and submit
    once more, confirming it fails closed to "Pending review" instead of
    erroring or silently publishing.

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
(not fictional placeholders), so it's safe to run in any environment.

### Bootstrapping a moderator

There is no self-service way to become a moderator (correctly — that would
be a privilege-escalation hole). After signing up normally, promote your
own account once via the Supabase dashboard's SQL editor:

```sql
update public.profiles set role = 'admin' where id = '<your-auth-user-id>';
```

Find your user id under Authentication → Users in the dashboard, or via
`select id from auth.users where email = '<your-email>';`. Use `'admin'` for
full access (including shelf/prompt management); `'moderator'` can do
everything under `/admin` except manage shelves and prompts.

### Seeding fictional content

The library is empty until something is published. Either publish a book
through the app's own flow (a good end-to-end check of Phase 3), or run:

```bash
npm run seed:dev
```

This creates two fictional accounts (`seed-contributor@example.com`,
`seed-reader@example.com`) and a handful of published books plus one
approved margin note under them, using the Supabase Admin API — the only
way to satisfy the `books.owner_id → profiles.id → auth.users.id` foreign
key chain outside the normal sign-up flow. It asks for interactive
confirmation naming the target project before writing anything.
**Never run this against a production project** — see the script's own
doc comment (`scripts/seed-dev-content.ts`) for why, and how the content it
creates stays identifiable as fictional.

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
guarded by the `server-only` package. The same applies to `ANTHROPIC_API_KEY`
— only read from `src/lib/moderation/anthropic-provider.ts`, a server-only
module. `MODERATION_PROVIDER` defaults to `mock`; set it to `anthropic` (and
provide `ANTHROPIC_API_KEY`) to use the real moderation provider described
above.

## Deployment

This is a stock Next.js 14 App Router project — Vercel needs no special
configuration beyond environment variables.

1. Push this repo to GitHub (or GitLab/Bitbucket) and import it in Vercel,
   or run `vercel` from the project root.
2. In the Vercel project's Settings → Environment Variables, set
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_SITE_URL` (your production
   URL, e.g. `https://your-app.vercel.app` — used to build auth
   redirect/callback links). Also set `MODERATION_PROVIDER=anthropic` and
   `ANTHROPIC_API_KEY` — leaving `MODERATION_PROVIDER` unset means real user
   content is moderated by the local keyword mock, not a production
   deployment should ship with. Use a **separate Supabase project** for
   production versus local development; never point a Vercel deployment at
   the same project you run `npm run seed:dev` against.
3. In the Supabase dashboard for that production project, apply every file
   in `supabase/migrations/` in order, then `supabase/seed.sql` (real
   product content, safe for production — see above). Do **not** run
   `npm run seed:dev` against it.
4. Under Supabase Authentication → URL Configuration, add your production
   URL's `/auth/callback` (e.g. `https://your-app.vercel.app/auth/callback`)
   to the redirect allow-list, or sign-up/password-reset emails will link
   back to nothing.
5. Deploy. Then follow "Bootstrapping a moderator" above against the
   production project to promote your own account.
6. Before treating it as live: confirm `MODERATION_PROVIDER=anthropic` is
   actually set (step 2) and run manual-verification item 24 above against
   the production project — none of this repo's own checks
   (lint/typecheck/tests/build) call the real classifier, so they can't
   confirm it's correctly wired in. Then work through the rest of the
   "Explicitly mocked or deferred" list above.

## Project structure

```
src/
  app/
    (public)/        # Landing page, /support — no auth required
    (auth)/           # Sign up, sign in, password reset
    (app)/             # Authenticated app shell + Today/Journal/Library/
                         # Bookmarks/Inbox/Settings
    admin/               # Moderator dashboard — separate layout/nav, role-gated
    api/export/            # Account data export (route handler, not a Server Action)
    auth/callback/           # Supabase auth code exchange
    not-found.tsx              # Themed 404 (also covers non-owner entry ids)
  components/
    ui/                       # Small shared UI primitives (Button, LinkButton, Field)
    today/                     # Today page's prompt card
    journal/                    # Journal entry editor
    publishing/                  # Leave-a-passage wizard, passage status/actions,
                                   # contributor margin-note management
    library/                      # Content-warning gate, bookmark/report, "read
                                    # another", needed-this/flower buttons, margin
                                    # notes section
    inbox/                          # Notification item, category preferences,
                                      # mark-all-read
    settings/                         # Blocked labels, reduced motion, margin-note
                                        # defaults, delete-account confirmation
    admin/                              # Moderation queue items, shelf/prompt rows
    support/                             # Crisis resource notice
  lib/
    actions/                # Server Actions (auth, journal, books, library,
                              # bookmarks, reports, interactions, margin-notes,
                              # notifications, settings, account, moderation,
                              # admin-content)
    admin/                    # requireRole() — the real /admin auth boundary —
                                # and recordAuditLog()
    moderation/               # ModerationProvider interface, mock + Anthropic
                                # providers, PII heuristic, shared crisis check
    supabase/                # Browser/server/admin Supabase clients
    validation/                # Zod schemas shared by forms and actions
    prompts.ts                  # Daily-featured-prompt selection logic
    content-labels.ts            # Shared content-label metadata (value + display name)
    library.ts                    # Reader exclusions (blocked labels, reported books)
    random.ts                      # pickRandom — used by the discovery picker
    notifications.ts                # notify() — admin-client notification creation
    rate-limit.ts                    # checkRateLimit() sliding-window limiter
  middleware.ts                 # Session refresh + route protection
scripts/
  seed-dev-content.ts             # npm run seed:dev — fictional library content
supabase/
  migrations/                     # SQL migrations, applied in order
  seed.sql                         # Local/dev seed data (prompts + shelves)
tests/
  unit/                               # Vitest
  e2e/                                 # Playwright, including axe-core scans
```
