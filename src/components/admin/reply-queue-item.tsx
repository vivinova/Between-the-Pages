"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveReply, rejectReply } from "@/lib/actions/moderation";

interface ReplyQueueItemProps {
  id: string;
  bodyText: string;
  confessionExcerpt: string;
  moderationReasons: string[];
  createdAt: string;
}

export function ReplyQueueItem({
  id,
  bodyText,
  confessionExcerpt,
  moderationReasons,
  createdAt,
}: ReplyQueueItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveReply(id);
      router.refresh();
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectReply(id);
      router.refresh();
    });
  };

  return (
    <li className="rounded-md border border-wood-400/30 bg-cream-50 p-4">
      <p className="text-xs text-wood-500">In reply to: {confessionExcerpt}</p>
      <p className="mt-2 whitespace-pre-wrap text-wood-900">{bodyText}</p>
      {moderationReasons.length > 0 ? (
        <p className="mt-1 text-xs font-medium text-burgundy-600">
          Flagged: {moderationReasons.join(", ")}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-wood-500">
        <span>{new Date(createdAt).toLocaleString()}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="button" disabled={isPending} onClick={handleApprove}>
          Approve
        </Button>
        <Button type="button" variant="secondary" disabled={isPending} onClick={handleReject}>
          Reject
        </Button>
      </div>
    </li>
  );
}
