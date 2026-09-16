import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BookStatusBadge } from "@/components/publishing/book-status-badge";
import { MarginNoteSettingsForm } from "@/components/publishing/margin-note-settings-form";
import { ApprovedNoteCard } from "@/components/publishing/approved-note-card";

export const metadata: Metadata = { title: "Manage passage" };

export default async function ManagePassagePage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: book } = await supabase
    .from("books")
    .select("id, excerpt_text, moderation_state, allow_margin_notes, notes_visible_to_readers, owner_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!book || book.owner_id !== user?.id) {
    notFound();
  }

  const { data: notes } = await supabase
    .from("interactions")
    .select("id, note_text, is_visible_to_readers")
    .eq("book_id", book.id)
    .eq("type", "margin_note")
    .eq("moderation_state", "published")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/journal/passages" className="text-sm font-medium text-dusk-700 underline">
        Back to your passages
      </Link>

      <div>
        <BookStatusBadge state={book.moderation_state} />
        <p className="mt-2 font-serif text-lg text-wood-900">{book.excerpt_text}</p>
      </div>

      <div>
        <h2 className="font-serif text-lg text-wood-900">Margin note settings</h2>
        <div className="mt-2">
          <MarginNoteSettingsForm
            bookId={book.id}
            initialAllowMarginNotes={book.allow_margin_notes}
            initialNotesVisibleToReaders={book.notes_visible_to_readers}
          />
        </div>
      </div>

      <div>
        <h2 className="font-serif text-lg text-wood-900">Approved margin notes</h2>
        {notes && notes.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {notes.map((note) => (
              <ApprovedNoteCard
                key={note.id}
                id={note.id}
                text={note.note_text ?? ""}
                initiallyVisible={note.is_visible_to_readers}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-wood-600">No approved margin notes yet.</p>
        )}
      </div>
    </div>
  );
}
