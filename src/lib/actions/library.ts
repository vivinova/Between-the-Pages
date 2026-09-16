"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getReaderExclusions, sanitizeUuidList } from "@/lib/library";
import { pickRandom } from "@/lib/random";

const CANDIDATE_POOL_SIZE = 15;

export type PickBookResult = { id: string } | { empty: true };

interface PickLibraryBookInput {
  shelfId?: string;
  excludeOwn?: boolean;
  excludeIds?: string[];
}

/**
 * The single source of "which book should this reader see next" — used for
 * entering a shelf, Find me something, and "read/find another". Eligible
 * candidates are ordered by view_count ascending and capped to a small
 * pool, then one is picked at random from that pool: a simple, explainable
 * approximation of "prioritize books with fewer views" without needing
 * weighted random sampling in SQL.
 */
export async function pickLibraryBook(input: PickLibraryBookInput): Promise<PickBookResult> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { blockedLabels, reportedBookIds } = await getReaderExclusions(
    supabase,
    user?.id ?? null,
  );

  let query = supabase
    .from("books")
    .select("id")
    .eq("moderation_state", "published")
    .order("view_count", { ascending: true })
    .limit(CANDIDATE_POOL_SIZE);

  if (input.shelfId) {
    query = query.eq("shelf_id", input.shelfId);
  }
  if (input.excludeOwn && user) {
    query = query.neq("owner_id", user.id);
  }
  if (blockedLabels.length > 0) {
    query = query.not("labels", "ov", `{${blockedLabels.join(",")}}`);
  }

  const excludeIds = sanitizeUuidList([...(input.excludeIds ?? []), ...reportedBookIds]);
  if (excludeIds.length > 0) {
    query = query.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data } = await query;
  const picked = pickRandom(data ?? []);
  return picked ? { id: picked.id } : { empty: true };
}
