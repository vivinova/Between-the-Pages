import type { Metadata } from "next";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl text-wood-900">The Library</h1>
      <p className="text-wood-600">
        Shelves of anonymous passages, open to browse without an account, will live here.
        Coming in Phase 4.
      </p>
    </div>
  );
}
