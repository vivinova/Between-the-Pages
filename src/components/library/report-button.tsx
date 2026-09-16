"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { reportBook } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import type { ReportReason } from "@/lib/supabase/types";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "harassment", label: "Harassment" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "dangerous_advice", label: "Dangerous advice" },
  { value: "graphic_content", label: "Graphic content" },
  { value: "personal_information", label: "Personal information" },
  { value: "spam", label: "Spam" },
  { value: "incorrect_labels", label: "Incorrect content labels" },
  { value: "immediate_safety_concern", label: "Immediate safety concern" },
  { value: "other", label: "Something else" },
];

interface ReportButtonProps {
  bookId: string;
  alreadyReported: boolean;
  signedIn: boolean;
}

export function ReportButton({ bookId, alreadyReported, signedIn }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("harassment");
  const [reported, setReported] = useState(alreadyReported);
  const [isPending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link href="/login" className="text-sm text-wood-500 underline">
        Sign in to report this book
      </Link>
    );
  }

  if (reported) {
    return <p className="text-sm text-wood-500">Reported — you won&apos;t see this again.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-wood-500 underline"
      >
        Report this book
      </button>
    );
  }

  const submit = () => {
    startTransition(async () => {
      const result = await reportBook({ bookId, reason });
      if (!result.error) {
        setReported(true);
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-wood-400/30 bg-cream-50 p-3">
      <label htmlFor="report-reason" className="text-sm font-medium text-wood-700">
        Why are you reporting this?
      </label>
      <select
        id="report-reason"
        value={reason}
        onChange={(event) => setReason(event.target.value as ReportReason)}
        className="rounded-md border border-wood-400/40 bg-cream-50 px-2 py-1 text-sm text-wood-900"
      >
        {REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" disabled={isPending} onClick={submit}>
          {isPending ? "Submitting…" : "Submit report"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
