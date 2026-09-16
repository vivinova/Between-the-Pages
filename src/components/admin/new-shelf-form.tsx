"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShelf } from "@/lib/actions/admin-content";
import { Button } from "@/components/ui/button";

export function NewShelfForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await createShelf({ slug, name });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSlug("");
      setName("");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-wood-400/30 bg-cream-50 p-3">
      <input
        value={slug}
        onChange={(event) => setSlug(event.target.value)}
        placeholder="slug-like-this"
        className="rounded-md border border-wood-400/40 bg-cream-50 px-2 py-1"
      />
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Shelf name"
        className="min-w-[12rem] flex-1 rounded-md border border-wood-400/40 bg-cream-50 px-2 py-1"
      />
      <Button type="button" disabled={isPending || !slug || !name} onClick={submit}>
        Add shelf
      </Button>
      {error ? <span className="text-sm text-burgundy-600">{error}</span> : null}
    </div>
  );
}
