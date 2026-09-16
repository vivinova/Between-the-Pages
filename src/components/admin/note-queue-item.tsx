"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveMarginNote, rejectMarginNote } from "@/lib/actions/moderation";
import { Button } from "@/components/ui/button";

interface NoteQueueItemProps {
  id: string;
  noteText: string;
  bookExcerpt: string;
  moderationReasons: string[];
  createdAt: string;
}

export function NoteQueueItem({
  id,
  noteText,
  bookExcerpt,
  moderationReasons,
  createdAt,
}: NoteQueueItemProps) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveMarginNote(id);
      router.refresh();
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectMarginNote(id, reason);
      router.refresh();
    });
  };

  return (
    <li className="rounded-md border border-wood-400/30 bg-cream-50 p-4">
      <p className="text-xs text-wood-500">{new Date(createdAt).toLocaleString()}</p>
      <p className="mt-1 text-sm text-wood-500">On: &ldquo;{bookExcerpt}&rdquo;</p>
      <p className="mt-2 text-wood-900">{noteText}</p>
      {moderationReasons.length > 0 ? (
        <p className="mt-1 text-xs font-medium text-burgundy-600">
          Flagged: {moderationReasons.join(", ")}
        </p>
      ) : null}
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
