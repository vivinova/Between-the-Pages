"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { error?: undefined };

export async function markNotificationRead(id: string): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to manage notifications." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", user.id);

  if (error) return { error: "That couldn't be updated right now." };
  revalidatePath("/inbox");
  return {};
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to manage notifications." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);

  if (error) return { error: "That couldn't be updated right now." };
  revalidatePath("/inbox");
  return {};
}

export async function dismissNotification(id: string): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to manage notifications." };

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("recipient_id", user.id);

  if (error) return { error: "That couldn't be removed right now." };
  revalidatePath("/inbox");
  return {};
}

export async function updateNotificationCategoryEnabled(
  category: "needed_this" | "pressed_flower" | "margin_note",
  enabled: boolean,
): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to manage notification preferences." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_settings")
    .eq("id", user.id)
    .maybeSingle();

  const settings = {
    ...((profile?.notification_settings as Record<string, unknown>) ?? {}),
    [category]: enabled,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ notification_settings: settings })
    .eq("id", user.id);

  if (error) return { error: "That couldn't be saved right now." };
  revalidatePath("/inbox");
  return {};
}
