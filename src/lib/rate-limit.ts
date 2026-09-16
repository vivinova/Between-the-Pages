import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface RateLimitConfig {
  action: string;
  limit: number;
  windowMinutes: number;
}

/**
 * A sliding-window rate limiter backed by rate_limit_events. Prunes
 * expired rows for this actor+action before counting, so the table
 * self-cleans rather than growing unbounded.
 *
 * Returns true (and records this attempt) if the actor is still under the
 * limit; false if they've hit it, in which case the caller must not
 * proceed with the action.
 */
export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  actorId: string,
  config: RateLimitConfig,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - config.windowMinutes * 60_000).toISOString();

  await supabase
    .from("rate_limit_events")
    .delete()
    .eq("actor_id", actorId)
    .eq("action", config.action)
    .lt("created_at", windowStart);

  const { count } = await supabase
    .from("rate_limit_events")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", actorId)
    .eq("action", config.action);

  if ((count ?? 0) >= config.limit) {
    return false;
  }

  await supabase.from("rate_limit_events").insert({ actor_id: actorId, action: config.action });
  return true;
}

/**
 * Limits chosen as conservative defaults, not researched thresholds —
 * adjust once real usage data exists.
 */
export const RATE_LIMITS = {
  publishBook: { action: "publish_book", limit: 5, windowMinutes: 60 },
  submitMarginNote: { action: "submit_margin_note", limit: 20, windowMinutes: 60 },
  report: { action: "report", limit: 10, windowMinutes: 60 },
} as const satisfies Record<string, RateLimitConfig>;

export const RATE_LIMIT_MESSAGE =
  "You've done that a few times recently. Please wait a bit before trying again.";
