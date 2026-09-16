"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notifications";
import type { InteractionType, NotificationType } from "@/lib/supabase/types";

export type ActionResult = { error: string } | { error?: undefined };

async function addSimpleInteraction(
  bookId: string,
  type: Extract<InteractionType, "needed_this" | "pressed_flower">,
  notificationType: Extract<NotificationType, "needed_this" | "pressed_flower">,
): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to respond to a book." };
  }

  const { data: book } = await supabase
    .from("books")
    .select("owner_id")
    .eq("id", bookId)
    .eq("moderation_state", "published")
    .maybeSingle();
  if (!book) {
    return { error: "That book couldn't be found." };
  }

  const { error } = await supabase
    .from("interactions")
    .insert({ book_id: bookId, reader_id: user.id, type, moderation_state: "published" });

  if (error) {
    // A unique-violation just means they've already done this — fine.
    if (error.code !== "23505") {
      return { error: "That couldn't be recorded right now." };
    }
  } else if (book.owner_id !== user.id) {
    await notify({ recipientId: book.owner_id, type: notificationType, bookId });
  }

  revalidatePath(`/library/books/${bookId}`);
  return {};
}

async function removeSimpleInteraction(
  bookId: string,
  type: Extract<InteractionType, "needed_this" | "pressed_flower">,
): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to manage your responses." };
  }

  const { error } = await supabase
    .from("interactions")
    .delete()
    .eq("book_id", bookId)
    .eq("reader_id", user.id)
    .eq("type", type);

  if (error) {
    return { error: "That couldn't be undone right now." };
  }

  revalidatePath(`/library/books/${bookId}`);
  return {};
}

export async function addNeededThis(bookId: string): Promise<ActionResult> {
  return addSimpleInteraction(bookId, "needed_this", "needed_this");
}

export async function removeNeededThis(bookId: string): Promise<ActionResult> {
  return removeSimpleInteraction(bookId, "needed_this");
}

export async function addPressedFlower(bookId: string): Promise<ActionResult> {
  return addSimpleInteraction(bookId, "pressed_flower", "pressed_flower");
}

export async function removePressedFlower(bookId: string): Promise<ActionResult> {
  return removeSimpleInteraction(bookId, "pressed_flower");
}
