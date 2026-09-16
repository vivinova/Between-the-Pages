"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ActionResult = { error: string } | { error?: undefined };

export async function addBookmark(bookId: string): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to bookmark a book." };
  }

  const { error } = await supabase
    .from("bookmarks")
    .upsert({ reader_id: user.id, book_id: bookId }, { onConflict: "reader_id,book_id" });

  if (error) {
    return { error: "That couldn't be bookmarked right now." };
  }

  revalidatePath("/bookmarks");
  return {};
}

export async function removeBookmark(bookId: string): Promise<ActionResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sign in to manage bookmarks." };
  }

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("reader_id", user.id)
    .eq("book_id", bookId);

  if (error) {
    return { error: "That couldn't be removed right now." };
  }

  revalidatePath("/bookmarks");
  return {};
}
