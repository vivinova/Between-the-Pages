import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confess" };

// Real submission form (category, body, optional email) lands in Phase 2.
export default function ConfessPage() {
  return (
    <div className="text-center text-wood-600">
      <h1 className="font-serif text-2xl text-wood-900">Leave a confession</h1>
      <p className="mt-2">Coming soon.</p>
    </div>
  );
}
