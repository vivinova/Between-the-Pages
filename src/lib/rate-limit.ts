import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitConfig {
  action: string;
  limit: number;
  windowMinutes: number;
}

/**
 * A sliding-window rate limiter backed by rate_limit_events, keyed by an
 * anonymous fingerprint hash (see src/lib/fingerprint.ts) rather than a
 * user id — there are no accounts. rate_limit_events has no RLS policy for
 * anon/authenticated (see the migration), so unlike the request-scoped
 * client this app used when it had per-user auth, this always goes
 * through the admin client — there's no auth.uid() for RLS to scope
 * "own rows" by anymore, so the application code (this function) is the
 * only thing enforcing that a key only ever counts its own events, and it
 * does that correctly by construction (every query below is filtered by
 * the caller-supplied key).
 *
 * Prunes expired rows for this key+action before counting, so the table
 * self-cleans rather than growing unbounded.
 *
 * Returns true (and records this attempt) if still under the limit; false
 * if the limit's been hit, in which case the caller must not proceed.
 */
export async function checkRateLimit(key: string, config: RateLimitConfig): Promise<boolean> {
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - config.windowMinutes * 60_000).toISOString();

  await admin
    .from("rate_limit_events")
    .delete()
    .eq("key", key)
    .eq("action", config.action)
    .lt("created_at", windowStart);

  const { count } = await admin
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .eq("action", config.action);

  if ((count ?? 0) >= config.limit) {
    return false;
  }

  await admin.from("rate_limit_events").insert({ key, action: config.action });
  return true;
}

/**
 * Limits chosen as conservative defaults, not researched thresholds —
 * adjust once real usage data exists.
 */
export const RATE_LIMITS = {
  submitConfession: { action: "submit_confession", limit: 5, windowMinutes: 60 },
  submitReply: { action: "submit_reply", limit: 20, windowMinutes: 60 },
  react: { action: "react", limit: 60, windowMinutes: 60 },
  report: { action: "report", limit: 10, windowMinutes: 60 },
} as const satisfies Record<string, RateLimitConfig>;

export const RATE_LIMIT_MESSAGE =
  "You've done that a few times recently. Please wait a bit before trying again.";
