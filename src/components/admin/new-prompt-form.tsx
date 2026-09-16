"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPrompt } from "@/lib/actions/admin-content";
import { Button } from "@/components/ui/button";

export function NewPromptForm() {
  const router = useRouter();
  const [promptText, setPromptText] = useState("");
  const [theme, setTheme] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createPrompt({ promptText, theme: theme || undefined });
      if (result.error) {
        setError(result.error);
        return;
      }
      setPromptText("");
      setTheme("");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-wood-400/30 bg-cream-50 p-3">
      <input
        value={promptText}
        onChange={(event) => setPromptText(event.target.value)}
        placeholder="Prompt text"
        className="min-w-[16rem] flex-1 rounded-md border border-wood-400/40 bg-cream-50 px-2 py-1"
      />
      <input
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        placeholder="Theme (optional)"
        className="rounded-md border border-wood-400/40 bg-cream-50 px-2 py-1"
      />
      <Button type="button" disabled={isPending || !promptText} onClick={submit}>
        Add prompt
      </Button>
      {error ? <span className="text-sm text-burgundy-600">{error}</span> : null}
    </div>
  );
}
