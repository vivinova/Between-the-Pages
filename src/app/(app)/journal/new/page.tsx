import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EntryEditor } from "@/components/journal/entry-editor";

export const metadata: Metadata = { title: "New entry" };

export default async function NewJournalEntryPage({
  searchParams,
}: {
  searchParams: { promptId?: string };
}) {
  const promptId = searchParams.promptId ?? null;
  let promptText: string | null = null;

  if (promptId) {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("prompts")
      .select("prompt_text")
      .eq("id", promptId)
      .eq("status", "active")
      .maybeSingle();
    promptText = data?.prompt_text ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <EntryEditor
        entryId={null}
        initialTitle=""
        initialBody=""
        promptId={promptText ? promptId : null}
        promptText={promptText}
      />
    </div>
  );
}
