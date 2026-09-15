import { describe, expect, it } from "vitest";
import { pickFeaturedPrompt, type Prompt } from "@/lib/prompts";

const prompts: Prompt[] = [
  { id: "a", prompt_text: "A", theme: null, active_date: null },
  { id: "b", prompt_text: "B", theme: null, active_date: null },
  { id: "c", prompt_text: "C", theme: null, active_date: null },
];

describe("pickFeaturedPrompt", () => {
  it("returns null for an empty pool", () => {
    expect(pickFeaturedPrompt([], new Date("2026-01-01T00:00:00Z"))).toBeNull();
  });

  it("prefers a prompt explicitly pinned to today", () => {
    const pinned: Prompt[] = [
      ...prompts,
      { id: "z", prompt_text: "Pinned", theme: null, active_date: "2026-03-15" },
    ];
    const result = pickFeaturedPrompt(pinned, new Date("2026-03-15T12:00:00Z"));
    expect(result?.id).toBe("z");
  });

  it("is deterministic for the same day", () => {
    const day = new Date("2026-06-01T08:00:00Z");
    const first = pickFeaturedPrompt(prompts, day);
    const second = pickFeaturedPrompt(prompts, day);
    expect(first?.id).toBe(second?.id);
  });

  it("rotates across different days", () => {
    const results = new Set(
      Array.from({ length: prompts.length }, (_, i) =>
        pickFeaturedPrompt(prompts, new Date(Date.UTC(2026, 0, 1 + i)))?.id,
      ),
    );
    expect(results.size).toBeGreaterThan(1);
  });
});
