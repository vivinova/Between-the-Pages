import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { ShelfRow } from "@/components/admin/shelf-row";
import { NewShelfForm } from "@/components/admin/new-shelf-form";

export const metadata: Metadata = { title: "Shelves" };

export default async function AdminShelvesPage() {
  const supabase = createAdminClient();
  const { data: shelves } = await supabase.from("shelves").select("*").order("sort_order");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-2xl text-cream-100">Shelves</h1>
      <ul className="flex flex-col gap-2">
        {(shelves ?? []).map((shelf) => (
          <ShelfRow
            key={shelf.id}
            id={shelf.id}
            name={shelf.name}
            description={shelf.description}
            isHidden={shelf.is_hidden}
          />
        ))}
      </ul>
      <div>
        <h2 className="font-serif text-lg text-cream-100">Add a shelf</h2>
        <div className="mt-2">
          <NewShelfForm />
        </div>
      </div>
    </div>
  );
}
