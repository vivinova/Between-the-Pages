import type { BookModerationState } from "@/lib/supabase/types";

const STYLES: Record<BookModerationState, string> = {
  draft: "bg-wood-400/10 text-wood-600",
  pending_review: "bg-dusk-400/20 text-dusk-700",
  published: "bg-forest-400/20 text-forest-700",
  rejected: "bg-burgundy-500/15 text-burgundy-700",
  removed: "bg-wood-400/10 text-wood-500",
  archived: "bg-wood-400/15 text-wood-600",
};

const LABELS: Record<BookModerationState, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
  rejected: "Rejected",
  removed: "Removed",
  archived: "Archived",
};

export function BookStatusBadge({ state }: { state: BookModerationState }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[state]}`}
    >
      {LABELS[state]}
    </span>
  );
}
