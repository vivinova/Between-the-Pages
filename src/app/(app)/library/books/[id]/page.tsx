import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CONTENT_LABELS } from "@/lib/content-labels";
import { ContentWarningGate } from "@/components/library/content-warning-gate";
import { BookmarkButton } from "@/components/library/bookmark-button";
import { ReportButton } from "@/components/library/report-button";
import { ReadAnotherButton } from "@/components/library/read-another-button";

export const metadata: Metadata = { title: "A passage" };

export default async function BookDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string; shelf?: string };
}) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: book } = await supabase
    .from("books")
    .select("id, excerpt_text, shelf_id, labels, allow_margin_notes")
    .eq("id", params.id)
    .eq("moderation_state", "published")
    .maybeSingle();

  if (!book) {
    notFound();
  }

  const [{ data: shelf }, bookmarkCheck, reportCheck] = await Promise.all([
    supabase.from("shelves").select("id, name, slug").eq("id", book.shelf_id).maybeSingle(),
    user
      ? supabase
          .from("bookmarks")
          .select("book_id")
          .eq("reader_id", user.id)
          .eq("book_id", book.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("reports")
          .select("id")
          .eq("reporter_id", user.id)
          .eq("book_id", book.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Internal ranking signal only — this value is never read back or shown.
  await supabase.rpc("increment_book_view_count", { target_book_id: book.id });

  const labelNames = book.labels.map(
    (label) => CONTENT_LABELS.find((c) => c.value === label)?.name ?? label,
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium uppercase tracking-wide text-forest-700">
          {shelf?.name}
        </span>
        <Link href="/library" className="text-sm font-medium text-dusk-700 underline">
          Back to the library
        </Link>
      </div>

      <ContentWarningGate labelNames={labelNames}>
        <div className="rounded-lg border border-wood-400/30 bg-cream-50 p-8 font-serif text-xl leading-relaxed text-wood-900 shadow-sm">
          {book.excerpt_text}
        </div>
        {labelNames.length > 0 ? (
          <p className="mt-2 text-sm text-wood-500">Labeled: {labelNames.join(", ")}</p>
        ) : null}
      </ContentWarningGate>

      <div className="flex flex-wrap items-center gap-3">
        <BookmarkButton
          bookId={book.id}
          initiallyBookmarked={Boolean(bookmarkCheck.data)}
          signedIn={Boolean(user)}
        />
      </div>

      <div className="rounded-md border border-wood-400/20 bg-wood-400/5 p-4 text-sm text-wood-600">
        Gentle responses like &ldquo;I needed this&rdquo; and pressed flowers are coming
        in Phase 5.
        {book.allow_margin_notes ? " This contributor is open to margin notes once that arrives." : ""}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportButton
          bookId={book.id}
          alreadyReported={Boolean(reportCheck.data)}
          signedIn={Boolean(user)}
        />
        {searchParams.from === "shelf" && searchParams.shelf ? (
          <ReadAnotherButton
            label="Read another from this shelf"
            currentBookId={book.id}
            shelfId={searchParams.shelf}
            navigateQuery={`from=shelf&shelf=${searchParams.shelf}`}
          />
        ) : searchParams.from === "find" ? (
          <ReadAnotherButton
            label="Find another"
            currentBookId={book.id}
            shelfId={searchParams.shelf}
            excludeOwn
            navigateQuery={searchParams.shelf ? `from=find&shelf=${searchParams.shelf}` : "from=find"}
          />
        ) : shelf ? (
          <Link href={`/library/shelves/${shelf.slug}`} className="text-sm font-medium text-dusk-700 underline">
            Explore this shelf
          </Link>
        ) : null}
      </div>
    </div>
  );
}
