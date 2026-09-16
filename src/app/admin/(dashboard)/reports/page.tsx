import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReportQueueItem } from "@/components/admin/report-queue-item";
import type { ReportReason } from "@/lib/report-reasons";

export const metadata: Metadata = { title: "Open reports" };
export const dynamic = "force-dynamic";

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export default async function AdminReportsPage() {
  const admin = createAdminClient();
  const { data: reports } = await admin
    .from("reports")
    .select("id, target_type, target_id, reason, created_at")
    .eq("review_state", "open")
    .order("created_at", { ascending: true });

  const confessionIds = (reports ?? [])
    .filter((r) => r.target_type === "confession")
    .map((r) => r.target_id);
  const interactionIds = (reports ?? [])
    .filter((r) => r.target_type === "interaction")
    .map((r) => r.target_id);

  const [{ data: confessions }, { data: interactions }] = await Promise.all([
    confessionIds.length > 0
      ? admin.from("confessions").select("id, body_text").in("id", confessionIds)
      : Promise.resolve({ data: [] }),
    interactionIds.length > 0
      ? admin.from("interactions").select("id, body_text").in("id", interactionIds)
      : Promise.resolve({ data: [] }),
  ]);

  const previewById = new Map<string, string>();
  for (const c of confessions ?? []) previewById.set(c.id, truncate(c.body_text, 200));
  for (const i of interactions ?? []) previewById.set(i.id, truncate(i.body_text ?? "", 200));

  return (
    <div>
      <h1 className="font-serif text-2xl text-wood-900">Open reports</h1>
      {reports && reports.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {reports.map((report) => (
            <ReportQueueItem
              key={report.id}
              id={report.id}
              targetType={report.target_type}
              targetId={report.target_id}
              targetPreview={previewById.get(report.target_id) ?? "(content removed)"}
              reason={report.reason as ReportReason}
              createdAt={report.created_at}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-wood-600">Nothing open.</p>
      )}
    </div>
  );
}
