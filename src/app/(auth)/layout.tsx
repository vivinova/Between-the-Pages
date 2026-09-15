import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-wood-800 px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center font-serif text-xl text-cream-100"
        >
          Between the Pages
        </Link>
        <div className="rounded-lg border border-wood-500/40 bg-cream-50 p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
