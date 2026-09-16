"use client";

import { useState, useTransition } from "react";
import { updateShelf } from "@/lib/actions/admin-content";
import { Button } from "@/components/ui/button";

interface ShelfRowProps {
  id: string;
  name: string;
  description: string | null;
  isHidden: boolean;
}

export function ShelfRow({ id, name: initialName, description: initialDescription, isHidden: initialHidden }: ShelfRowProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [isHidden, setIsHidden] = useState(initialHidden);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      const result = await updateShelf(id, { name, description, isHidden });
      if (!result.error) setSaved(true);
    });
  };

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-md border border-wood-400/30 bg-cream-50 p-3">
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="rounded-md border border-wood-400/40 bg-cream-50 px-2 py-1"
      />
      <input
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description"
        className="min-w-[12rem] flex-1 rounded-md border border-wood-400/40 bg-cream-50 px-2 py-1"
      />
      <label className="flex items-center gap-1 text-sm text-wood-700">
        <input
          type="checkbox"
          checked={isHidden}
          onChange={(event) => setIsHidden(event.target.checked)}
          className="h-4 w-4 rounded border-wood-400/60 text-forest-600"
        />
        Hidden
      </label>
      <Button type="button" variant="secondary" disabled={isPending} onClick={save}>
        {isPending ? "Saving…" : "Save"}
      </Button>
      {saved ? <span className="text-sm text-forest-700">Saved</span> : null}
    </li>
  );
}
