import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getReactionCounts, getMyActiveReactions } from "@/lib/actions/interactions";
import { DeleteConfessionButton } from "@/components/confess/delete-confession-button";
import { ReactionButtons } from "@/components/confessions/reaction-buttons";
import { ReplyForm } from "@/components/confessions/reply-form";
import { ReportButton } from "@/components/confessions/report-button";
import { SaveConfessionButton } from "@/components/confessions/save-confession-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Confession" };

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export default async function ConfessionPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: confession } = await supabase
    .from("public_confessions")
    .select("id, category_id, body_text")
    .eq("id", params.id)
    .maybeSingle();

  if (!confession) {
    notFound();
  }

  const [{ data: category }, { data: replies }, counts, activeReactions] = await Promise.all([
    supabase.from("categories").select("slug, name").eq("id", confession.category_id).maybeSingle(),
    supabase
      .from("interactions")
      .select("id, body_text, created_at")
      .eq("confession_id", confession.id)
      .eq("type", "reply")
      .eq("moderation_state", "published")
      .order("created_at", { ascending: true }),
    getReactionCounts(confession.id),
    getMyActiveReactions(confession.id),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      {category ? (
        <Link
          href={`/categories/${category.slug}`}
          className="text-sm text-dusk-700 underline"
        >
          {category.name}
        </Link>
      ) : null}
      <blockquote className="mt-3 whitespace-pre-wrap rounded-md border border-wood-400/30 bg-cream-50 p-6 font-serif text-lg text-wood-900">
        {confession.body_text}
      </blockquote>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ReactionButtons
          confessionId={confession.id}
          initialCounts={counts}
          initialActive={activeReactions}
        />
        <div className="flex items-center gap-3">
          <SaveConfessionButton
            confessionId={confession.id}
            preview={truncate(confession.body_text, 120)}
          />
          <ReportButton targetType="confession" targetId={confession.id} />
        </div>
      </div>

      <DeleteConfessionButton confessionId={confession.id} />

      <div className="mt-10 border-t border-wood-400/20 pt-6">
        <h2 className="font-serif text-lg text-wood-900">Replies</h2>
        {replies && replies.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-3">
            {replies.map((reply) => (
              <li
                key={reply.id}
                className="rounded-md border border-wood-400/20 bg-cream-50 p-3"
              >
                <p className="whitespace-pre-wrap text-sm text-wood-800">{reply.body_text}</p>
                <div className="mt-1 flex justify-end">
                  <ReportButton targetType="interaction" targetId={reply.id} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-wood-500">No replies yet.</p>
        )}
        <div className="mt-6">
          <ReplyForm confessionId={confession.id} />
        </div>
      </div>
    </div>
  );
}
