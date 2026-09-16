import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CONTENT_LABELS } from "@/lib/content-labels";
import { ContentWarningGate } from "@/components/library/content-warning-gate";
import { BookmarkButton } from "@/components/library/bookmark-button";
import { ReportButton } from "@/components/library/report-button";
import { ReadAnotherButton } from "@/components/library/read-another-button";
import { NeededThisButton } from "@/components/library/needed-this-button";
import { PressedFlowerButton } from "@/components/library/pressed-flower-button";
import { MarginNotesSection } from "@/components/library/margin-notes-section";
import type { InteractionModerationState } from "@/lib/supabase/types";

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

  const [{ data: shelf }, bookmarkCheck, reportCheck, ownInteractions, reportedInteractionIds] =
    await Promise.all([
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
      user
        ? supabase
            .from("interactions")
            .select("id, type, note_text, moderation_state")
            .eq("book_id", book.id)
            .eq("reader_id", user.id)
        : Promise.resolve({
            data: [] as {
              id: string;
              type: string;
              note_text: string | null;
              moderation_state: InteractionModerationState;
            }[],
          }),
      user
        ? supabase.from("reports").select("interaction_id").eq("reporter_id", user.id)
        : Promise.resolve({ data: [] as { interaction_id: string | null }[] }),
    ]);

  // Internal ranking signal only — this value is never read back or shown.
  await supabase.rpc("increment_book_view_count", { target_book_id: book.id });

  const labelNames = book.labels.map(
    (label) => CONTENT_LABELS.find((c) => c.value === label)?.name ?? label,
  );

  const ownedTypes = new Set((ownInteractions.data ?? []).map((i) => i.type));
  const ownMarginNoteRow = (ownInteractions.data ?? []).find((i) => i.type === "margin_note");

  const reportedIds = new Set(
    (reportedInteractionIds.data ?? [])
      .map((r) => r.interaction_id)
      .filter((id): id is string => id !== null),
  );

  let visibleNotesQuery = supabase
    .from("interactions")
    .select("id, note_text")
    .eq("book_id", book.id)
    .eq("type", "margin_note")
    .eq("moderation_state", "published")
    .eq("is_visible_to_readers", true);
  if (user) {
    visibleNotesQuery = visibleNotesQuery.neq("reader_id", user.id);
  }
  const { data: visibleNotesRaw } = await visibleNotesQuery;
  const visibleNotes = (visibleNotesRaw ?? [])
    .filter((note) => !reportedIds.has(note.id))
    .map((note) => ({ id: note.id, note_text: note.note_text ?? "" }));

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
        <NeededThisButton
          bookId={book.id}
          initiallyActive={ownedTypes.has("needed_this")}
          signedIn={Boolean(user)}
        />
        <PressedFlowerButton
          bookId={book.id}
          initiallyActive={ownedTypes.has("pressed_flower")}
          signedIn={Boolean(user)}
        />
      </div>

      <MarginNotesSection
        bookId={book.id}
        allowMarginNotes={book.allow_margin_notes}
        signedIn={Boolean(user)}
        visibleNotes={visibleNotes}
        ownNote={
          ownMarginNoteRow
            ? {
                id: ownMarginNoteRow.id,
                note_text: ownMarginNoteRow.note_text ?? "",
                moderation_state: ownMarginNoteRow.moderation_state,
              }
            : null
        }
      />

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
