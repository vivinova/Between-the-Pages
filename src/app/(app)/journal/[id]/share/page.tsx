import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ShareFlow } from "@/components/publishing/share-flow";

export const metadata: Metadata = { title: "Leave a passage" };

export default async function ShareEntryPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const [{ data: entry }, { data: shelves }] = await Promise.all([
    supabase.from("journal_entries").select("id").eq("id", params.id).maybeSingle(),
    supabase
      .from("shelves")
      .select("id, name")
      .eq("is_hidden", false)
      .order("sort_order", { ascending: true }),
  ]);

  if (!entry) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ShareFlow entryId={entry.id} shelves={shelves ?? []} />
    </div>
  );
}
