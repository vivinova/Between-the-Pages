export interface Prompt {
  id: string;
  prompt_text: string;
  theme: string | null;
  active_date: string | null;
}

/**
 * Picks today's featured prompt from the active pool.
 *
 * An admin can pin a specific prompt to a specific calendar date by setting
 * active_date; if one exists for `today`, it wins. Otherwise the pool
 * rotates deterministically by day-of-year, so there's always a featured
 * prompt even for a pool that's never been explicitly scheduled.
 */
export function pickFeaturedPrompt(prompts: Prompt[], today: Date): Prompt | null {
  if (prompts.length === 0) return null;

  const isoDate = today.toISOString().slice(0, 10);
  const pinned = prompts.find((prompt) => prompt.active_date === isoDate);
  if (pinned) return pinned;

  const startOfYear = Date.UTC(today.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((today.getTime() - startOfYear) / 86_400_000);

  const sorted = [...prompts].sort((a, b) => a.id.localeCompare(b.id));
  const index = dayOfYear % sorted.length;
  return sorted[index] ?? null;
}
