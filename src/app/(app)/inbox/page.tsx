import type { Metadata } from "next";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl text-wood-900">Inbox</h1>
      <p className="text-wood-600">
        Quiet acknowledgments from readers, with no public counts, will live here. Coming
        in Phase 5.
      </p>
    </div>
  );
}
