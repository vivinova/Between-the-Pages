import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

const PUBLIC_NAV_ITEMS = [{ href: "/library", label: "Library" }];

const AUTHENTICATED_NAV_ITEMS = [
  { href: "/today", label: "Today" },
  { href: "/journal", label: "Journal" },
  { href: "/library", label: "Library" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/inbox", label: "Inbox" },
  { href: "/settings", label: "Settings" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("reduced_motion").eq("id", user.id).maybeSingle()
    : { data: null };

  const navItems = user ? AUTHENTICATED_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  return (
    <div
      className="min-h-screen bg-cream-100"
      data-reduced-motion={profile?.reduced_motion ? "true" : undefined}
    >
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="border-b border-wood-400/30 bg-cream-50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link href={user ? "/today" : "/"} className="font-serif text-lg text-wood-900">
            Between the Pages
          </Link>
          <nav aria-label="Primary" className="flex flex-wrap gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-wood-700 hover:bg-wood-400/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-wood-600">{user.email}</span>
                <form action={signOut}>
                  <Button type="submit" variant="ghost">
                    Sign out
                  </Button>
                </form>
              </>
            ) : (
              <LinkButton href="/login" variant="ghost">
                Sign in
              </LinkButton>
            )}
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-10">
        {children}
      </main>
      <footer className="border-t border-wood-400/20 px-4 py-6 text-center text-xs text-wood-500">
        Between the Pages is a peer reflection space, not therapy or emergency support.{" "}
        <Link href="/support" className="underline">
          Support resources
        </Link>
      </footer>
    </div>
  );
}
