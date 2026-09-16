import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { NoteQueueItem } from "@/components/admin/note-queue-item";

export const metadata: Metadata = { title: "Margin notes awaiting review" };

export default async function AdminNotesPage() {
  const supabase = createAdminClient();
  const { data: notes } = await supabase
    .from("interactions")
    .select("id, note_text, moderation_reasons, created_at, book_id")
    .eq("type", "margin_note")
    .eq("moderation_state", "pending_review")
    .order("created_at", { ascending: true });

  const bookIds = [...new Set((notes ?? []).map((n) => n.book_id))];
  const { data: books } = bookIds.length
    ? await supabase.from("books").select("id, excerpt_text").in("id", bookIds)
    : { data: [] };
  const excerptById = new Map((books ?? []).map((b) => [b.id, b.excerpt_text]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl text-cream-100">Margin notes awaiting review</h1>
      {notes && notes.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <NoteQueueItem
              key={note.id}
              id={note.id}
              noteText={note.note_text ?? ""}
              bookExcerpt={excerptById.get(note.book_id) ?? ""}
              moderationReasons={note.moderation_reasons}
              createdAt={note.created_at}
            />
          ))}
        </ul>
      ) : (
        <p className="text-cream-200">Nothing waiting for review.</p>
      )}
    </div>
  );
}
