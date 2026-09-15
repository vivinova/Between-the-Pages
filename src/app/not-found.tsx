import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-100 px-4 text-center">
      <h1 className="font-serif text-3xl text-wood-900">This page isn&apos;t here.</h1>
      <p className="text-wood-600">
        It may have been moved, removed, or it never belonged to you.
      </p>
      <Link href="/" className="font-medium text-dusk-700 underline">
        Return home
      </Link>
    </div>
  );
}
