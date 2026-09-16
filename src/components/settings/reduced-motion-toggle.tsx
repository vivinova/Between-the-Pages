"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateReducedMotion } from "@/lib/actions/settings";

export function ReducedMotionToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-wood-800">
      <input
        type="checkbox"
        checked={enabled}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.checked;
          setEnabled(next);
          startTransition(async () => {
            await updateReducedMotion(next);
            router.refresh();
          });
        }}
        className="h-4 w-4 rounded border-wood-400/60 text-forest-600"
      />
      Always use reduced motion, regardless of my device settings
    </label>
  );
}
