import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReplyQueueItem } from "@/components/admin/reply-queue-item";

export const metadata: Metadata = { title: "Pending replies" };
export const dynamic = "force-dynamic";

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export default async function AdminRepliesPage() {
  const admin = createAdminClient();
  const { data: replies } = await admin
    .from("interactions")
    .select("id, body_text, confession_id, moderation_reasons, created_at")
    .eq("type", "reply")
    .eq("moderation_state", "pending_review")
    .order("created_at", { ascending: true });

  const confessionIds = [...new Set((replies ?? []).map((r) => r.confession_id))];
  const { data: confessions } =
    confessionIds.length > 0
      ? await admin.from("confessions").select("id, body_text").in("id", confessionIds)
      : { data: [] };
  const excerptById = new Map(
    (confessions ?? []).map((c) => [c.id, truncate(c.body_text, 120)]),
  );

  return (
    <div>
      <h1 className="font-serif text-2xl text-wood-900">Pending replies</h1>
      {replies && replies.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {replies.map((reply) => (
            <ReplyQueueItem
              key={reply.id}
              id={reply.id}
              bodyText={reply.body_text ?? ""}
              confessionExcerpt={excerptById.get(reply.confession_id) ?? "(confession removed)"}
              moderationReasons={reply.moderation_reasons}
              createdAt={reply.created_at}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-wood-600">Nothing pending.</p>
      )}
    </div>
  );
}
