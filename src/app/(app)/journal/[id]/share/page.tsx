import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Leave a passage" };

export default async function ShareEntryPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: entry } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("id", params.id)
    .maybeSingle();

  if (!entry) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="font-serif text-2xl text-wood-900">Leave a passage</h1>
      <p className="text-wood-600">
        Selecting an excerpt, previewing exactly what becomes public, and choosing a
        shelf will live here. Coming in Phase 3 — nothing from this entry is shared
        until then.
      </p>
      <Link href={`/journal/${entry.id}`}>
        <Button variant="secondary">Back to entry</Button>
      </Link>
    </div>
  );
}
