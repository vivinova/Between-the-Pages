import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FindForm } from "./find-form";

export const metadata: Metadata = { title: "Find me something" };

export default async function FindPage() {
  const supabase = createServerSupabaseClient();
  const { data: shelves } = await supabase
    .from("shelves")
    .select("id, name")
    .eq("is_hidden", false)
    .order("sort_order");

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-wood-900">Find me something</h1>
        <p className="mt-1 text-wood-600">
          Choose what you&apos;re looking for, or let the library choose for you.
        </p>
      </div>
      <FindForm shelves={shelves ?? []} />
    </div>
  );
}
