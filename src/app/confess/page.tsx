import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ConfessForm } from "@/components/confess/confess-form";

export const metadata: Metadata = { title: "Confess" };
export const dynamic = "force-dynamic";

export default async function ConfessPage() {
  const supabase = createServerSupabaseClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug, name")
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-2xl text-wood-900">Leave a confession</h1>
        <p className="mt-2 text-wood-600">
          No account, no name attached. Choose a category and say what you need to say.
        </p>
      </div>
      <ConfessForm categories={categories ?? []} />
    </div>
  );
}
