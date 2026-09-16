import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const [entries, books, bookmarks, interactions] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("id, title, body, created_at, updated_at")
      .order("created_at"),
    supabase
      .from("books")
      .select("id, excerpt_text, shelf_id, labels, moderation_state, created_at, published_at")
      .eq("owner_id", user.id),
    supabase.from("bookmarks").select("book_id, created_at"),
    supabase
      .from("interactions")
      .select("id, book_id, type, note_text, moderation_state, created_at")
      .eq("reader_id", user.id),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, createdAt: user.created_at },
    journalEntries: entries.data ?? [],
    publishedBooks: books.data ?? [],
    bookmarks: bookmarks.data ?? [],
    interactions: interactions.data ?? [],
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="between-the-pages-export.json"`,
    },
  });
}
