"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { CONTENT_LABELS } from "@/lib/content-labels";
import { checkForPossiblePii } from "@/lib/moderation/pii";
import { checkForCrisisLanguage } from "@/lib/moderation/crisis";
import { CrisisResourceNotice } from "@/components/support/crisis-resource-notice";
import { submitBook, type SubmitBookResult } from "@/lib/actions/books";
import type { ContentLabel } from "@/lib/supabase/types";

type Step = "compose" | "preview" | "classify" | "confirm" | "result";

interface Shelf {
  id: string;
  name: string;
}

interface ShareFlowProps {
  entryId: string;
  shelves: Shelf[];
  defaultAllowMarginNotes?: boolean;
  defaultNotesVisibleToReaders?: boolean;
}

export function ShareFlow({
  entryId,
  shelves,
  defaultAllowMarginNotes = true,
  defaultNotesVisibleToReaders = false,
}: ShareFlowProps) {
  const [step, setStep] = useState<Step>("compose");
  const [excerptText, setExcerptText] = useState("");
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [piiAcknowledged, setPiiAcknowledged] = useState(false);
  const [shelfId, setShelfId] = useState<string>(shelves[0]?.id ?? "");
  const [labels, setLabels] = useState<ContentLabel[]>([]);
  const [allowMarginNotes, setAllowMarginNotes] = useState(defaultAllowMarginNotes);
  const [notesVisibleToReaders, setNotesVisibleToReaders] = useState(
    defaultAllowMarginNotes && defaultNotesVisibleToReaders,
  );
  const [anonymousConfirmed, setAnonymousConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitBookResult | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();

  useEffect(() => {
    const key = `bpp:passage-draft:${entryId}`;
    const draft = window.sessionStorage.getItem(key);
    if (draft) {
      setExcerptText(draft);
      window.sessionStorage.removeItem(key);
    }
  }, [entryId]);

  const piiCheck = useMemo(() => checkForPossiblePii(excerptText), [excerptText]);
  const hasCrisisLanguage = useMemo(() => checkForCrisisLanguage(excerptText), [excerptText]);

  const toggleLabel = (label: ContentLabel) => {
    setLabels((current) =>
      current.includes(label) ? current.filter((l) => l !== label) : [...current, label],
    );
  };

  const handleSubmit = () => {
    setSubmitError(null);
    startSubmitTransition(async () => {
      const response = await submitBook({
        sourceEntryId: entryId,
        excerptText,
        shelfId,
        labels,
        allowMarginNotes,
        notesVisibleToReaders,
        confirmedPrivacy: true,
        confirmedAnonymous: true,
      });
      if (!response.ok) {
        setSubmitError(response.error);
        return;
      }
      setResult(response);
      setStep("result");
    });
  };

  if (step === "result" && result?.ok) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-serif text-2xl text-wood-900">
          {result.state === "published" ? "Your passage is in the library." : "Your passage was submitted."}
        </h1>
        <p className="text-wood-700">
          {result.state === "published"
            ? "It's now anonymous and visible to readers browsing the shelf you chose."
            : "It's awaiting review before it becomes visible. Publication isn't always immediate — you'll be able to check its status any time."}
        </p>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/journal/passages" variant="primary">
            View your passages
          </LinkButton>
          <LinkButton href="/journal" variant="secondary">
            Back to journal
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-wood-900">Leave a passage</h1>
        <Link href={`/journal/${entryId}`} className="text-sm font-medium text-dusk-700 underline">
          Cancel
        </Link>
      </div>
      <p className="text-sm text-wood-600">
        Nothing here is shared until you confirm on the last step. Your journal entry is
        never affected by canceling.
      </p>

      {step === "compose" ? (
        <div className="flex flex-col gap-3">
          <label htmlFor="excerpt" className="font-medium text-wood-700">
            Choose or write what will become public
          </label>
          <textarea
            id="excerpt"
            value={excerptText}
            onChange={(event) => setExcerptText(event.target.value.slice(0, 500))}
            rows={6}
            placeholder="Up to 500 characters — a line, a passage, or something written fresh."
            className="resize-y rounded-md border border-wood-400/30 bg-cream-50 p-4 font-serif text-lg leading-relaxed text-wood-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusk-600"
          />
          <span className="text-sm text-wood-500">{excerptText.length} / 500 characters</span>
          <div>
            <Button
              type="button"
              onClick={() => setStep("preview")}
              disabled={excerptText.trim().length === 0}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === "preview" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-wood-700">
            This is exactly what will become public — nothing else from your entry.
          </p>
          <div className="rounded-lg border border-wood-400/30 bg-cream-50 p-6 font-serif text-lg leading-relaxed text-wood-900 shadow-sm">
            {excerptText}
          </div>

          {piiCheck.hasPossibleMatch ? (
            <div className="rounded-md border border-burgundy-500/40 bg-burgundy-500/10 p-4">
              <p className="text-sm text-burgundy-700">
                This might contain a name, place, email address, or phone number. Consider
                revising it before sharing — this passage will be anonymous, but only the
                text you choose to remove is actually removed.
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm text-wood-700">
                <input
                  type="checkbox"
                  checked={piiAcknowledged}
                  onChange={(event) => setPiiAcknowledged(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-wood-400/60 text-forest-600"
                />
                I&apos;ve reviewed this and want to continue as written.
              </label>
            </div>
          ) : null}

          {hasCrisisLanguage ? <CrisisResourceNotice /> : null}

          <label className="flex items-start gap-2 text-sm text-wood-700">
            <input
              type="checkbox"
              checked={privacyConfirmed}
              onChange={(event) => setPrivacyConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-wood-400/60 text-forest-600"
            />
            I understand the rest of my journal entry stays private — only the text above
            will be shared.
          </label>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("compose")}>
              Edit passage
            </Button>
            <Button
              type="button"
              onClick={() => setStep("classify")}
              disabled={!privacyConfirmed || (piiCheck.hasPossibleMatch && !piiAcknowledged)}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === "classify" ? (
        <div className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="font-medium text-wood-700">Choose a shelf</legend>
            {shelves.map((shelf) => (
              <label key={shelf.id} className="flex items-center gap-2 text-wood-800">
                <input
                  type="radio"
                  name="shelf"
                  value={shelf.id}
                  checked={shelfId === shelf.id}
                  onChange={() => setShelfId(shelf.id)}
                  className="h-4 w-4 border-wood-400/60 text-forest-600"
                />
                {shelf.name}
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="font-medium text-wood-700">
              Content warnings (choose any that apply)
            </legend>
            {CONTENT_LABELS.map((label) => (
              <label key={label.value} className="flex items-center gap-2 text-wood-800">
                <input
                  type="checkbox"
                  checked={labels.includes(label.value)}
                  onChange={() => toggleLabel(label.value)}
                  className="h-4 w-4 rounded border-wood-400/60 text-forest-600"
                />
                {label.name}
              </label>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="font-medium text-wood-700">Reader responses</legend>
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
              Allow readers to write margin notes
            </label>
            <label
              className={`flex items-center gap-2 pl-6 ${allowMarginNotes ? "text-wood-800" : "text-wood-400"}`}
            >
              <input
                type="checkbox"
                checked={notesVisibleToReaders}
                onChange={(event) => setNotesVisibleToReaders(event.target.checked)}
                disabled={!allowMarginNotes}
                className="h-4 w-4 rounded border-wood-400/60 text-forest-600"
              />
              Let approved notes be seen by future readers, not just me
            </label>
          </fieldset>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("preview")}>
              Back
            </Button>
            <Button type="button" onClick={() => setStep("confirm")} disabled={!shelfId}>
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === "confirm" ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-wood-400/30 bg-cream-50 p-6 font-serif text-lg leading-relaxed text-wood-900 shadow-sm">
            {excerptText}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-wood-700">
            <dt className="font-medium">Shelf</dt>
            <dd>{shelves.find((s) => s.id === shelfId)?.name}</dd>
            <dt className="font-medium">Content warnings</dt>
            <dd>
              {labels.length > 0
                ? labels
                    .map((l) => CONTENT_LABELS.find((c) => c.value === l)?.name)
                    .join(", ")
                : "None selected"}
            </dd>
            <dt className="font-medium">Margin notes</dt>
            <dd>
              {allowMarginNotes
                ? notesVisibleToReaders
                  ? "Allowed, visible to future readers once approved"
                  : "Allowed, visible only to you once approved"
                : "Not allowed"}
            </dd>
          </dl>
          <p className="text-sm text-wood-600">
            This passage will be published anonymously — your name, email, and journal
            date are never shown. It will remain hidden until it passes moderation, which
            isn&apos;t always immediate.
          </p>
          <label className="flex items-start gap-2 text-sm text-wood-700">
            <input
              type="checkbox"
              checked={anonymousConfirmed}
              onChange={(event) => setAnonymousConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-wood-400/60 text-forest-600"
            />
            I confirm this passage will be shared anonymously.
          </label>
          {submitError ? (
            <p role="alert" className="text-sm text-burgundy-600">
              {submitError}
            </p>
          ) : null}
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep("classify")}>
              Back
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!anonymousConfirmed || isSubmitting}
            >
              {isSubmitting ? "Submitting…" : "Submit for moderation"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
