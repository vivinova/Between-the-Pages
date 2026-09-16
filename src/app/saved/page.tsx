"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedConfessions, unsaveConfession } from "@/lib/saved-confessions";

interface SavedEntry {
  id: string;
  preview: string;
  savedAt: string;
}

export default function SavedPage() {
  const [saved, setSaved] = useState<SavedEntry[] | null>(null);

  useEffect(() => {
    setSaved(getSavedConfessions());
  }, []);

  const handleRemove = (id: string) => {
    unsaveConfession(id);
    setSaved((prev) => (prev ?? []).filter((entry) => entry.id !== id));
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-serif text-2xl text-wood-900">Saved confessions</h1>
      <p className="mt-1 text-wood-600">
        Saved on this device only — there&apos;s no account to sync this across devices.
      </p>

      {saved === null ? null : saved.length === 0 ? (
        <p className="mt-6 text-wood-600">Nothing saved yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {saved.map((entry) => (
            <li
              key={entry.id}
              className="rounded-md border border-wood-400/30 bg-cream-50 p-4"
            >
              <Link href={`/confessions/${entry.id}`} className="font-serif text-wood-800">
                {entry.preview}
              </Link>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => handleRemove(entry.id)}
                  className="text-xs text-wood-500 underline hover:text-wood-700"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
