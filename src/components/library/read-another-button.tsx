"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pickLibraryBook } from "@/lib/actions/library";
import { Button } from "@/components/ui/button";

interface ReadAnotherButtonProps {
  label: string;
  currentBookId: string;
  shelfId?: string;
  excludeOwn?: boolean;
  navigateQuery: string;
}

export function ReadAnotherButton({
  label,
  currentBookId,
  shelfId,
  excludeOwn,
  navigateQuery,
}: ReadAnotherButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [empty, setEmpty] = useState(false);

  const handleClick = () => {
    setEmpty(false);
    startTransition(async () => {
      const result = await pickLibraryBook({
        shelfId,
        excludeOwn,
        excludeIds: [currentBookId],
      });
      if ("empty" in result) {
        setEmpty(true);
        return;
      }
      router.push(`/library/books/${result.id}?${navigateQuery}`);
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="secondary" onClick={handleClick} disabled={isPending}>
        {isPending ? "Finding…" : label}
      </Button>
      {empty ? (
        <p className="text-sm text-wood-500">No other eligible books right now.</p>
      ) : null}
    </div>
  );
}
