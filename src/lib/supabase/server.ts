import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Anon-key client for use in Server Components, route handlers, and server
 * actions. Subject to RLS as the `anon` role — there is no user session to
 * scope by (this app has no accounts), so RLS row-visibility rules
 * (moderation_state = 'published', etc.) are the only gate.
 */
export function createServerSupabaseClient() {
  return createClient<Database>(env.supabaseUrl(), env.supabaseAnonKey(), {
    auth: { persistSession: false },
  });
}
