import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BookStatusBadge } from "@/components/publishing/book-status-badge";
import { BookActions } from "@/components/publishing/book-actions";

export const metadata: Metadata = { title: "Your passages" };

export default async function PassagesPage() {
  const supabase = createServerSupabaseClient();
  const [{ data: books }, { data: shelves }] = await Promise.all([
    supabase
      .from("books")
      .select("id, excerpt_text, moderation_state, created_at, shelf_id")
      .order("created_at", { ascending: false }),
    supabase.from("shelves").select("id, name"),
  ]);
  const shelfNameById = new Map((shelves ?? []).map((shelf) => [shelf.id, shelf.name]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl text-wood-900">Your passages</h1>
        <p className="mt-1 text-wood-600">
          What you&apos;ve left in the library, and its current status. Removing a
          passage here never touches the private journal entry it came from.
        </p>
      </div>

      {books && books.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {books.map((book) => (
            <li
              key={book.id}
              className="rounded-md border border-wood-400/30 bg-cream-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <BookStatusBadge state={book.moderation_state} />
                <span className="text-sm text-wood-500">
                  {new Date(book.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 font-serif text-wood-900">{book.excerpt_text}</p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-sm text-wood-500">
                  {shelfNameById.get(book.shelf_id)}
                </span>
                <div className="flex items-center gap-3">
                  {book.moderation_state === "published" ? (
                    <Link
                      href={`/journal/passages/${book.id}`}
                      className="text-sm font-medium text-dusk-700 underline"
                    >
                      Manage margin notes
                    </Link>
                  ) : null}
                  <BookActions id={book.id} state={book.moderation_state} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-wood-600">
          You haven&apos;t left anything in the library yet.{" "}
          <Link href="/journal" className="font-medium text-dusk-700 underline">
            Go to your journal
          </Link>{" "}
          to start one.
        </p>
      )}
    </div>
  );
}
