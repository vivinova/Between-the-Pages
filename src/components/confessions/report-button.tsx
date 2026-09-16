"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { reportContent } from "@/lib/actions/reports";
import type { ReportReason } from "@/lib/report-reasons";

interface ReportButtonProps {
  targetType: "confession" | "interaction";
  targetId: string;
}

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return <span className="text-xs text-wood-500">Reported</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-wood-500 underline hover:text-wood-700"
      >
        Report
      </button>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await reportContent({ targetType, targetId, reason });
    setSubmitting(false);
    if (result.ok) {
      setDone(true);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <select
        value={reason}
        onChange={(event) => setReason(event.target.value as ReportReason)}
        className="rounded border border-wood-400/40 bg-cream-50 px-2 py-1 text-wood-800"
      >
        {REPORT_REASONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.name}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="secondary"
        disabled={submitting}
        onClick={handleSubmit}
        className="px-2 py-1 text-xs"
      >
        {submitting ? "Sending…" : "Submit report"}
      </Button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-wood-500 underline hover:text-wood-700"
      >
        Cancel
      </button>
    </div>
  );
}
