"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addBookmark, removeBookmark } from "@/lib/actions/bookmarks";
import { Button } from "@/components/ui/button";

interface BookmarkButtonProps {
  bookId: string;
  initiallyBookmarked: boolean;
  signedIn: boolean;
}

export function BookmarkButton({ bookId, initiallyBookmarked, signedIn }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initiallyBookmarked);
  const [isPending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link href="/login" className="text-sm font-medium text-dusk-700 underline">
        Sign in to bookmark this book
      </Link>
    );
  }

  const toggle = () => {
    const next = !bookmarked;
    setBookmarked(next);
    startTransition(async () => {
      const result = next ? await addBookmark(bookId) : await removeBookmark(bookId);
      if (result.error) {
        setBookmarked(!next);
      }
    });
  };

  return (
    <Button type="button" variant="secondary" onClick={toggle} disabled={isPending}>
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </Button>
  );
}
