"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveBook, removeBook } from "@/lib/actions/books";
import { Button } from "@/components/ui/button";
import type { BookModerationState } from "@/lib/supabase/types";

export function BookActions({ id, state }: { id: string; state: BookModerationState }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<"archive" | "remove" | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (action: (id: string) => Promise<{ error?: string }>) => {
    startTransition(async () => {
      await action(id);
      setConfirming(null);
      router.refresh();
    });
  };

  if (state !== "published" && state !== "archived") {
    return null;
  }

  if (confirming === "archive") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-wood-600">Archive this passage?</span>
        <Button variant="secondary" disabled={isPending} onClick={() => run(archiveBook)}>
          {isPending ? "Archiving…" : "Yes, archive"}
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(null)}>
          Cancel
        </Button>
      </div>
    );
  }

  if (confirming === "remove") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-burgundy-600">Permanently remove this passage?</span>
        <Button
          variant="secondary"
          className="border-burgundy-500 text-burgundy-600"
          disabled={isPending}
          onClick={() => run(removeBook)}
        >
          {isPending ? "Removing…" : "Yes, remove"}
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(null)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {state === "published" ? (
        <Button variant="ghost" onClick={() => setConfirming("archive")}>
          Archive
        </Button>
      ) : null}
      <Button variant="ghost" onClick={() => setConfirming("remove")}>
        Remove
      </Button>
    </div>
  );
}
