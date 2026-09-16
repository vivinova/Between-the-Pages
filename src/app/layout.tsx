import type { Metadata } from "next";
import Link from "next/link";
import { passageFont, uiFont } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Between the Pages",
    template: "%s — Between the Pages",
  },
  description:
    "An anonymous confession board — say what you can't say elsewhere, sorted by category, no account required.",
};

const NAV_ITEMS = [
  { href: "/categories", label: "Browse" },
  { href: "/confess", label: "Confess" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${passageFont.variable} ${uiFont.variable}`}>
      <body className="flex min-h-screen flex-col bg-cream-100 font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <header className="border-b border-wood-400/30 bg-cream-50">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <Link href="/" className="font-serif text-lg text-wood-900">
              Between the Pages
            </Link>
            <nav aria-label="Primary" className="flex flex-wrap gap-1">
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
          </div>
        </header>
        <main id="main-content" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          {children}
        </main>
        <footer className="border-t border-wood-400/20 px-4 py-6 text-center text-xs text-wood-500">
          This board is anonymous peer confession, not therapy or emergency support.{" "}
          <Link href="/support" className="underline">
            Support resources
          </Link>
        </footer>
      </body>
    </html>
  );
}
