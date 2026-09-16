"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeBookmark } from "@/lib/actions/bookmarks";
import { Button } from "@/components/ui/button";

export function RemoveBookmarkButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await removeBookmark(bookId);
          router.refresh();
        })
      }
    >
      {isPending ? "Removing…" : "Remove"}
    </Button>
  );
}
