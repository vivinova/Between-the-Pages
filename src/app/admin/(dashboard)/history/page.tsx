import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Moderation history" };
export const dynamic = "force-dynamic";

export default async function AdminHistoryPage() {
  const admin = createAdminClient();
  const { data: entries } = await admin
    .from("audit_log")
    .select("id, actor, action, entity_type, entity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="font-serif text-2xl text-wood-900">Moderation history</h1>
      {entries && entries.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-wood-400/20 bg-cream-50 px-3 py-2 text-sm"
            >
              <span className="text-wood-800">
                <span className="font-medium">{entry.actor}</span> {entry.action.replace(/_/g, " ")}{" "}
                {entry.entity_type}
                {entry.entity_id ? ` (${entry.entity_id.slice(0, 8)}…)` : ""}
              </span>
              <span className="text-xs text-wood-500">
                {new Date(entry.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-wood-600">No moderation actions recorded yet.</p>
      )}
    </div>
  );
}
