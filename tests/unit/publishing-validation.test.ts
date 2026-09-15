import { describe, expect, it } from "vitest";
import { submitBookSchema } from "@/lib/validation/publishing";

const validInput = {
  sourceEntryId: "550e8400-e29b-41d4-a716-446655440000",
  excerptText: "A short passage for the library.",
  shelfId: "550e8400-e29b-41d4-a716-446655440001",
  labels: ["grief_death"] as const,
  allowMarginNotes: true,
  notesVisibleToReaders: false,
  confirmedPrivacy: true as const,
  confirmedAnonymous: true as const,
};

describe("submitBookSchema", () => {
  it("accepts a valid submission", () => {
    expect(submitBookSchema.safeParse(validInput).success).toBe(true);
  });

  it("rejects an excerpt over 500 characters", () => {
    const result = submitBookSchema.safeParse({
      ...validInput,
      excerptText: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty excerpt", () => {
    const result = submitBookSchema.safeParse({ ...validInput, excerptText: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects when the privacy confirmation is missing", () => {
    const result = submitBookSchema.safeParse({
      ...validInput,
      confirmedPrivacy: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects when the anonymous confirmation is missing", () => {
    const result = submitBookSchema.safeParse({
      ...validInput,
      confirmedAnonymous: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects notes visible to readers when margin notes are not allowed", () => {
    const result = submitBookSchema.safeParse({
      ...validInput,
      allowMarginNotes: false,
      notesVisibleToReaders: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid content label", () => {
    const result = submitBookSchema.safeParse({
      ...validInput,
      labels: ["not_a_real_label"],
    });
    expect(result.success).toBe(false);
  });
});
