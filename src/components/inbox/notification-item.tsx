"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { dismissNotification, markNotificationRead } from "@/lib/actions/notifications";
import type { NotificationType } from "@/lib/supabase/types";

const MESSAGES: Record<NotificationType, string> = {
  needed_this: "Something you left in the library was needed by someone today.",
  pressed_flower: "Someone left a pressed flower in one of your books.",
  margin_note_approved: "A margin note arrived on one of your books.",
  margin_note_rejected: "One of your margin notes wasn't approved.",
};

interface NotificationItemProps {
  id: string;
  type: NotificationType;
  bookId: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationItem({ id, type, bookId, read, createdAt }: NotificationItemProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    if (!read) {
      startTransition(async () => {
        await markNotificationRead(id);
        router.refresh();
      });
    }
  };

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissNotification(id);
      router.refresh();
    });
  };

  return (
    <li
      className={`flex items-start justify-between gap-3 rounded-md border p-4 ${
        read ? "border-wood-400/20 bg-cream-50" : "border-forest-400/40 bg-forest-400/10"
      }`}
    >
      <div className="min-w-0 flex-1">
        {bookId ? (
          <Link href={`/library/books/${bookId}`} onClick={handleOpen} className="text-wood-900 underline">
            {MESSAGES[type]}
          </Link>
        ) : (
          <p className="text-wood-900">{MESSAGES[type]}</p>
        )}
        <p className="mt-1 text-xs text-wood-500">{new Date(createdAt).toLocaleDateString()}</p>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleDismiss}
        className="shrink-0 text-sm text-wood-500 underline"
      >
        Dismiss
      </button>
    </li>
  );
}
