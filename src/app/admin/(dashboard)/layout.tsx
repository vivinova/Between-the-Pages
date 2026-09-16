import Link from "next/link";
import { logoutAdmin } from "@/lib/actions/admin-auth";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/confessions", label: "Confessions" },
  { href: "/admin/replies", label: "Replies" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/history", label: "History" },
];

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-wood-400/30 pb-4">
        <nav aria-label="Moderator" className="flex flex-wrap gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-wood-700 hover:bg-wood-400/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAdmin}>
          <Button type="submit" variant="ghost">
            Sign out
          </Button>
        </form>
      </div>
      {children}
    </div>
  );
}
