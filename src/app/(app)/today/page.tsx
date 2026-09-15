import type { Metadata } from "next";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl text-wood-900">Today</h1>
      <p className="text-wood-600">
        Your daily prompt and a place to start writing will live here. Coming in Phase 2.
      </p>
    </div>
  );
}
