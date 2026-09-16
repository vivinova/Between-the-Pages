"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  dismissReport,
  escalateReport,
  removeBookAsModerator,
  removeMarginNoteAsModerator,
  resolveReport,
} from "@/lib/actions/moderation";
import { Button } from "@/components/ui/button";
import type { ReportReviewState } from "@/lib/supabase/types";

interface ReportQueueItemProps {
  id: string;
  reason: string;
  reviewState: ReportReviewState;
  createdAt: string;
  targetKind: "book" | "interaction";
  targetId: string;
  contentPreview: string;
}

export function ReportQueueItem({
  id,
  reason,
  reviewState,
  createdAt,
  targetKind,
  targetId,
  contentPreview,
}: ReportQueueItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ error?: string }>) => {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  };

  return (
    <li className="rounded-md border border-wood-400/30 bg-cream-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-wood-500">
        <span>
          {targetKind === "book" ? "Book" : "Margin note"} · {reason} · {reviewState}
        </span>
        <span>{new Date(createdAt).toLocaleString()}</span>
      </div>
      <p className="mt-2 text-wood-900">{contentPreview}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" disabled={isPending} onClick={() => run(() => resolveReport(id))}>
          Resolve
        </Button>
        <Button type="button" variant="ghost" disabled={isPending} onClick={() => run(() => dismissReport(id))}>
          Dismiss
        </Button>
        <Button type="button" variant="ghost" disabled={isPending} onClick={() => run(() => escalateReport(id))}>
          Escalate
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="border-burgundy-500 text-burgundy-600"
          disabled={isPending}
          onClick={() =>
            run(() =>
              targetKind === "book"
                ? removeBookAsModerator(targetId, `Reported: ${reason}`)
                : removeMarginNoteAsModerator(targetId, `Reported: ${reason}`),
            )
          }
        >
          Remove content
        </Button>
      </div>
    </li>
  );
}
