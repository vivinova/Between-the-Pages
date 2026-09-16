import type { Metadata } from "next";

export const metadata: Metadata = { title: "Browse" };

// Real category grid + confession browsing lands in Phase 2.
export default function CategoriesPage() {
  return (
    <div className="text-center text-wood-600">
      <h1 className="font-serif text-2xl text-wood-900">Browse confessions</h1>
      <p className="mt-2">Coming soon.</p>
    </div>
  );
}
