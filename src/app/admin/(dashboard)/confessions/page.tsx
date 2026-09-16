import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConfessionQueueItem } from "@/components/admin/confession-queue-item";

export const metadata: Metadata = { title: "Pending confessions" };
export const dynamic = "force-dynamic";

export default async function AdminConfessionsPage() {
  const admin = createAdminClient();
  const [{ data: confessions }, { data: categories }] = await Promise.all([
    admin
      .from("confessions")
      .select("id, body_text, category_id, moderation_reasons, created_at")
      .eq("moderation_state", "pending_review")
      .order("created_at", { ascending: true }),
    admin.from("categories").select("id, name"),
  ]);

  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  return (
    <div>
      <h1 className="font-serif text-2xl text-wood-900">Pending confessions</h1>
      {confessions && confessions.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {confessions.map((confession) => (
            <ConfessionQueueItem
              key={confession.id}
              id={confession.id}
              bodyText={confession.body_text}
              categoryName={categoryNameById.get(confession.category_id)}
              moderationReasons={confession.moderation_reasons}
              createdAt={confession.created_at}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-wood-600">Nothing pending.</p>
      )}
    </div>
  );
}
