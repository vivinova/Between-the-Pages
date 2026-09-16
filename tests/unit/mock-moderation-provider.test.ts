import { describe, expect, it } from "vitest";
import { mockModerationProvider } from "@/lib/moderation/mock-provider";

describe("mockModerationProvider", () => {
  it("is explicitly marked as not production-ready", () => {
    expect(mockModerationProvider.isProductionReady).toBe(false);
  });

  it("flags crisis language for human review", async () => {
    const result = await mockModerationProvider.checkContent(
      "some days I think about wanting to end my life",
      "book_excerpt",
    );
    expect(result.requiresHumanReview).toBe(true);
    expect(result.riskLevel).toBe("flagged");
    expect(result.reasons).toContain("possible_crisis_language");
  });

  it("flags an email address for human review", async () => {
    const result = await mockModerationProvider.checkContent(
      "you can reach me at test@example.com",
      "book_excerpt",
    );
    expect(result.requiresHumanReview).toBe(true);
    expect(result.reasons).toContain("possible_pii");
  });

  it("auto-approves ordinary low-risk text", async () => {
    const result = await mockModerationProvider.checkContent(
      "some mornings feel lighter than others, and I am trying to notice them.",
      "book_excerpt",
    );
    expect(result.requiresHumanReview).toBe(false);
    expect(result.riskLevel).toBe("low");
    expect(result.reasons).toHaveLength(0);
  });

  it("applies the same checks to a margin note as to a book excerpt", async () => {
    const flagged = await mockModerationProvider.checkContent(
      "email me at reader@example.com",
      "margin_note",
    );
    expect(flagged.requiresHumanReview).toBe(true);

    const benign = await mockModerationProvider.checkContent(
      "I have felt this too.",
      "margin_note",
    );
    expect(benign.requiresHumanReview).toBe(false);
  });
});
