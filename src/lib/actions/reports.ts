"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reportBookSchema, reportInteractionSchema } from "@/lib/validation/library";

export type ActionResult = { error: string } | { error?: undefined };

const UNIQUE_VIOLATION = "23505";

export async function reportBook(input: unknown): Promise<ActionResult> {
  const parsed = reportBookSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to report a book." };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    book_id: parsed.data.bookId,
    reason: parsed.data.reason,
  });

  if (error && error.code !== UNIQUE_VIOLATION) {
    return { error: "That report couldn't be submitted right now." };
  }

  // A unique-violation here just means this reader already reported this
  // book — treat it as success rather than surfacing a confusing error.
  revalidatePath("/library");
  return {};
}

export async function reportInteraction(input: unknown): Promise<ActionResult> {
  const parsed = reportInteractionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to report a margin note." };
  }

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    interaction_id: parsed.data.interactionId,
    reason: parsed.data.reason,
  });

  if (error && error.code !== UNIQUE_VIOLATION) {
    return { error: "That report couldn't be submitted right now." };
  }

  return {};
}
