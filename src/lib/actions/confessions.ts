"use server";

import { randomUUID, createHash } from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getModerationProvider } from "@/lib/moderation";
import { checkRateLimit, RATE_LIMITS, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { getFingerprintHash } from "@/lib/fingerprint";
import { submitConfessionSchema, deleteConfessionSchema } from "@/lib/validation/confessions";

export type SubmitConfessionResult =
  | { ok: true; id: string; state: "published" | "pending_review"; ownerToken: string }
  | { ok: false; error: string };

export type DeleteConfessionResult = { ok: true } | { ok: false; error: string };

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function submitConfession(input: unknown): Promise<SubmitConfessionResult> {
  const parsed = submitConfessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const fingerprint = getFingerprintHash();
  if (!(await checkRateLimit(fingerprint, RATE_LIMITS.submitConfession))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }

  const provider = getModerationProvider();
  const result = await provider.checkContent(data.bodyText, "confession");

  const ownerToken = randomUUID();

  const supabase = createServerSupabaseClient();
  // The caller's own session may only ever insert a confession as
  // pending_review — enforced by RLS (0001_confessions.sql), not just by
  // convention here. Auto-publishing a low-risk submission is a second
  // step below, done with the admin client, since that's the only
  // credential ever allowed to set moderation_state to 'published'.
  const { data: confession, error } = await supabase
    .from("confessions")
    .insert({
      category_id: data.categoryId,
      body_text: data.bodyText,
      moderation_state: "pending_review",
      moderation_reasons: result.reasons,
      contact_email: data.emailOptIn ? data.contactEmail : null,
      email_opt_in: data.emailOptIn,
      owner_token_hash: hashToken(ownerToken),
    })
    .select("id")
    .single();

  if (error || !confession) {
    return { ok: false, error: "Your confession couldn't be submitted. Please try again." };
  }

  let finalState: "published" | "pending_review" = "pending_review";
  if (!result.requiresHumanReview) {
    const admin = createAdminClient();
    const { error: publishError } = await admin
      .from("confessions")
      .update({ moderation_state: "published", published_at: new Date().toISOString() })
      .eq("id", confession.id);
    if (!publishError) {
      finalState = "published";
    }
  }

  return { ok: true, id: confession.id, state: finalState, ownerToken };
}

/**
 * Deletes a confession without an account — the owner token (shown once at
 * submission, never stored anywhere but the client's own localStorage) is
 * the only credential. Verified here by re-hashing and comparing server-
 * side, then the actual delete goes through the admin client since anon
 * has no delete policy on confessions at all.
 */
export async function deleteMyConfession(input: unknown): Promise<DeleteConfessionResult> {
  const parsed = deleteConfessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const admin = createAdminClient();
  const { data: confession } = await admin
    .from("confessions")
    .select("id, owner_token_hash")
    .eq("id", parsed.data.confessionId)
    .maybeSingle();

  if (!confession || confession.owner_token_hash !== hashToken(parsed.data.ownerToken)) {
    return { ok: false, error: "That delete link isn't valid." };
  }

  const { error } = await admin.from("confessions").delete().eq("id", confession.id);
  if (error) {
    return { ok: false, error: "Couldn't delete your confession. Please try again." };
  }

  return { ok: true };
}
