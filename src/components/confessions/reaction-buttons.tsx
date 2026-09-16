"use client";

import { useState, useTransition } from "react";
import clsx from "clsx";
import { toggleReaction } from "@/lib/actions/interactions";
import type { ReactionType } from "@/lib/validation/interactions";

const REACTION_LABELS: Record<ReactionType, string> = {
  me_too: "Me too",
  sending_love: "Sending love",
};

interface ReactionButtonsProps {
  confessionId: string;
  initialCounts: Record<ReactionType, number>;
  initialActive: ReactionType[];
}

export function ReactionButtons({
  confessionId,
  initialCounts,
  initialActive,
}: ReactionButtonsProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [active, setActive] = useState<Set<ReactionType>>(new Set(initialActive));
  const [isPending, startTransition] = useTransition();

  const handleClick = (type: ReactionType) => {
    const wasActive = active.has(type);

    // Optimistic update — reconciled below if the server call fails.
    setActive((prev) => {
      const next = new Set(prev);
      wasActive ? next.delete(type) : next.add(type);
      return next;
    });
    setCounts((prev) => ({ ...prev, [type]: prev[type] + (wasActive ? -1 : 1) }));

    startTransition(async () => {
      const result = await toggleReaction({ confessionId, type });
      if (!result.ok || result.active === wasActive) {
        // Roll back: either the call failed, or the server's view of
        // "active" didn't match what we optimistically assumed.
        setActive((prev) => {
          const next = new Set(prev);
          wasActive ? next.add(type) : next.delete(type);
          return next;
        });
        setCounts((prev) => ({ ...prev, [type]: prev[type] + (wasActive ? 1 : -1) }));
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.keys(REACTION_LABELS) as ReactionType[]).map((type) => {
        const isActive = active.has(type);
        return (
          <button
            key={type}
            type="button"
            disabled={isPending}
            onClick={() => handleClick(type)}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              isActive
                ? "border-forest-600 bg-forest-600/10 text-forest-700"
                : "border-wood-400/40 bg-cream-50 text-wood-700 hover:bg-wood-400/10",
            )}
          >
            {REACTION_LABELS[type]}
            <span className="text-xs text-wood-500">{counts[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
