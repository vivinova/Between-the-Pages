import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReportQueueItem } from "@/components/admin/report-queue-item";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  const supabase = createAdminClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, review_state, created_at, book_id, interaction_id")
    .order("created_at", { ascending: true });

  const bookIds = [...new Set((reports ?? []).map((r) => r.book_id).filter((id): id is string => id !== null))];
  const interactionIds = [
    ...new Set((reports ?? []).map((r) => r.interaction_id).filter((id): id is string => id !== null)),
  ];

  const [{ data: books }, { data: notes }] = await Promise.all([
    bookIds.length
      ? supabase.from("books").select("id, excerpt_text").in("id", bookIds)
      : Promise.resolve({ data: [] as { id: string; excerpt_text: string }[] }),
    interactionIds.length
      ? supabase.from("interactions").select("id, note_text").in("id", interactionIds)
      : Promise.resolve({ data: [] as { id: string; note_text: string | null }[] }),
  ]);

  const bookById = new Map((books ?? []).map((b) => [b.id, b.excerpt_text]));
  const noteById = new Map((notes ?? []).map((n) => [n.id, n.note_text ?? ""]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl text-cream-100">Reports</h1>
      {reports && reports.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => {
            const isBook = report.book_id !== null;
            const targetId = (isBook ? report.book_id : report.interaction_id) ?? "";
            const preview = isBook
              ? (bookById.get(targetId) ?? "(book no longer exists)")
              : (noteById.get(targetId) ?? "(note no longer exists)");
            return (
              <ReportQueueItem
                key={report.id}
                id={report.id}
                reason={report.reason}
                reviewState={report.review_state}
                createdAt={report.created_at}
                targetKind={isBook ? "book" : "interaction"}
                targetId={targetId}
                contentPreview={preview}
              />
            );
          })}
        </ul>
      ) : (
        <p className="text-cream-200">No reports.</p>
      )}
    </div>
  );
}
