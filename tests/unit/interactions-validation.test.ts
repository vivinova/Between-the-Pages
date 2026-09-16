import { describe, expect, it } from "vitest";
import { marginNoteSchema } from "@/lib/validation/interactions";
import { reportInteractionSchema } from "@/lib/validation/library";

describe("marginNoteSchema", () => {
  it("accepts a short note", () => {
    const result = marginNoteSchema.safeParse({
      bookId: "550e8400-e29b-41d4-a716-446655440000",
      noteText: "I have felt this too.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty note", () => {
    const result = marginNoteSchema.safeParse({
      bookId: "550e8400-e29b-41d4-a716-446655440000",
      noteText: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a note over 240 characters", () => {
    const result = marginNoteSchema.safeParse({
      bookId: "550e8400-e29b-41d4-a716-446655440000",
      noteText: "x".repeat(241),
    });
    expect(result.success).toBe(false);
  });
});

describe("reportInteractionSchema", () => {
  it("accepts a valid interaction report", () => {
    const result = reportInteractionSchema.safeParse({
      interactionId: "550e8400-e29b-41d4-a716-446655440000",
      reason: "spam",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a malformed interaction id", () => {
    const result = reportInteractionSchema.safeParse({
      interactionId: "not-a-uuid",
      reason: "spam",
    });
    expect(result.success).toBe(false);
  });
});
