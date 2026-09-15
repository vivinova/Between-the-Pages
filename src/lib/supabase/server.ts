import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Auth-scoped client for use in server components, route handlers, and
 * server actions. Runs as the requesting user — subject to RLS.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component without a mutable cookie jar.
          // Safe to ignore when middleware is refreshing sessions.
        }
      },
    },
  });
}
