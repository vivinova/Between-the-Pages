import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role client. Bypasses Row Level Security entirely.
 *
 * Server-only (enforced by the `server-only` import above, which fails the
 * build if this module is ever pulled into a client bundle). Use only for
 * moderation/admin server actions that have already checked the caller's
 * role — never call this on behalf of an unauthenticated or unauthorized
 * request.
 */
export function createAdminClient() {
  return createClient<Database>(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
