import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

async function getCategory(slug: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, description")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await getCategory(params.slug);
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategory(params.slug);
  if (!category) {
    notFound();
  }

  const supabase = createServerSupabaseClient();
  const { data: confessions } = await supabase
    .from("public_confessions")
    .select("id, body_text, created_at")
    .eq("category_id", category.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div>
      <div className="mb-8">
        <Link href="/categories" className="text-sm text-dusk-700 underline">
          ← All categories
        </Link>
        <h1 className="mt-2 font-serif text-2xl text-wood-900">{category.name}</h1>
        <p className="mt-1 text-wood-600">{category.description}</p>
      </div>

      {confessions && confessions.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {confessions.map((confession) => (
            <li key={confession.id}>
              <Link
                href={`/confessions/${confession.id}`}
                className="block rounded-md border border-wood-400/30 bg-cream-50 p-4 transition-colors hover:bg-wood-400/10"
              >
                <p className="whitespace-pre-wrap font-serif text-wood-800">
                  {truncate(confession.body_text, 220)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-wood-600">
          Nothing here yet. Be the first to{" "}
          <Link href="/confess" className="underline">
            leave a confession
          </Link>{" "}
          in this category.
        </p>
      )}
    </div>
  );
}
