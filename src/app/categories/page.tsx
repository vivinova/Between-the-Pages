import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/link-button";

export const metadata: Metadata = { title: "Browse" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = createServerSupabaseClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-wood-900">Browse confessions</h1>
          <p className="mt-1 text-wood-600">Pick a category, or let one find you.</p>
        </div>
        <LinkButton href="/confessions/random" variant="secondary">
          Surprise me
        </LinkButton>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(categories ?? []).map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="rounded-md border border-wood-400/30 bg-cream-50 p-4 transition-colors hover:bg-wood-400/10"
          >
            <h2 className="font-serif text-lg text-wood-900">{category.name}</h2>
            <p className="mt-1 text-sm text-wood-600">{category.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
