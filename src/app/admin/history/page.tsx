import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Moderation history" };

export default async function AdminHistoryPage() {
  const supabase = createAdminClient();
  const { data: entries } = await supabase
    .from("audit_log")
    .select("id, actor_id, action, entity_type, entity_id, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl text-cream-100">Moderation history</h1>
      <p className="text-cream-200">Most recent 200 actions.</p>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-wood-500/40 text-left text-cream-200">
              <th className="py-2 pr-4">When</th>
              <th className="py-2 pr-4">Action</th>
              <th className="py-2 pr-4">Target</th>
              <th className="py-2 pr-4">Reason</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).map((entry) => (
              <tr key={entry.id} className="border-b border-wood-500/20 text-cream-100">
                <td className="py-2 pr-4 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString()}
                </td>
                <td className="py-2 pr-4">{entry.action}</td>
                <td className="py-2 pr-4">
                  {entry.entity_type} · {entry.entity_id}
                </td>
                <td className="py-2 pr-4">
                  {typeof entry.metadata?.reason === "string" ? entry.metadata.reason : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
