"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pickLibraryBook } from "@/lib/actions/library";
import { Button } from "@/components/ui/button";

interface FindFormProps {
  shelves: { id: string; name: string }[];
}

export function FindForm({ shelves }: FindFormProps) {
  const router = useRouter();
  const [shelfId, setShelfId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [empty, setEmpty] = useState(false);

  const submit = () => {
    setEmpty(false);
    startTransition(async () => {
      const result = await pickLibraryBook({
        shelfId: shelfId || undefined,
        excludeOwn: true,
      });
      if ("empty" in result) {
        setEmpty(true);
        return;
      }
      const query = shelfId ? `from=find&shelf=${shelfId}` : "from=find";
      router.push(`/library/books/${result.id}?${query}`);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium text-wood-700">What are you looking for?</legend>
        <label className="flex items-center gap-2 text-wood-800">
          <input
            type="radio"
            name="shelf"
            checked={shelfId === ""}
            onChange={() => setShelfId("")}
            className="h-4 w-4 border-wood-400/60 text-forest-600"
          />
          Surprise me
        </label>
        {shelves.map((shelf) => (
          <label key={shelf.id} className="flex items-center gap-2 text-wood-800">
            <input
              type="radio"
              name="shelf"
              checked={shelfId === shelf.id}
              onChange={() => setShelfId(shelf.id)}
              className="h-4 w-4 border-wood-400/60 text-forest-600"
            />
            {shelf.name}
          </label>
        ))}
      </fieldset>
      <div>
        <Button type="button" onClick={submit} disabled={isPending}>
          {isPending ? "Finding…" : "Find me something"}
        </Button>
      </div>
      {empty ? (
        <p className="text-sm text-wood-500">
          Nothing eligible turned up right now — try a different shelf, or check back
          later.
        </p>
      ) : null}
    </div>
  );
}
