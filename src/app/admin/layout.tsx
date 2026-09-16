import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/books", label: "Books" },
  { href: "/admin/notes", label: "Margin notes" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/shelves", label: "Shelves" },
  { href: "/admin/prompts", label: "Prompts" },
  { href: "/admin/history", label: "History" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
    redirect("/today");
  }

  return (
    <div className="min-h-screen bg-wood-800">
      <header className="border-b border-wood-500/40 bg-wood-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href="/admin" className="font-serif text-lg text-cream-100">
            Moderation
          </Link>
          <nav aria-label="Moderation" className="flex flex-wrap gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-cream-200 hover:bg-wood-500/40"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/today" className="text-sm text-cream-200 underline">
            Back to the app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
    </div>
  );
}
