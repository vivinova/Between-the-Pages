import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-wood-800 px-4 py-16 text-center">
      <div className="max-w-lg">
        <h1 className="font-serif text-4xl text-cream-100">Between the Pages</h1>
        <p className="mt-4 text-cream-200">
          Keep the whole story for yourself. Leave one page for someone who may need
          it.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/signup">
          <Button variant="primary">Start your journal</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </div>
    </div>
  );
}
