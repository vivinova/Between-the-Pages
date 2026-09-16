/**
 * DEV-ONLY. Seeds a handful of clearly-fictional published books (and one
 * approved margin note) so the library has something to browse locally.
 *
 * Why this can't be a plain .sql seed file: books.owner_id ultimately
 * chains to auth.users.id, and auth.users rows can only be created through
 * Supabase's Auth system (GoTrue), not a raw SQL insert. This script uses
 * the Admin API (service-role key) to create two fictional accounts, then
 * inserts books/interactions under them directly — bypassing the normal
 * submission flow and its moderation check entirely, which is fine here
 * since this is trusted, hand-written content, not a user submission.
 *
 * NEVER run this against a production project. All content is fictional
 * and clearly marked as such by account (seed-*@example.com) — this script
 * is the label; nothing about the account or its content is disguised as
 * a real user contribution.
 *
 * Usage:
 *   npm run seed:dev
 */

import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline/promises";

const SEED_CONTRIBUTOR_EMAIL = "seed-contributor@example.com";
const SEED_READER_EMAIL = "seed-reader@example.com";
const SEED_PASSWORD = "seed-local-dev-only-not-a-real-account-1!";

const FICTIONAL_BOOKS = [
  { shelfSlug: "feel-behind", excerpt: "Some days the only thing I finish is the day itself, and I'm trying to let that count for something." },
  { shelfSlug: "miss-someone", excerpt: "I still set two cups out some mornings before I remember. I don't think that's a bad thing anymore." },
  { shelfSlug: "not-forgiven-yourself", excerpt: "I keep waiting to feel like I've earned forgiving myself. I'm starting to think that's not how it works." },
  { shelfSlug: "becoming-someone-new", excerpt: "I don't recognize the person I was two years ago, and for the first time that feels like relief instead of loss." },
  { shelfSlug: "lessons-learned-too-late", excerpt: "I wish someone had told me that resting isn't the same as giving up. I had to learn it the slow way." },
  { shelfSlug: "tiny-reasons-to-keep-going", excerpt: "The dog waiting by the door every single time, like it's never once occurred to her that I might not come back." },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    `This will insert fictional seed content into ${url}.\nThis must NEVER be a production project. Type "yes" to continue: `,
  );
  rl.close();
  if (answer.trim().toLowerCase() !== "yes") {
    console.log("Aborted.");
    return;
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  async function getOrCreateSeedUser(email: string): Promise<string> {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { age_confirmed: true },
    });

    if (!error && created.user) {
      return created.user.id;
    }

    // Already exists — look it up instead.
    const { data: page, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;
    const found = page.users.find((u) => u.email === email);
    if (!found) throw new Error(`Could not create or find seed user ${email}: ${error?.message}`);
    return found.id;
  }

  const contributorId = await getOrCreateSeedUser(SEED_CONTRIBUTOR_EMAIL);
  const readerId = await getOrCreateSeedUser(SEED_READER_EMAIL);

  const { data: shelves, error: shelvesError } = await admin.from("shelves").select("id, slug");
  if (shelvesError) throw shelvesError;
  const shelfIdBySlug = new Map((shelves ?? []).map((s) => [s.slug, s.id]));

  const bookIds: string[] = [];
  for (const book of FICTIONAL_BOOKS) {
    const shelfId = shelfIdBySlug.get(book.shelfSlug);
    if (!shelfId) {
      console.warn(`Skipping "${book.excerpt.slice(0, 30)}…" — shelf "${book.shelfSlug}" not found. Run the main seed.sql first.`);
      continue;
    }

    const { data: existing } = await admin
      .from("books")
      .select("id")
      .eq("owner_id", contributorId)
      .eq("excerpt_text", book.excerpt)
      .maybeSingle();
    if (existing) {
      bookIds.push(existing.id);
      continue;
    }

    const { data: inserted, error } = await admin
      .from("books")
      .insert({
        owner_id: contributorId,
        excerpt_text: book.excerpt,
        shelf_id: shelfId,
        allow_margin_notes: true,
        notes_visible_to_readers: true,
        moderation_state: "published",
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    bookIds.push(inserted.id);
  }

  if (bookIds[0]) {
    const { data: existingNote } = await admin
      .from("interactions")
      .select("id")
      .eq("book_id", bookIds[0])
      .eq("reader_id", readerId)
      .eq("type", "margin_note")
      .maybeSingle();

    if (!existingNote) {
      const { error } = await admin.from("interactions").insert({
        book_id: bookIds[0],
        reader_id: readerId,
        type: "margin_note",
        note_text: "I have felt this too. Thank you for writing it down.",
        moderation_state: "published",
        is_visible_to_readers: true,
      });
      if (error) throw error;
    }
  }

  console.log(`Seeded ${bookIds.length} fictional books under ${SEED_CONTRIBUTOR_EMAIL}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
