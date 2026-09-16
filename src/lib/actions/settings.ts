"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ContentLabel } from "@/lib/supabase/types";

export type ActionResult = { error: string } | { error?: undefined };

export async function updateBlockedLabels(labels: ContentLabel[]): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to change settings." };

  const { error } = await supabase
    .from("profiles")
    .update({ blocked_labels: labels })
    .eq("id", user.id);
  if (error) return { error: "That couldn't be saved right now." };

  revalidatePath("/settings");
  revalidatePath("/library");
  return {};
}

export async function updateReducedMotion(enabled: boolean): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to change settings." };

  const { error } = await supabase
    .from("profiles")
    .update({ reduced_motion: enabled })
    .eq("id", user.id);
  if (error) return { error: "That couldn't be saved right now." };

  revalidatePath("/", "layout");
  return {};
}

export async function updateMarginNoteDefaults(input: {
  defaultAllowMarginNotes: boolean;
  defaultNotesVisibleToReaders: boolean;
}): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to change settings." };

  const { error } = await supabase
    .from("profiles")
    .update({
      default_allow_margin_notes: input.defaultAllowMarginNotes,
      default_notes_visible_to_readers:
        input.defaultAllowMarginNotes && input.defaultNotesVisibleToReaders,
    })
    .eq("id", user.id);
  if (error) return { error: "That couldn't be saved right now." };

  revalidatePath("/settings");
  return {};
}
