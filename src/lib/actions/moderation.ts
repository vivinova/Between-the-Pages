"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin/require-role";
import { recordAuditLog } from "@/lib/admin/audit-log";
import { notify } from "@/lib/notifications";
import type { ContentLabel } from "@/lib/supabase/types";

export type ActionResult = { error: string } | { error?: undefined };

const MODERATOR_ROLES = ["moderator", "admin"] as const;
const MODERATOR_REMOVED_PLACEHOLDER = "[This passage was removed by a moderator.]";

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------

export async function approveBook(bookId: string): Promise<ActionResult> {
  const role = await requireRole([...MODERATOR_ROLES]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("books")
    .update({ moderation_state: "published", published_at: new Date().toISOString() })
    .eq("id", bookId)
    .eq("moderation_state", "pending_review");
  if (error) return { error: "That book couldn't be approved right now." };

  await recordAuditLog(role.userId, "approve", "book", bookId);
  revalidatePath("/admin/books");
  return {};
}

export async function rejectBook(bookId: string, reason: string): Promise<ActionResult> {
  const role = await requireRole([...MODERATOR_ROLES]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("books")
    .update({ moderation_state: "rejected" })
    .eq("id", bookId)
    .eq("moderation_state", "pending_review");
  if (error) return { error: "That book couldn't be rejected right now." };

  await recordAuditLog(role.userId, "reject", "book", bookId, { reason });
  revalidatePath("/admin/books");
  return {};
}

export async function removeBookAsModerator(bookId: string, reason: string): Promise<ActionResult> {
  const role = await requireRole([...MODERATOR_ROLES]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("books")
    .update({
      moderation_state: "removed",
      removed_at: new Date().toISOString(),
      excerpt_text: MODERATOR_REMOVED_PLACEHOLDER,
    })
    .eq("id", bookId)
    .in("moderation_state", ["published", "archived"]);
  if (error) return { error: "That book couldn't be removed right now." };

  await recordAuditLog(role.userId, "remove", "book", bookId, { reason });
  revalidatePath("/admin/books");
  revalidatePath("/admin/reports");
  return {};
}

export async function relabelBook(bookId: string, labels: ContentLabel[]): Promise<ActionResult> {
  const role = await requireRole([...MODERATOR_ROLES]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { error } = await admin.from("books").update({ labels }).eq("id", bookId);
  if (error) return { error: "Labels couldn't be updated right now." };

  await recordAuditLog(role.userId, "relabel", "book", bookId, { labels });
  revalidatePath("/admin/books");
  return {};
}

// ---------------------------------------------------------------------------
// Margin notes
// ---------------------------------------------------------------------------

export async function approveMarginNote(interactionId: string): Promise<ActionResult> {
  const role = await requireRole([...MODERATOR_ROLES]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { data: note } = await admin
    .from("interactions")
    .select("book_id, reader_id")
    .eq("id", interactionId)
    .eq("type", "margin_note")
    .maybeSingle();
  if (!note) return { error: "That note couldn't be found." };

  const { data: book } = await admin
    .from("books")
    .select("owner_id, notes_visible_to_readers")
    .eq("id", note.book_id)
    .maybeSingle();

  const { error } = await admin
    .from("interactions")
    .update({
      moderation_state: "published",
      is_visible_to_readers: book?.notes_visible_to_readers ?? false,
    })
    .eq("id", interactionId)
    .eq("moderation_state", "pending_review");
  if (error) return { error: "That note couldn't be approved right now." };

  if (book && book.owner_id !== note.reader_id) {
    await notify({
      recipientId: book.owner_id,
      type: "margin_note_approved",
      bookId: note.book_id,
      interactionId,
    });
  }

  await recordAuditLog(role.userId, "approve", "interaction", interactionId);
  revalidatePath("/admin/notes");
  return {};
}

export async function rejectMarginNote(interactionId: string, reason: string): Promise<ActionResult> {
  const role = await requireRole([...MODERATOR_ROLES]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { data: note } = await admin
    .from("interactions")
    .select("book_id, reader_id")
    .eq("id", interactionId)
    .eq("type", "margin_note")
    .maybeSingle();
  if (!note) return { error: "That note couldn't be found." };

  const { error } = await admin
    .from("interactions")
    .update({ moderation_state: "rejected" })
    .eq("id", interactionId)
    .eq("moderation_state", "pending_review");
  if (error) return { error: "That note couldn't be rejected right now." };

  await notify({
    recipientId: note.reader_id,
    type: "margin_note_rejected",
    bookId: note.book_id,
    interactionId,
  });

  await recordAuditLog(role.userId, "reject", "interaction", interactionId, { reason });
  revalidatePath("/admin/notes");
  return {};
}

export async function removeMarginNoteAsModerator(
  interactionId: string,
  reason: string,
): Promise<ActionResult> {
  const role = await requireRole([...MODERATOR_ROLES]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("interactions")
    .update({ moderation_state: "removed" })
    .eq("id", interactionId)
    .eq("moderation_state", "published");
  if (error) return { error: "That note couldn't be removed right now." };

  await recordAuditLog(role.userId, "remove", "interaction", interactionId, { reason });
  revalidatePath("/admin/notes");
  revalidatePath("/admin/reports");
  return {};
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export async function resolveReport(reportId: string): Promise<ActionResult> {
  const role = await requireRole([...MODERATOR_ROLES]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("reports")
    .update({ review_state: "resolved" })
    .eq("id", reportId);
  if (error) return { error: "That report couldn't be updated right now." };

  await recordAuditLog(role.userId, "resolve", "report", reportId);
  revalidatePath("/admin/reports");
  return {};
}

export async function dismissReport(reportId: string): Promise<ActionResult> {
  const role = await requireRole([...MODERATOR_ROLES]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("reports")
    .update({ review_state: "dismissed" })
    .eq("id", reportId);
  if (error) return { error: "That report couldn't be updated right now." };

  await recordAuditLog(role.userId, "dismiss", "report", reportId);
  revalidatePath("/admin/reports");
  return {};
}

export async function escalateReport(reportId: string): Promise<ActionResult> {
  const role = await requireRole([...MODERATOR_ROLES]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("reports")
    .update({ review_state: "escalated" })
    .eq("id", reportId);
  if (error) return { error: "That report couldn't be updated right now." };

  await recordAuditLog(role.userId, "escalate", "report", reportId);
  revalidatePath("/admin/reports");
  return {};
}
