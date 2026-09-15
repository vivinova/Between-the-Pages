"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Prompt } from "@/lib/prompts";

interface PromptCardProps {
  prompts: Prompt[];
  featuredPromptId: string | null;
}

export function PromptCard({ prompts, featuredPromptId }: PromptCardProps) {
  const initialIndex = Math.max(
    0,
    prompts.findIndex((prompt) => prompt.id === featuredPromptId),
  );
  const [index, setIndex] = useState(initialIndex);

  if (prompts.length === 0) {
    return (
      <div className="rounded-lg border border-wood-400/30 bg-cream-50 p-6">
        <p className="text-wood-700">
          There&apos;s no prompt today, but the page is still yours.
        </p>
        <Link href="/journal/new" className="mt-4 inline-block">
          <Button variant="primary">Write freely</Button>
        </Link>
      </div>
    );
  }

  const current = prompts[index]!;

  const tryAnother = () => {
    if (prompts.length < 2) return;
    let next = Math.floor(Math.random() * prompts.length);
    while (next === index) {
      next = Math.floor(Math.random() * prompts.length);
    }
    setIndex(next);
  };

  return (
    <div className="rounded-lg border border-wood-400/30 bg-cream-50 p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-forest-600">
        Today&apos;s prompt
      </p>
      <p className="mt-2 font-serif text-xl text-wood-900">{current.prompt_text}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/journal/new?promptId=${current.id}`}>
          <Button variant="primary">Write about this</Button>
        </Link>
        <Link href="/journal/new">
          <Button variant="secondary">Write freely</Button>
        </Link>
        {prompts.length > 1 ? (
          <Button type="button" variant="ghost" onClick={tryAnother}>
            Try another prompt
          </Button>
        ) : null}
      </div>
    </div>
  );
}
