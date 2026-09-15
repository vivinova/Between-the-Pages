"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { submitBookSchema } from "@/lib/validation/publishing";
import { getModerationProvider } from "@/lib/moderation";

export type SubmitBookResult =
  | { ok: true; id: string; state: "published" | "pending_review" }
  | { ok: false; error: string };

export type ActionResult = { error: string } | { error?: undefined };

const REMOVED_EXCERPT_PLACEHOLDER = "[This passage was removed by its contributor.]";

export async function submitBook(input: unknown): Promise<SubmitBookResult> {
  const parsed = submitBookSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to sign in to publish to the library." };
  }

  // RLS scopes this to the caller's own entries — a non-owner or
  // nonexistent id simply returns no row.
  const { data: entry } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("id", data.sourceEntryId)
    .maybeSingle();
  if (!entry) {
    return { ok: false, error: "That journal entry couldn't be found." };
  }

  const { data: shelf } = await supabase
    .from("shelves")
    .select("id")
    .eq("id", data.shelfId)
    .eq("is_hidden", false)
    .maybeSingle();
  if (!shelf) {
    return { ok: false, error: "Choose a valid shelf." };
  }

  const provider = getModerationProvider();
  const result = await provider.checkContent(data.excerptText, "book_excerpt");
  const moderationState = result.requiresHumanReview ? "pending_review" : "published";

  const { data: book, error } = await supabase
    .from("books")
    .insert({
      owner_id: user.id,
      source_entry_id: data.sourceEntryId,
      excerpt_text: data.excerptText,
      shelf_id: data.shelfId,
      labels: data.labels,
      allow_margin_notes: data.allowMarginNotes,
      notes_visible_to_readers: data.allowMarginNotes && data.notesVisibleToReaders,
      moderation_state: moderationState,
      moderation_reasons: result.reasons,
      published_at: moderationState === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error || !book) {
    return { ok: false, error: "Your passage couldn't be submitted. Please try again." };
  }

  revalidatePath("/journal/passages");
  revalidatePath(`/journal/${data.sourceEntryId}/share`);
  return { ok: true, id: book.id, state: moderationState };
}

export async function archiveBook(id: string): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("books")
    .update({ moderation_state: "archived", archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("moderation_state", "published");

  if (error) {
    return { error: "That passage couldn't be archived right now." };
  }

  revalidatePath("/journal/passages");
  return {};
}

export async function removeBook(id: string): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("books")
    .update({
      moderation_state: "removed",
      removed_at: new Date().toISOString(),
      excerpt_text: REMOVED_EXCERPT_PLACEHOLDER,
    })
    .eq("id", id)
    .in("moderation_state", ["published", "archived"]);

  if (error) {
    return { error: "That passage couldn't be removed right now." };
  }

  revalidatePath("/journal/passages");
  return {};
}
