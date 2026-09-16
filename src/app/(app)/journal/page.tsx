import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q?.trim() ?? "";
  const supabase = createServerSupabaseClient();

  let request = supabase
    .from("journal_entries")
    .select("id, title, body, updated_at")
    .order("updated_at", { ascending: false });

  if (query) {
    const escaped = query.replace(/"/g, '\\"');
    const pattern = `%${escaped}%`;
    request = request.or(`title.ilike."${pattern}",body.ilike."${pattern}"`);
  }

  const { data: entries, error } = await request;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-serif text-3xl text-wood-900">Journal</h1>
        <div className="flex items-center gap-3">
          <Link href="/journal/passages" className="text-sm font-medium text-dusk-700 underline">
            Your passages in the library
          </Link>
          <LinkButton href="/journal/new" variant="primary">
            New entry
          </LinkButton>
        </div>
      </div>

      <form method="GET" action="/journal" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search your entries…"
          aria-label="Search journal entries"
          className="w-full max-w-sm rounded-md border border-wood-400/40 bg-cream-50 px-3 py-2 text-wood-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dusk-600"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {query ? (
          <LinkButton href="/journal" variant="ghost">
            Clear
          </LinkButton>
        ) : null}
      </form>

      {error ? (
        <p role="alert" className="text-burgundy-600">
          Your entries couldn&apos;t be loaded right now. Try refreshing the page.
        </p>
      ) : entries && entries.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/journal/${entry.id}`}
                className="block rounded-md border border-wood-400/30 bg-cream-50 px-4 py-3 hover:bg-cream-200"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-serif text-lg text-wood-900">
                    {entry.title || "Untitled entry"}
                  </span>
                  <span className="shrink-0 text-sm text-wood-500">
                    {new Date(entry.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-wood-600">{entry.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : query ? (
        <p className="text-wood-600">No entries match &ldquo;{query}&rdquo;.</p>
      ) : (
        <p className="text-wood-600">
          Nothing written yet.{" "}
          <Link href="/journal/new" className="font-medium text-dusk-700 underline">
            Start your first entry.
          </Link>
        </p>
      )}
    </div>
  );
}
