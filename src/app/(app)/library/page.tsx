import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getReaderExclusions } from "@/lib/library";
import { LinkButton } from "@/components/ui/link-button";

export const metadata: Metadata = { title: "Library" };

const RECENT_LIMIT = 6;

export default async function LibraryPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: shelves, error: shelvesError }, { blockedLabels, reportedBookIds }] =
    await Promise.all([
      supabase.from("shelves").select("id, slug, name").eq("is_hidden", false).order("sort_order"),
      getReaderExclusions(supabase, user?.id ?? null),
    ]);

  let recentQuery = supabase
    .from("books")
    .select("id, excerpt_text, shelf_id")
    .eq("moderation_state", "published")
    .order("published_at", { ascending: false })
    .limit(RECENT_LIMIT);

  if (blockedLabels.length > 0) {
    recentQuery = recentQuery.not("labels", "ov", `{${blockedLabels.join(",")}}`);
  }
  if (reportedBookIds.length > 0) {
    recentQuery = recentQuery.not("id", "in", `(${reportedBookIds.join(",")})`);
  }

  const { data: recentBooks, error: recentError } = await recentQuery;
  const shelfNameById = new Map((shelves ?? []).map((shelf) => [shelf.id, shelf.name]));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-3xl text-wood-900">The Library</h1>
        <p className="max-w-2xl text-wood-600">
          Passages left anonymously by people who chose to share one page of what they
          were carrying. Open a shelf that matches how you feel, or let the library find
          something for you. Nothing here is ranked, and nothing keeps a public score.
        </p>
        <div>
          <LinkButton href="/library/find" variant="primary">
            Find me something
          </LinkButton>
        </div>
      </div>

      <div>
        <h2 className="font-serif text-xl text-wood-900">Shelves</h2>
        {shelvesError ? (
          <p role="alert" className="mt-3 text-burgundy-600">
            Shelves couldn&apos;t be loaded right now.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(shelves ?? []).map((shelf) => (
              <li key={shelf.id}>
                <Link
                  href={`/library/shelves/${shelf.slug}`}
                  className="block rounded-md border border-wood-400/30 bg-cream-50 px-4 py-3 font-serif text-wood-900 hover:bg-cream-200"
                >
                  {shelf.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="font-serif text-xl text-wood-900">Recently added</h2>
        {recentError ? (
          <p role="alert" className="mt-3 text-burgundy-600">
            Recent passages couldn&apos;t be loaded right now.
          </p>
        ) : recentBooks && recentBooks.length > 0 ? (
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recentBooks.map((book) => (
              <li key={book.id}>
                <Link
                  href={`/library/books/${book.id}`}
                  className="block rounded-md border border-wood-400/30 bg-cream-50 p-4 hover:bg-cream-200"
                >
                  <p className="line-clamp-3 font-serif text-wood-900">{book.excerpt_text}</p>
                  <p className="mt-2 text-sm text-wood-500">
                    {shelfNameById.get(book.shelf_id)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-wood-600">
            Nothing&apos;s been left here yet — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
