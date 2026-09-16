"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  resolveReport,
  dismissReport,
  escalateReport,
  removeReportedContent,
} from "@/lib/actions/moderation";
import { REPORT_REASONS } from "@/lib/report-reasons";
import type { ReportReason } from "@/lib/report-reasons";

interface ReportQueueItemProps {
  id: string;
  targetType: "confession" | "interaction";
  targetId: string;
  targetPreview: string;
  reason: ReportReason;
  createdAt: string;
}

const REASON_NAME_BY_VALUE = new Map(REPORT_REASONS.map((r) => [r.value, r.name]));

export function ReportQueueItem({
  id,
  targetType,
  targetId,
  targetPreview,
  reason,
  createdAt,
}: ReportQueueItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<unknown>) => {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  };

  return (
    <li className="rounded-md border border-wood-400/30 bg-cream-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-wood-500">
        <span>{targetType === "confession" ? "Confession" : "Reply"}</span>
        <span>{new Date(createdAt).toLocaleString()}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-wood-900">{targetPreview}</p>
      <p className="mt-2 text-xs font-medium text-burgundy-600">
        Reason: {REASON_NAME_BY_VALUE.get(reason) ?? reason}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" disabled={isPending} onClick={() => run(() => resolveReport(id))}>
          Resolve
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => run(() => dismissReport(id))}
        >
          Dismiss
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isPending}
          onClick={() => run(() => escalateReport(id))}
        >
          Escalate
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={() => run(() => removeReportedContent(id, targetType, targetId))}
        >
          Remove content
        </Button>
      </div>
    </li>
  );
}
