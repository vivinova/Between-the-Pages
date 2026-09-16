import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";

export type RoleCheckResult = { ok: true; userId: string } | { ok: false; error: string };

/**
 * Verifies the CALLER's own role, server-side, using their own session
 * (profiles RLS already lets anyone read their own row). This is the real
 * authorization boundary for every admin server action — the /admin route
 * group's page-level redirect is a UI convenience, not a security control,
 * since a Server Action is just a POST endpoint any signed-in user's
 * browser could call directly regardless of which page rendered the button
 * that calls it. Every admin action must call this before doing anything
 * with the admin (service-role) client.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<RoleCheckResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !allowedRoles.includes(profile.role)) {
    return { ok: false, error: "You don't have permission to do that." };
  }

  return { ok: true, userId: user.id };
}
