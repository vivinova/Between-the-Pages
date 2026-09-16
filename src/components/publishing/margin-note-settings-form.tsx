"use client";

import { useState, useTransition } from "react";
import { updateBookMarginNoteSettings } from "@/lib/actions/books";
import { Button } from "@/components/ui/button";

interface MarginNoteSettingsFormProps {
  bookId: string;
  initialAllowMarginNotes: boolean;
  initialNotesVisibleToReaders: boolean;
}

export function MarginNoteSettingsForm({
  bookId,
  initialAllowMarginNotes,
  initialNotesVisibleToReaders,
}: MarginNoteSettingsFormProps) {
  const [allowMarginNotes, setAllowMarginNotes] = useState(initialAllowMarginNotes);
  const [notesVisibleToReaders, setNotesVisibleToReaders] = useState(initialNotesVisibleToReaders);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      const result = await updateBookMarginNoteSettings(bookId, {
        allowMarginNotes,
        notesVisibleToReaders,
      });
      if (!result.error) setSaved(true);
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-wood-400/20 bg-cream-50 p-4">
      <label className="flex items-center gap-2 text-wood-800">
        <input
          type="checkbox"
          checked={allowMarginNotes}
          onChange={(event) => {
            setAllowMarginNotes(event.target.checked);
            if (!event.target.checked) setNotesVisibleToReaders(false);
          }}
          className="h-4 w-4 rounded border-wood-400/60 text-forest-600"
        />
        Accept new margin notes
      </label>
      <label className={`flex items-center gap-2 pl-6 ${allowMarginNotes ? "text-wood-800" : "text-wood-400"}`}>
        <input
          type="checkbox"
          checked={notesVisibleToReaders}
          disabled={!allowMarginNotes}
          onChange={(event) => setNotesVisibleToReaders(event.target.checked)}
          className="h-4 w-4 rounded border-wood-400/60 text-forest-600"
        />
        Newly approved notes are visible to future readers by default
      </label>
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" disabled={isPending} onClick={save}>
          {isPending ? "Saving…" : "Save"}
        </Button>
        {saved ? <span className="text-sm text-forest-700">Saved</span> : null}
      </div>
    </div>
  );
}
