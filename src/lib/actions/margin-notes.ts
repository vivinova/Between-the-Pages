"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { marginNoteSchema } from "@/lib/validation/interactions";
import { getModerationProvider } from "@/lib/moderation";
import { notify } from "@/lib/notifications";

export type ActionResult = { error: string } | { error?: undefined };
export type SubmitMarginNoteResult =
  | { ok: true; state: "published" | "pending_review" }
  | { ok: false; error: string };

export async function submitMarginNote(input: unknown): Promise<SubmitMarginNoteResult> {
  const parsed = marginNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { bookId, noteText } = parsed.data;

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sign in to write a margin note." };
  }

  const { data: book } = await supabase
    .from("books")
    .select("owner_id, allow_margin_notes, notes_visible_to_readers")
    .eq("id", bookId)
    .eq("moderation_state", "published")
    .maybeSingle();
  if (!book) {
    return { ok: false, error: "That book couldn't be found." };
  }
  if (!book.allow_margin_notes) {
    return { ok: false, error: "This contributor isn't accepting margin notes right now." };
  }

  const provider = getModerationProvider();
  const result = await provider.checkContent(noteText, "margin_note");

  // Always inserted as pending_review — enforced by RLS, not just here.
  // Unlike book excerpts, a margin note only ever reaches 'published'
  // through the admin-client step below or, later, a moderator; there is
  // no path where the user's own session can set that value.
  const { data: interaction, error } = await supabase
    .from("interactions")
    .insert({
      book_id: bookId,
      reader_id: user.id,
      type: "margin_note",
      note_text: noteText,
      moderation_state: "pending_review",
      moderation_reasons: result.reasons,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You've already left a margin note on this book." };
    }
    return { ok: false, error: "Your note couldn't be submitted. Please try again." };
  }

  if (!result.requiresHumanReview) {
    const admin = createAdminClient();
    const { error: publishError } = await admin
      .from("interactions")
      .update({
        moderation_state: "published",
        is_visible_to_readers: book.notes_visible_to_readers,
      })
      .eq("id", interaction.id);

    if (!publishError) {
      if (book.owner_id !== user.id) {
        await notify({
          recipientId: book.owner_id,
          type: "margin_note_approved",
          bookId,
          interactionId: interaction.id,
        });
      }
      revalidatePath(`/library/books/${bookId}`);
      return { ok: true, state: "published" };
    }
  }

  return { ok: true, state: "pending_review" };
}

export async function updateMarginNote(interactionId: string, noteText: string): Promise<ActionResult> {
  const parsed = marginNoteSchema.shape.noteText.safeParse(noteText);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid note." };
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to edit your note." };
  }

  const { error } = await supabase
    .from("interactions")
    .update({ note_text: parsed.data })
    .eq("id", interactionId)
    .eq("reader_id", user.id);

  if (error) {
    return { error: "This note can only be edited while it's still pending review." };
  }

  return {};
}

export async function deleteMarginNote(interactionId: string): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to delete your note." };
  }

  const { error } = await supabase
    .from("interactions")
    .delete()
    .eq("id", interactionId)
    .eq("reader_id", user.id);

  if (error) {
    return { error: "That note couldn't be deleted right now." };
  }

  return {};
}

export async function setMarginNoteVisibility(
  interactionId: string,
  visible: boolean,
): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("interactions")
    .update({ is_visible_to_readers: visible })
    .eq("id", interactionId);

  if (error) {
    return { error: "That couldn't be changed right now." };
  }

  revalidatePath("/journal/passages");
  return {};
}
