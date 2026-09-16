"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/admin/require-role";
import { recordAuditLog } from "@/lib/admin/audit-log";
import { createPromptSchema, createShelfSchema, updateShelfSchema } from "@/lib/validation/admin";

export type ActionResult = { error: string } | { error?: undefined };

// Shelves and prompts are site-wide configuration, not individual content
// decisions — restricted to 'admin' rather than 'moderator'.

export async function createShelf(input: unknown): Promise<ActionResult> {
  const parsed = createShelfSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const role = await requireRole(["admin"]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shelves")
    .insert({
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "That shelf couldn't be created — check the slug is unique." };

  await recordAuditLog(role.userId, "create", "shelf", data.id, parsed.data);
  revalidatePath("/admin/shelves");
  return {};
}

export async function updateShelf(id: string, input: unknown): Promise<ActionResult> {
  const parsed = updateShelfSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const role = await requireRole(["admin"]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("shelves")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      is_hidden: parsed.data.isHidden,
    })
    .eq("id", id);
  if (error) return { error: "That shelf couldn't be updated right now." };

  await recordAuditLog(role.userId, "update", "shelf", id, parsed.data);
  revalidatePath("/admin/shelves");
  revalidatePath("/library");
  return {};
}

export async function createPrompt(input: unknown): Promise<ActionResult> {
  const parsed = createPromptSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const role = await requireRole(["admin"]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("prompts")
    .insert({ prompt_text: parsed.data.promptText, theme: parsed.data.theme ?? null, status: "active" })
    .select("id")
    .single();
  if (error || !data) return { error: "That prompt couldn't be created right now." };

  await recordAuditLog(role.userId, "create", "prompt", data.id, parsed.data);
  revalidatePath("/admin/prompts");
  return {};
}

export async function setPromptStatus(
  id: string,
  status: "draft" | "active" | "archived",
): Promise<ActionResult> {
  const role = await requireRole(["admin"]);
  if (!role.ok) return { error: role.error };

  const admin = createAdminClient();
  const { error } = await admin.from("prompts").update({ status }).eq("id", id);
  if (error) return { error: "That prompt couldn't be updated right now." };

  await recordAuditLog(role.userId, "update", "prompt", id, { status });
  revalidatePath("/admin/prompts");
  revalidatePath("/today");
  return {};
}
