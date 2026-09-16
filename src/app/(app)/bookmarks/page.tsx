import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RemoveBookmarkButton } from "@/components/library/remove-bookmark-button";

export const metadata: Metadata = { title: "Bookmarks" };

export default async function BookmarksPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("book_id, created_at")
    .eq("reader_id", user.id)
    .order("created_at", { ascending: false });

  const bookIds = (bookmarks ?? []).map((b) => b.book_id);

  const { data: books } = bookIds.length
    ? await supabase
        .from("books")
        .select("id, excerpt_text, shelf_id")
        .in("id", bookIds)
        .eq("moderation_state", "published")
    : { data: [] };

  const publishedIds = new Set((books ?? []).map((b) => b.id));
  const staleIds = bookIds.filter((id) => !publishedIds.has(id));
  if (staleIds.length > 0) {
    await supabase.from("bookmarks").delete().eq("reader_id", user.id).in("book_id", staleIds);
  }

  const { data: shelves } = await supabase.from("shelves").select("id, name");
  const shelfNameById = new Map((shelves ?? []).map((shelf) => [shelf.id, shelf.name]));

  const orderedBooks = (bookmarks ?? [])
    .map((bookmark) => (books ?? []).find((b) => b.id === bookmark.book_id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-wood-900">Bookmarks</h1>
        <p className="mt-1 text-wood-600">
          Books you&apos;ve privately saved. No one else can see this list.
        </p>
      </div>

      {orderedBooks.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {orderedBooks.map((book) => (
            <li
              key={book.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-wood-400/30 bg-cream-50 p-4"
            >
              <Link href={`/library/books/${book.id}`} className="min-w-0 flex-1">
                <p className="line-clamp-2 font-serif text-wood-900">{book.excerpt_text}</p>
                <p className="mt-1 text-sm text-wood-500">{shelfNameById.get(book.shelf_id)}</p>
              </Link>
              <RemoveBookmarkButton bookId={book.id} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-wood-600">
          Nothing saved yet.{" "}
          <Link href="/library" className="font-medium text-dusk-700 underline">
            Explore the library
          </Link>{" "}
          to find something worth keeping.
        </p>
      )}
    </div>
  );
}
