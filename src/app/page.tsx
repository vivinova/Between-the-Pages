import { LinkButton } from "@/components/ui/link-button";

export default function HomePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 text-center">
      <div className="max-w-lg">
        <h1 className="font-serif text-4xl text-wood-900">Between the Pages</h1>
        <p className="mt-4 text-wood-600">
          Say what you can&apos;t say elsewhere. No account, no name, no trace back to
          you — just a category and whatever you need to admit.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <LinkButton href="/confess" variant="primary">
          Leave a confession
        </LinkButton>
        <LinkButton href="/categories" variant="secondary">
          Browse confessions
        </LinkButton>
      </div>
    </div>
  );
}
