import type { Metadata } from "next";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl text-wood-900">Journal</h1>
      <p className="text-wood-600">
        Your private entries, editable and searchable, will live here. Coming in Phase 2.
      </p>
    </div>
  );
}
