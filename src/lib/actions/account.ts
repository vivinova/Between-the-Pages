"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionResult = { error: string } | { error?: undefined };

/**
 * Deletes the signed-in user's account. auth.users is the root of the FK
 * chain (profiles.id references it, and everything else cascades from
 * profiles via ON DELETE CASCADE — journal_entries, books, bookmarks,
 * interactions, reports, notifications, rate_limit_events), so deleting
 * this one row is sufficient; audit_log.actor_id is ON DELETE SET NULL,
 * preserving the moderation history without keeping a live reference to
 * the deleted account. Requires the admin client — a user can never
 * delete their own auth.users row from their own session.
 */
export async function deleteAccount(): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in required." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { error: "Your account couldn't be deleted right now. Please try again." };
  }

  await supabase.auth.signOut();
  redirect("/");
}
