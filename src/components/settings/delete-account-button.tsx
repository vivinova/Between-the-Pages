"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "@/lib/actions/account";
import { Button } from "@/components/ui/button";

const CONFIRM_TEXT = "DELETE";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button type="button" variant="ghost" className="text-burgundy-600" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
    );
  }

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount();
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-burgundy-500/40 bg-burgundy-500/10 p-4">
      <p className="text-sm text-burgundy-700">
        This permanently deletes your account: every journal entry, every passage
        you&apos;ve left in the library, your bookmarks, and your responses. This
        cannot be undone.
      </p>
      <label className="text-sm text-wood-700">
        Type <strong>{CONFIRM_TEXT}</strong> to confirm.
        <input
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          className="mt-1 block w-full rounded-md border border-wood-400/40 bg-cream-50 px-2 py-1"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-burgundy-600">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          className="border-burgundy-500 text-burgundy-600"
          disabled={confirmText !== CONFIRM_TEXT || isPending}
          onClick={confirm}
        >
          {isPending ? "Deleting…" : "Permanently delete my account"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
