import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Moderation overview" };

export default async function AdminOverviewPage() {
  // The admin layout has already verified the caller is a moderator/admin.
  // Reads here use the admin client because pending/unpublished content is
  // invisible under the normal RLS policies even to a moderator's own
  // session — RLS grants read access by ownership or published state, not
  // by role. See src/lib/admin/require-role.ts for the actual auth check.
  const supabase = createAdminClient();

  const [{ count: pendingBooks }, { count: pendingNotes }, { count: openReports }] =
    await Promise.all([
      supabase
        .from("books")
        .select("id", { count: "exact", head: true })
        .eq("moderation_state", "pending_review"),
      supabase
        .from("interactions")
        .select("id", { count: "exact", head: true })
        .eq("type", "margin_note")
        .eq("moderation_state", "pending_review"),
      supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .in("review_state", ["open", "escalated"]),
    ]);

  const cards = [
    { label: "Books awaiting review", count: pendingBooks ?? 0, href: "/admin/books" },
    { label: "Margin notes awaiting review", count: pendingNotes ?? 0, href: "/admin/notes" },
    { label: "Open reports", count: openReports ?? 0, href: "/admin/reports" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl text-cream-100">Moderation overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-wood-500/40 bg-cream-50 p-6 hover:bg-cream-200"
          >
            <p className="text-3xl font-serif text-wood-900">{card.count}</p>
            <p className="mt-1 text-sm text-wood-600">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
