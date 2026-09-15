import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EntryEditor } from "@/components/journal/entry-editor";

export const metadata: Metadata = { title: "Journal entry" };

export default async function JournalEntryPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: entry } = await supabase
    .from("journal_entries")
    .select("id, title, body, prompt_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!entry) {
    notFound();
  }

  let promptText: string | null = null;
  if (entry.prompt_id) {
    const { data: prompt } = await supabase
      .from("prompts")
      .select("prompt_text")
      .eq("id", entry.prompt_id)
      .maybeSingle();
    promptText = prompt?.prompt_text ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <EntryEditor
        entryId={entry.id}
        initialTitle={entry.title ?? ""}
        initialBody={entry.body}
        promptId={entry.prompt_id}
        promptText={promptText}
      />
    </div>
  );
}
