"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateNotificationCategoryEnabled } from "@/lib/actions/notifications";

const CATEGORIES: { key: "needed_this" | "pressed_flower" | "margin_note"; label: string }[] = [
  { key: "needed_this", label: "“I needed this”" },
  { key: "pressed_flower", label: "Pressed flowers" },
  { key: "margin_note", label: "Margin notes" },
];

interface NotificationPreferencesProps {
  settings: Record<string, unknown>;
}

export function NotificationPreferences({ settings }: NotificationPreferencesProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-dusk-700 underline">
        Manage what notifies you
      </button>
    );
  }

  return (
    <div className="rounded-md border border-wood-400/20 bg-cream-50 p-4">
      <p className="text-sm font-medium text-wood-700">Notify me about</p>
      <div className="mt-2 flex flex-col gap-1">
        {CATEGORIES.map((category) => (
          <label key={category.key} className="flex items-center gap-2 text-sm text-wood-800">
            <input
              type="checkbox"
              checked={settings[category.key] !== false}
              disabled={isPending}
              onChange={(event) =>
                startTransition(async () => {
                  await updateNotificationCategoryEnabled(category.key, event.target.checked);
                  router.refresh();
                })
              }
              className="h-4 w-4 rounded border-wood-400/60 text-forest-600"
            />
            {category.label}
          </label>
        ))}
      </div>
    </div>
  );
}
