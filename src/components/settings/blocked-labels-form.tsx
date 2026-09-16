"use client";

import { useState, useTransition } from "react";
import { updateBlockedLabels } from "@/lib/actions/settings";
import { CONTENT_LABELS } from "@/lib/content-labels";
import type { ContentLabel } from "@/lib/supabase/types";

export function BlockedLabelsForm({ initialBlocked }: { initialBlocked: ContentLabel[] }) {
  const [blocked, setBlocked] = useState<ContentLabel[]>(initialBlocked);
  const [isPending, startTransition] = useTransition();

  const toggle = (label: ContentLabel) => {
    const next = blocked.includes(label)
      ? blocked.filter((l) => l !== label)
      : [...blocked, label];
    setBlocked(next);
    startTransition(async () => {
      await updateBlockedLabels(next);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-wood-600">
        Books with a blocked topic never appear in your shelves or Find Me Something.
      </p>
      {CONTENT_LABELS.map((label) => (
        <label key={label.value} className="flex items-center gap-2 text-wood-800">
          <input
            type="checkbox"
            checked={blocked.includes(label.value)}
            disabled={isPending}
            onChange={() => toggle(label.value)}
            className="h-4 w-4 rounded border-wood-400/60 text-forest-600"
          />
          Block &ldquo;{label.name}&rdquo;
        </label>
      ))}
    </div>
  );
}
