import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentLabel, Database } from "@/lib/supabase/types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ReaderExclusions {
  blockedLabels: ContentLabel[];
  reportedBookIds: string[];
}

/**
 * What a given reader should never be shown: topics they've blocked in
 * Settings, and books they've already reported (unless that report was
 * dismissed). Anonymous visitors have neither.
 */
export async function getReaderExclusions(
  supabase: SupabaseClient<Database>,
  userId: string | null,
): Promise<ReaderExclusions> {
  if (!userId) {
    return { blockedLabels: [], reportedBookIds: [] };
  }

  const [{ data: profile }, { data: reports }] = await Promise.all([
    supabase.from("profiles").select("blocked_labels").eq("id", userId).maybeSingle(),
    supabase
      .from("reports")
      .select("book_id")
      .eq("reporter_id", userId)
      .neq("review_state", "dismissed")
      .not("book_id", "is", null),
  ]);

  return {
    blockedLabels: profile?.blocked_labels ?? [],
    reportedBookIds: (reports ?? [])
      .map((report) => report.book_id)
      .filter((id): id is string => id !== null),
  };
}

/** Only ever used to build a raw PostgREST filter value — never trust it otherwise. */
export function sanitizeUuidList(ids: string[]): string[] {
  return ids.filter((id) => UUID_PATTERN.test(id));
}
