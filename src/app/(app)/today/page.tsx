import type { Metadata } from "next";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { pickFeaturedPrompt } from "@/lib/prompts";
import { PromptCard } from "@/components/today/prompt-card";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: prompts }, { data: recentEntries }] = await Promise.all([
    supabase
      .from("prompts")
      .select("id, prompt_text, theme, active_date")
      .eq("status", "active"),
    user
      ? supabase
          .from("journal_entries")
          .select("id, title, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: null }),
  ]);

  const featured = pickFeaturedPrompt(prompts ?? [], new Date());

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-serif text-3xl text-wood-900">Today</h1>
        <p className="mt-1 text-wood-600">A quiet place to start, if you want one.</p>
      </div>

      <PromptCard prompts={prompts ?? []} featuredPromptId={featured?.id ?? null} />

      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl text-wood-900">Recent entries</h2>
          <Link href="/journal" className="text-sm font-medium text-dusk-700 underline">
            View all
          </Link>
        </div>
        {recentEntries && recentEntries.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2">
            {recentEntries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/journal/${entry.id}`}
                  className="block rounded-md border border-wood-400/30 bg-cream-50 px-4 py-3 hover:bg-cream-200"
                >
                  <span className="font-serif text-wood-900">
                    {entry.title || "Untitled entry"}
                  </span>
                  <span className="ml-2 text-sm text-wood-500">
                    {new Date(entry.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-wood-600">
            Nothing written yet. Your first entry will show up here.
          </p>
        )}
      </div>
    </div>
  );
}
