"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPromptStatus } from "@/lib/actions/admin-content";
import { Button } from "@/components/ui/button";

interface PromptRowProps {
  id: string;
  promptText: string;
  theme: string | null;
  status: "draft" | "active" | "archived";
}

export function PromptRow({ id, promptText, theme, status }: PromptRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setStatus = (next: "draft" | "active" | "archived") => {
    startTransition(async () => {
      await setPromptStatus(id, next);
      router.refresh();
    });
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-wood-400/30 bg-cream-50 p-3">
      <div>
        <p className="text-wood-900">{promptText}</p>
        <p className="text-xs text-wood-500">
          {theme ?? "no theme"} · {status}
        </p>
      </div>
      <div className="flex gap-2">
        {status !== "active" ? (
          <Button type="button" variant="secondary" disabled={isPending} onClick={() => setStatus("active")}>
            Activate
          </Button>
        ) : (
          <Button type="button" variant="ghost" disabled={isPending} onClick={() => setStatus("archived")}>
            Archive
          </Button>
        )}
      </div>
    </li>
  );
}
