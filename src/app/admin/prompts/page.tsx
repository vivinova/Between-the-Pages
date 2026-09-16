import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { PromptRow } from "@/components/admin/prompt-row";
import { NewPromptForm } from "@/components/admin/new-prompt-form";

export const metadata: Metadata = { title: "Prompts" };

export default async function AdminPromptsPage() {
  const supabase = createAdminClient();
  const { data: prompts } = await supabase
    .from("prompts")
    .select("id, prompt_text, theme, status")
    .order("status");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl text-cream-100">Prompts</h1>
      <ul className="flex flex-col gap-2">
        {(prompts ?? []).map((prompt) => (
          <PromptRow
            key={prompt.id}
            id={prompt.id}
            promptText={prompt.prompt_text}
            theme={prompt.theme}
            status={prompt.status}
          />
        ))}
      </ul>
      <div>
        <h2 className="font-serif text-lg text-cream-100">Add a prompt</h2>
        <div className="mt-2">
          <NewPromptForm />
        </div>
      </div>
    </div>
  );
}
