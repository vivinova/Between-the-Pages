"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveBook, rejectBook, relabelBook } from "@/lib/actions/moderation";
import { Button } from "@/components/ui/button";
import { CONTENT_LABELS } from "@/lib/content-labels";
import type { ContentLabel } from "@/lib/supabase/types";

interface BookQueueItemProps {
  id: string;
  excerptText: string;
  shelfName: string | undefined;
  labels: ContentLabel[];
  moderationReasons: string[];
  createdAt: string;
}

export function BookQueueItem({
  id,
  excerptText,
  shelfName,
  labels: initialLabels,
  moderationReasons,
  createdAt,
}: BookQueueItemProps) {
  const router = useRouter();
  const [labels, setLabels] = useState<ContentLabel[]>(initialLabels);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleLabel = (label: ContentLabel) => {
    const next = labels.includes(label)
      ? labels.filter((l) => l !== label)
      : [...labels, label];
    setLabels(next);
    startTransition(async () => {
      await relabelBook(id, next);
    });
  };

  const handleApprove = () => {
    startTransition(async () => {
      await approveBook(id);
      router.refresh();
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectBook(id, reason);
      router.refresh();
    });
  };

  return (
    <li className="rounded-md border border-wood-400/30 bg-cream-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-wood-500">
        <span>{shelfName}</span>
        <span>{new Date(createdAt).toLocaleString()}</span>
      </div>
      <p className="mt-2 font-serif text-wood-900">{excerptText}</p>
      {moderationReasons.length > 0 ? (
        <p className="mt-1 text-xs font-medium text-burgundy-600">
          Flagged: {moderationReasons.join(", ")}
        </p>
      ) : null}

      <fieldset className="mt-3 flex flex-wrap gap-2">
        {CONTENT_LABELS.map((label) => (
          <label key={label.value} className="flex items-center gap-1 text-xs text-wood-700">
            <input
              type="checkbox"
              checked={labels.includes(label.value)}
              onChange={() => toggleLabel(label.value)}
              className="h-3.5 w-3.5 rounded border-wood-400/60 text-forest-600"
            />
            {label.name}
          </label>
        ))}
      </fieldset>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" disabled={isPending} onClick={handleApprove}>
          Approve
        </Button>
        {rejecting ? (
          <>
            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason for rejecting"
              className="rounded-md border border-wood-400/40 bg-cream-50 px-2 py-1 text-sm"
            />
            <Button type="button" variant="secondary" disabled={isPending} onClick={handleReject}>
              Confirm reject
            </Button>
            <Button type="button" variant="ghost" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setRejecting(true)}>
            Reject
          </Button>
        )}
      </div>
    </li>
  );
}
