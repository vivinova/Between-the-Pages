"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { getFingerprintHash } from "@/lib/fingerprint";
import { reportSchema } from "@/lib/validation/interactions";

export type ReportResult = { ok: true } | { ok: false; error: string };

export async function reportContent(input: unknown): Promise<ReportResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." };
  }

  const fingerprint = getFingerprintHash();
  if (!(await checkRateLimit(fingerprint, RATE_LIMITS.report))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("reports").insert({
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
    reporter_fingerprint_hash: fingerprint,
  });

  if (error) {
    // Unique violation (target_type, target_id, reporter_fingerprint_hash)
    // means this same visitor already reported this — not an error worth
    // surfacing as one.
    if (error.code === "23505") {
      return { ok: true };
    }
    return { ok: false, error: "Couldn't submit your report. Please try again." };
  }

  return { ok: true };
}
