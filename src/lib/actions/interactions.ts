"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getModerationProvider } from "@/lib/moderation";
import { checkRateLimit, RATE_LIMITS, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { getFingerprintHash } from "@/lib/fingerprint";
import {
  toggleReactionSchema,
  submitReplySchema,
  type ReactionType,
} from "@/lib/validation/interactions";

export type ToggleReactionResult = { ok: true; active: boolean } | { ok: false; error: string };
export type SubmitReplyResult =
  | { ok: true; id: string; state: "published" | "pending_review" }
  | { ok: false; error: string };

/**
 * Reactions carry no text, so there's nothing for the moderation provider
 * to check — the only interesting question is dedup, which (like rate
 * limiting) needs a trusted, server-computed identity rather than
 * anything the client could assert. So this goes straight through the
 * admin client end to end: read whether this fingerprint already reacted,
 * then insert or delete accordingly. The unique index on (confession_id,
 * type, fingerprint_hash) is a second backstop against a race inserting a
 * duplicate.
 */
export async function toggleReaction(input: unknown): Promise<ToggleReactionResult> {
  const parsed = toggleReactionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const fingerprint = getFingerprintHash();
  if (!(await checkRateLimit(fingerprint, RATE_LIMITS.react))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("interactions")
    .select("id")
    .eq("confession_id", parsed.data.confessionId)
    .eq("type", parsed.data.type)
    .eq("fingerprint_hash", fingerprint)
    .maybeSingle();

  if (existing) {
    const { error } = await admin.from("interactions").delete().eq("id", existing.id);
    if (error) return { ok: false, error: "Couldn't undo that. Please try again." };
    return { ok: true, active: false };
  }

  const { error } = await admin.from("interactions").insert({
    confession_id: parsed.data.confessionId,
    type: parsed.data.type,
    moderation_state: "published",
    fingerprint_hash: fingerprint,
  });
  if (error) return { ok: false, error: "Couldn't record that. Please try again." };
  return { ok: true, active: true };
}

export async function getReactionCounts(
  confessionId: string,
): Promise<Record<ReactionType, number>> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("interactions")
    .select("type")
    .eq("confession_id", confessionId)
    .in("type", ["me_too", "sending_love"]);

  const counts: Record<ReactionType, number> = { me_too: 0, sending_love: 0 };
  for (const row of data ?? []) {
    counts[row.type as ReactionType] += 1;
  }
  return counts;
}

export async function getMyActiveReactions(confessionId: string): Promise<ReactionType[]> {
  const fingerprint = getFingerprintHash();
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("interactions")
    .select("type")
    .eq("confession_id", confessionId)
    .eq("fingerprint_hash", fingerprint)
    .in("type", ["me_too", "sending_love"]);

  return (data ?? []).map((row) => row.type as ReactionType);
}

/**
 * Replies carry free text, so — same as confessions — this uses the
 * two-step pattern: insert as pending_review via the RLS-scoped client
 * (the interactions_enforce_insert trigger rejects any other state for a
 * reply), then a second update to published via the admin client only
 * when the moderation check didn't require human review.
 */
export async function submitReply(input: unknown): Promise<SubmitReplyResult> {
  const parsed = submitReplySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const fingerprint = getFingerprintHash();
  if (!(await checkRateLimit(fingerprint, RATE_LIMITS.submitReply))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }

  const provider = getModerationProvider();
  const result = await provider.checkContent(parsed.data.bodyText, "reply");

  const supabase = createServerSupabaseClient();
  const { data: reply, error } = await supabase
    .from("interactions")
    .insert({
      confession_id: parsed.data.confessionId,
      type: "reply",
      body_text: parsed.data.bodyText,
      moderation_state: "pending_review",
      moderation_reasons: result.reasons,
      fingerprint_hash: fingerprint,
    })
    .select("id")
    .single();

  if (error || !reply) {
    return { ok: false, error: "Your reply couldn't be submitted. Please try again." };
  }

  let finalState: "published" | "pending_review" = "pending_review";
  if (!result.requiresHumanReview) {
    const admin = createAdminClient();
    const { error: publishError } = await admin
      .from("interactions")
      .update({ moderation_state: "published" })
      .eq("id", reply.id);
    if (!publishError) {
      finalState = "published";
    }
  }

  return { ok: true, id: reply.id, state: finalState };
}
