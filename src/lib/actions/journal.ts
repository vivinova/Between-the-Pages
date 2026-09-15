"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { journalEntrySchema } from "@/lib/validation/journal";

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };
export type ActionResult = { error: string } | { error?: undefined };

export async function createJournalEntry(input: unknown): Promise<SaveResult> {
  const parsed = journalEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "You need to sign in to write in your journal." };
  }

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      owner_id: user.id,
      title: parsed.data.title || null,
      body: parsed.data.body,
      prompt_id: parsed.data.promptId ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "Your entry couldn't be saved. Please try again." };
  }

  revalidatePath("/journal");
  revalidatePath("/today");
  return { ok: true, id: data.id };
}

export async function updateJournalEntry(id: string, input: unknown): Promise<ActionResult> {
  const parsed = journalEntrySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("journal_entries")
    .update({
      title: parsed.data.title || null,
      body: parsed.data.body,
    })
    .eq("id", id);

  if (error) {
    return { error: "Your entry couldn't be saved. Please try again." };
  }

  revalidatePath("/journal");
  revalidatePath(`/journal/${id}`);
  return {};
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from("journal_entries").delete().eq("id", id);

  revalidatePath("/journal");
  revalidatePath("/today");
  redirect("/journal");
}
