import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickLibraryBook } from "@/lib/actions/library";
import { Button } from "@/components/ui/button";

export default async function ShelfEntryPage({ params }: { params: { slug: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: shelf } = await supabase
    .from("shelves")
    .select("id, name")
    .eq("slug", params.slug)
    .eq("is_hidden", false)
    .maybeSingle();

  if (!shelf) {
    notFound();
  }

  const result = await pickLibraryBook({ shelfId: shelf.id });

  if ("empty" in result) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 text-center">
        <h1 className="font-serif text-2xl text-wood-900">{shelf.name}</h1>
        <p className="text-wood-600">
          There&apos;s nothing eligible on this shelf for you right now — check back
          later, or try another shelf.
        </p>
        <div>
          <Link href="/library">
            <Button variant="secondary">Back to the library</Button>
          </Link>
        </div>
      </div>
    );
  }

  redirect(`/library/books/${result.id}?from=shelf&shelf=${shelf.id}`);
}
