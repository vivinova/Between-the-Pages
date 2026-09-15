"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createJournalEntry, deleteJournalEntry, updateJournalEntry } from "@/lib/actions/journal";
import { Button } from "@/components/ui/button";

type SaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

interface EntryEditorProps {
  entryId: string | null;
  initialTitle: string;
  initialBody: string;
  promptId: string | null;
  promptText: string | null;
}

const AUTOSAVE_DELAY_MS = 1500;

export function EntryEditor({
  entryId,
  initialTitle,
  initialBody,
  promptId,
  promptText,
}: EntryEditorProps) {
  const [id, setId] = useState(entryId);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef({ id, title, body });
  latestRef.current = { id, title, body };

  const save = useCallback(async () => {
    const { id: currentId, title: currentTitle, body: currentBody } = latestRef.current;
    if (!currentTitle.trim() && !currentBody.trim()) {
      setStatus("idle");
      return;
    }

    setStatus("saving");
    setErrorMessage(null);

    if (currentId) {
      const result = await updateJournalEntry(currentId, { title: currentTitle, body: currentBody });
      if (result.error) {
        setStatus("error");
        setErrorMessage(result.error);
      } else {
        setStatus("saved");
      }
      return;
    }

    const result = await createJournalEntry({
      title: currentTitle,
      body: currentBody,
      promptId,
    });
    if (!result.ok) {
      setStatus("error");
      setErrorMessage(result.error);
      return;
    }

    setId(result.id);
    setStatus("saved");
    window.history.replaceState(null, "", `/journal/${result.id}`);
  }, [promptId]);

  const scheduleSave = useCallback(() => {
    setStatus("unsaved");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void save();
    }, AUTOSAVE_DELAY_MS);
  }, [save]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSaveNow = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    void save();
  };

  const handleDelete = () => {
    if (!id) return;
    startDeleteTransition(async () => {
      await deleteJournalEntry(id);
    });
  };

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-6">
      {promptText ? (
        <div className="rounded-md border border-forest-400/30 bg-forest-400/10 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-forest-700">
            Today&apos;s prompt
          </p>
          <p className="mt-1 font-serif text-wood-900">{promptText}</p>
        </div>
      ) : null}

      <input
        type="text"
        value={title}
        onChange={(event) => {
          setTitle(event.target.value);
          scheduleSave();
        }}
        placeholder="Untitled entry"
        aria-label="Entry title"
        className="border-none bg-transparent font-serif text-2xl text-wood-900 placeholder:text-wood-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dusk-600"
      />

      <textarea
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          scheduleSave();
        }}
        placeholder="Write whatever is true right now."
        aria-label="Entry body"
        rows={16}
        className="resize-y rounded-md border border-wood-400/30 bg-cream-50 p-4 font-serif text-lg leading-relaxed text-wood-900 placeholder:text-wood-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusk-600"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-wood-500">
        <span>
          {body.length.toLocaleString()} characters · {wordCount.toLocaleString()} words
        </span>
        <span role="status" aria-live="polite">
          {status === "saving" && "Saving…"}
          {status === "saved" && "Saved"}
          {status === "unsaved" && "Unsaved changes"}
          {status === "error" && (errorMessage ?? "Couldn't save")}
        </span>
      </div>

      <p className="text-sm text-wood-600">
        Only you can see this entry. It stays private unless you choose to leave a
        passage in the library.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleSaveNow} disabled={status === "saving"}>
          Save now
        </Button>
        <Link href="/journal">
          <Button type="button" variant="secondary">
            Done
          </Button>
        </Link>
        {id ? (
          <Link href={`/journal/${id}/share`}>
            <Button type="button" variant="ghost">
              Leave a passage in the library
            </Button>
          </Link>
        ) : null}
        <div className="ml-auto">
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-burgundy-600">Delete this entry?</span>
              <Button
                type="button"
                variant="secondary"
                className="border-burgundy-500 text-burgundy-600"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Yes, delete"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : id ? (
            <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(true)}>
              Delete entry
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
