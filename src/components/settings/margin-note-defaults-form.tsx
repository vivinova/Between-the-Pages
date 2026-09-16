"use client";

import { useState, useTransition } from "react";
import { updateMarginNoteDefaults } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";

interface MarginNoteDefaultsFormProps {
  initialAllow: boolean;
  initialVisible: boolean;
}

export function MarginNoteDefaultsForm({ initialAllow, initialVisible }: MarginNoteDefaultsFormProps) {
  const [allow, setAllow] = useState(initialAllow);
  const [visible, setVisible] = useState(initialVisible);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    setSaved(false);
    startTransition(async () => {
      const result = await updateMarginNoteDefaults({
        defaultAllowMarginNotes: allow,
        defaultNotesVisibleToReaders: visible,
      });
      if (!result.error) setSaved(true);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-wood-600">
        Starting point for new passages you publish — you can still change it per
        passage when you submit.
      </p>
      <label className="flex items-center gap-2 text-wood-800">
        <input
          type="checkbox"
          checked={allow}
          onChange={(event) => {
            setAllow(event.target.checked);
            if (!event.target.checked) setVisible(false);
          }}
          className="h-4 w-4 rounded border-wood-400/60 text-forest-600"
        />
        Accept margin notes by default
      </label>
      <label className={`flex items-center gap-2 pl-6 ${allow ? "text-wood-800" : "text-wood-400"}`}>
        <input
          type="checkbox"
          checked={visible}
          disabled={!allow}
          onChange={(event) => setVisible(event.target.checked)}
          className="h-4 w-4 rounded border-wood-400/60 text-forest-600"
        />
        Approved notes visible to future readers by default
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
