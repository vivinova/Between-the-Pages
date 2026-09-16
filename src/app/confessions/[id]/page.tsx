import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DeleteConfessionButton } from "@/components/confess/delete-confession-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Confession" };

export default async function ConfessionPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  const { data: confession } = await supabase
    .from("public_confessions")
    .select("id, category_id, body_text")
    .eq("id", params.id)
    .maybeSingle();

  if (!confession) {
    notFound();
  }

  const { data: category } = await supabase
    .from("categories")
    .select("slug, name")
    .eq("id", confession.category_id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-xl">
      {category ? (
        <Link
          href={`/categories/${category.slug}`}
          className="text-sm text-dusk-700 underline"
        >
          {category.name}
        </Link>
      ) : null}
      <blockquote className="mt-3 whitespace-pre-wrap rounded-md border border-wood-400/30 bg-cream-50 p-6 font-serif text-lg text-wood-900">
        {confession.body_text}
      </blockquote>
      <DeleteConfessionButton confessionId={confession.id} />
    </div>
  );
}
