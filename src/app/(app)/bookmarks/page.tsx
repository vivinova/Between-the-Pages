import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bookmarks" };

export default function BookmarksPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl text-wood-900">Bookmarks</h1>
      <p className="text-wood-600">
        Books you&apos;ve privately saved will live here. Coming in Phase 4.
      </p>
    </div>
  );
}
