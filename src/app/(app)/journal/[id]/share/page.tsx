import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ShareFlow } from "@/components/publishing/share-flow";

export const metadata: Metadata = { title: "Leave a passage" };

export default async function ShareEntryPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: entry }, { data: shelves }, { data: profile }] = await Promise.all([
    supabase.from("journal_entries").select("id").eq("id", params.id).maybeSingle(),
    supabase
      .from("shelves")
      .select("id, name")
      .eq("is_hidden", false)
      .order("sort_order", { ascending: true }),
    user
      ? supabase
          .from("profiles")
          .select("default_allow_margin_notes, default_notes_visible_to_readers")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!entry) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ShareFlow
        entryId={entry.id}
        shelves={shelves ?? []}
        defaultAllowMarginNotes={profile?.default_allow_margin_notes ?? true}
        defaultNotesVisibleToReaders={profile?.default_notes_visible_to_readers ?? false}
      />
    </div>
  );
}
