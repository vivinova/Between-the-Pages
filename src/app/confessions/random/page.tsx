import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickRandom } from "@/lib/random";

export const dynamic = "force-dynamic";

export default async function RandomConfessionPage() {
  const supabase = createServerSupabaseClient();
  const { data: confessions } = await supabase
    .from("public_confessions")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(50);

  const chosen = pickRandom(confessions ?? []);
  if (!chosen) {
    redirect("/categories");
  }
  redirect(`/confessions/${chosen.id}`);
}
