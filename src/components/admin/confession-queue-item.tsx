"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveConfession, rejectConfession } from "@/lib/actions/moderation";

interface ConfessionQueueItemProps {
  id: string;
  bodyText: string;
  categoryName: string | undefined;
  moderationReasons: string[];
  createdAt: string;
}

export function ConfessionQueueItem({
  id,
  bodyText,
  categoryName,
  moderationReasons,
  createdAt,
}: ConfessionQueueItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveConfession(id);
      router.refresh();
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectConfession(id);
      router.refresh();
    });
  };

  return (
    <li className="rounded-md border border-wood-400/30 bg-cream-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-wood-500">
        <span>{categoryName}</span>
        <span>{new Date(createdAt).toLocaleString()}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap font-serif text-wood-900">{bodyText}</p>
      {moderationReasons.length > 0 ? (
        <p className="mt-1 text-xs font-medium text-burgundy-600">
          Flagged: {moderationReasons.join(", ")}
        </p>
      ) : null}
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
