import { beforeEach, describe, expect, it, vi } from "vitest";

const mockParse = vi.fn();

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { parse: mockParse },
  })),
}));

vi.mock("@/lib/env", () => ({
  env: { anthropicApiKey: () => "test-key" },
}));

const { anthropicModerationProvider } = await import("@/lib/moderation/anthropic-provider");

describe("anthropicModerationProvider", () => {
  beforeEach(() => {
    mockParse.mockReset();
  });

  it("is marked production-ready", () => {
    expect(anthropicModerationProvider.isProductionReady).toBe(true);
  });

  it("auto-approves text the classifier finds low-risk", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: { risk_level: "low", reasons: [] },
    });

    const result = await anthropicModerationProvider.checkContent(
      "some mornings feel lighter than others, and I am trying to notice them.",
      "confession",
    );

    expect(result.riskLevel).toBe("low");
    expect(result.requiresHumanReview).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it("routes content the classifier flags to human review", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: { risk_level: "flagged", reasons: ["sexual_content"] },
    });

    const result = await anthropicModerationProvider.checkContent("...", "reply");

    expect(result.riskLevel).toBe("flagged");
    expect(result.requiresHumanReview).toBe(true);
    expect(result.reasons).toContain("sexual_content");
  });

  it("still applies the deterministic PII check alongside the classifier", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: { risk_level: "low", reasons: [] },
    });

    const result = await anthropicModerationProvider.checkContent(
      "you can reach me at reader@example.com",
      "reply",
    );

    expect(result.requiresHumanReview).toBe(true);
    expect(result.reasons).toContain("possible_pii");
  });

  it("still applies the deterministic crisis-language check alongside the classifier", async () => {
    mockParse.mockResolvedValue({
      stop_reason: "end_turn",
      parsed_output: { risk_level: "low", reasons: [] },
    });

    const result = await anthropicModerationProvider.checkContent(
      "some days I think about wanting to end my life",
      "confession",
    );

    expect(result.requiresHumanReview).toBe(true);
    expect(result.reasons).toContain("possible_crisis_language");
  });

  it("fails closed to human review when the classifier refuses to respond", async () => {
    mockParse.mockResolvedValue({ stop_reason: "refusal", parsed_output: null });

    const result = await anthropicModerationProvider.checkContent("...", "confession");

    expect(result.requiresHumanReview).toBe(true);
    expect(result.reasons).toContain("flagged_by_safety_classifier");
  });

  it("fails closed to human review when the API call throws", async () => {
    mockParse.mockRejectedValue(new Error("network error"));

    const result = await anthropicModerationProvider.checkContent("...", "confession");

    expect(result.requiresHumanReview).toBe(true);
    expect(result.reasons).toContain("moderation_check_failed");
  });
});
