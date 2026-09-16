import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Moderator overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  // Pending content and open reports are invisible under RLS to anyone,
  // including a signed-in moderator's own (nonexistent) session — there
  // are no accounts, so there's no session to have RLS visibility in the
  // first place. Every /admin read goes through the admin client.
  const admin = createAdminClient();
  const [{ count: pendingConfessions }, { count: pendingReplies }, { count: openReports }] =
    await Promise.all([
      admin
        .from("confessions")
        .select("id", { count: "exact", head: true })
        .eq("moderation_state", "pending_review"),
      admin
        .from("interactions")
        .select("id", { count: "exact", head: true })
        .eq("type", "reply")
        .eq("moderation_state", "pending_review"),
      admin
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("review_state", "open"),
    ]);

  const cards = [
    { href: "/admin/confessions", label: "Pending confessions", count: pendingConfessions ?? 0 },
    { href: "/admin/replies", label: "Pending replies", count: pendingReplies ?? 0 },
    { href: "/admin/reports", label: "Open reports", count: openReports ?? 0 },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl text-wood-900">Overview</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-md border border-wood-400/30 bg-cream-50 p-4 transition-colors hover:bg-wood-400/10"
          >
            <p className="text-3xl font-serif text-wood-900">{card.count}</p>
            <p className="mt-1 text-sm text-wood-600">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
