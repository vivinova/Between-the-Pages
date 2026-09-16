import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { BookQueueItem } from "@/components/admin/book-queue-item";

export const metadata: Metadata = { title: "Books awaiting review" };

export default async function AdminBooksPage() {
  const supabase = createAdminClient();
  const [{ data: books }, { data: shelves }] = await Promise.all([
    supabase
      .from("books")
      .select("id, excerpt_text, shelf_id, labels, moderation_reasons, created_at")
      .eq("moderation_state", "pending_review")
      .order("created_at", { ascending: true }),
    supabase.from("shelves").select("id, name"),
  ]);
  const shelfNameById = new Map((shelves ?? []).map((shelf) => [shelf.id, shelf.name]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl text-cream-100">Books awaiting review</h1>
      {books && books.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {books.map((book) => (
            <BookQueueItem
              key={book.id}
              id={book.id}
              excerptText={book.excerpt_text}
              shelfName={shelfNameById.get(book.shelf_id)}
              labels={book.labels}
              moderationReasons={book.moderation_reasons}
              createdAt={book.created_at}
            />
          ))}
        </ul>
      ) : (
        <p className="text-cream-200">Nothing waiting for review.</p>
      )}
    </div>
  );
}
