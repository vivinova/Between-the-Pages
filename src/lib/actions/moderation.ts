"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession } from "@/lib/admin/require-admin-session";
import { recordAuditLog } from "@/lib/admin/audit-log";
import type { ReportReviewState } from "@/lib/supabase/types";

export type ModerationActionResult = { ok: true } | { ok: false; error: string };

async function setConfessionState(
  id: string,
  state: "published" | "removed",
  auditAction: string,
): Promise<ModerationActionResult> {
  const session = await requireAdminSession();
  if (!session.ok) return session;

  const admin = createAdminClient();
  const update =
    state === "published"
      ? { moderation_state: state, published_at: new Date().toISOString() }
      : { moderation_state: state };

  const { error } = await admin.from("confessions").update(update).eq("id", id);
  if (error) return { ok: false, error: "That action couldn't be completed." };

  await recordAuditLog(auditAction, "confession", id);
  return { ok: true };
}

async function setReplyState(
  id: string,
  state: "published" | "removed",
  auditAction: string,
): Promise<ModerationActionResult> {
  const session = await requireAdminSession();
  if (!session.ok) return session;

  const admin = createAdminClient();
  const { error } = await admin
    .from("interactions")
    .update({ moderation_state: state })
    .eq("id", id);
  if (error) return { ok: false, error: "That action couldn't be completed." };

  await recordAuditLog(auditAction, "interaction", id);
  return { ok: true };
}

export async function approveConfession(id: string): Promise<ModerationActionResult> {
  return setConfessionState(id, "published", "approve_confession");
}

export async function rejectConfession(id: string): Promise<ModerationActionResult> {
  return setConfessionState(id, "removed", "reject_confession");
}

export async function removeConfession(id: string): Promise<ModerationActionResult> {
  return setConfessionState(id, "removed", "remove_confession");
}

export async function approveReply(id: string): Promise<ModerationActionResult> {
  return setReplyState(id, "published", "approve_reply");
}

export async function rejectReply(id: string): Promise<ModerationActionResult> {
  return setReplyState(id, "removed", "reject_reply");
}

export async function removeReply(id: string): Promise<ModerationActionResult> {
  return setReplyState(id, "removed", "remove_reply");
}

async function setReportState(
  id: string,
  state: ReportReviewState,
  auditAction: string,
): Promise<ModerationActionResult> {
  const session = await requireAdminSession();
  if (!session.ok) return session;

  const admin = createAdminClient();
  const { error } = await admin.from("reports").update({ review_state: state }).eq("id", id);
  if (error) return { ok: false, error: "That action couldn't be completed." };

  await recordAuditLog(auditAction, "report", id);
  return { ok: true };
}

export async function resolveReport(id: string): Promise<ModerationActionResult> {
  return setReportState(id, "resolved", "resolve_report");
}

export async function dismissReport(id: string): Promise<ModerationActionResult> {
  return setReportState(id, "dismissed", "dismiss_report");
}

export async function escalateReport(id: string): Promise<ModerationActionResult> {
  return setReportState(id, "escalated", "escalate_report");
}

/**
 * The reports queue's "remove content" shortcut: takes down the reported
 * confession or reply and resolves the report in one step, rather than
 * making a moderator do both separately.
 */
export async function removeReportedContent(
  reportId: string,
  targetType: "confession" | "interaction",
  targetId: string,
): Promise<ModerationActionResult> {
  const removeResult =
    targetType === "confession"
      ? await removeConfession(targetId)
      : await removeReply(targetId);
  if (!removeResult.ok) return removeResult;

  return resolveReport(reportId);
}
