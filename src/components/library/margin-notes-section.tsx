"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteMarginNote,
  submitMarginNote,
  updateMarginNote,
} from "@/lib/actions/margin-notes";
import { reportInteraction } from "@/lib/actions/reports";
import { Button } from "@/components/ui/button";
import type { InteractionModerationState, ReportReason } from "@/lib/supabase/types";

const SUGGESTED_PROMPTS = [
  "I have felt this too.",
  "I'm glad you left this here.",
  "What I wish I could tell you is…",
  "Your words reminded me…",
  "Someone out here understands.",
];

interface VisibleNote {
  id: string;
  note_text: string;
}

interface OwnNote {
  id: string;
  note_text: string;
  moderation_state: InteractionModerationState;
}

interface MarginNotesSectionProps {
  bookId: string;
  allowMarginNotes: boolean;
  signedIn: boolean;
  visibleNotes: VisibleNote[];
  ownNote: OwnNote | null;
}

export function MarginNotesSection({
  bookId,
  allowMarginNotes,
  signedIn,
  visibleNotes,
  ownNote,
}: MarginNotesSectionProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-serif text-lg text-wood-900">Margin notes</h2>

      {visibleNotes.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {visibleNotes.map((note) => (
            <VisibleNoteCard key={note.id} id={note.id} text={note.note_text} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-wood-500">No margin notes are visible here yet.</p>
      )}

      {!allowMarginNotes ? (
        <p className="text-sm text-wood-500">
          This contributor isn&apos;t accepting margin notes right now.
        </p>
      ) : !signedIn ? (
        <Link href="/login" className="text-sm font-medium text-dusk-700 underline">
          Sign in to leave a margin note
        </Link>
      ) : ownNote ? (
        <OwnNoteCard note={ownNote} onChanged={() => router.refresh()} />
      ) : (
        <MarginNoteForm bookId={bookId} onSubmitted={() => router.refresh()} />
      )}
    </div>
  );
}

function VisibleNoteCard({ id, text }: { id: string; text: string }) {
  const [reported, setReported] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState<ReportReason>("harassment");
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-md border border-wood-400/20 bg-cream-50 p-3">
      <p className="text-wood-800">{text}</p>
      <div className="mt-2 text-xs">
        {reported ? (
          <span className="text-wood-500">Reported</span>
        ) : open ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              className="rounded border border-wood-400/40 bg-cream-50 px-1 py-0.5 text-xs"
            >
              <option value="harassment">Harassment</option>
              <option value="hate_speech">Hate speech</option>
              <option value="personal_information">Personal information</option>
              <option value="spam">Spam</option>
              <option value="other">Something else</option>
            </select>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await reportInteraction({ interactionId: id, reason });
                  if (!result.error) setReported(true);
                })
              }
              className="text-dusk-700 underline"
            >
              Submit
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-wood-500 underline">
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="text-wood-500 underline">
            Report this note
          </button>
        )}
      </div>
    </li>
  );
}

function OwnNoteCard({ note, onChanged }: { note: OwnNote; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.note_text);
  const [isPending, startTransition] = useTransition();

  const statusLabel =
    note.moderation_state === "pending_review"
      ? "Awaiting review"
      : note.moderation_state === "published"
        ? "Approved"
        : "Not approved";

  const handleDelete = () => {
    startTransition(async () => {
      await deleteMarginNote(note.id);
      onChanged();
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateMarginNote(note.id, text);
      if (!result.error) {
        setEditing(false);
        onChanged();
      }
    });
  };

  return (
    <div className="rounded-md border border-forest-400/30 bg-forest-400/10 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-forest-700">
        Your note — {statusLabel}
      </p>
      {editing ? (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, 240))}
            rows={3}
            className="rounded-md border border-wood-400/30 bg-cream-50 p-2 text-wood-900"
          />
          <span className="text-xs text-wood-500">{text.length} / 240</span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={isPending} onClick={handleSave}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-1 text-wood-800">{note.note_text}</p>
          <div className="mt-2 flex gap-2 text-sm">
            {note.moderation_state === "pending_review" ? (
              <button type="button" onClick={() => setEditing(true)} className="text-dusk-700 underline">
                Edit
              </button>
            ) : null}
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="text-burgundy-600 underline"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function MarginNoteForm({ bookId, onSubmitted }: { bookId: string; onSubmitted: () => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<"published" | "pending_review" | null>(null);
  const [isPending, startTransition] = useTransition();

  if (submitted) {
    return (
      <p className="text-sm text-wood-700">
        {submitted === "published"
          ? "Your note is visible now."
          : "Your note was submitted and is awaiting review."}
      </p>
    );
  }

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await submitMarginNote({ bookId, noteText: text });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmitted(result.state);
      onSubmitted();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setText((current) => (current ? current : prompt))}
            className="rounded-full border border-wood-400/30 px-2 py-0.5 text-xs text-wood-600 hover:bg-wood-400/10"
          >
            {prompt}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value.slice(0, 240))}
        rows={3}
        placeholder="A short, gentle response…"
        className="rounded-md border border-wood-400/30 bg-cream-50 p-2 text-wood-900"
      />
      <span className="text-xs text-wood-500">{text.length} / 240</span>
      {error ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {error}
        </p>
      ) : null}
      <div>
        <Button type="button" disabled={isPending || text.trim().length === 0} onClick={submit}>
          {isPending ? "Submitting…" : "Submit note"}
        </Button>
      </div>
    </div>
  );
}
