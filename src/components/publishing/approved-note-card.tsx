"use client";

import { useState, useTransition } from "react";
import { setMarginNoteVisibility } from "@/lib/actions/margin-notes";
import { reportInteraction } from "@/lib/actions/reports";
import type { ReportReason } from "@/lib/supabase/types";

interface ApprovedNoteCardProps {
  id: string;
  text: string;
  initiallyVisible: boolean;
}

export function ApprovedNoteCard({ id, text, initiallyVisible }: ApprovedNoteCardProps) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [reported, setReported] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("harassment");
  const [isPending, startTransition] = useTransition();

  const toggleVisible = () => {
    const next = !visible;
    setVisible(next);
    startTransition(async () => {
      const result = await setMarginNoteVisibility(id, next);
      if (result.error) setVisible(!next);
    });
  };

  return (
    <li className="rounded-md border border-wood-400/20 bg-cream-50 p-3">
      <p className="text-wood-800">{text}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2 text-wood-700">
          <input
            type="checkbox"
            checked={visible}
            disabled={isPending}
            onChange={toggleVisible}
            className="h-4 w-4 rounded border-wood-400/60 text-forest-600"
          />
          Visible to future readers
        </label>
        {reported ? (
          <span className="text-wood-500">Reported</span>
        ) : reportOpen ? (
          <span className="flex items-center gap-2">
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              className="rounded border border-wood-400/40 bg-cream-50 px-1 py-0.5 text-xs"
            >
              <option value="harassment">Harassment</option>
              <option value="hate_speech">Hate speech</option>
              <option value="personal_information">Personal information</option>
              <option value="spam">Spam</option>
              <option value="other">Something else</option>
            </select>
            <button
              type="button"
              onClick={() =>
                startTransition(async () => {
                  const result = await reportInteraction({ interactionId: id, reason });
                  if (!result.error) setReported(true);
                })
              }
              className="text-dusk-700 underline"
            >
              Submit
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setReportOpen(true)} className="text-wood-500 underline">
            Report as abusive
          </button>
        )}
      </div>
    </li>
  );
}
