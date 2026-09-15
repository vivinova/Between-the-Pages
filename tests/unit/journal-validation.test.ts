import { describe, expect, it } from "vitest";
import { journalEntrySchema } from "@/lib/validation/journal";

describe("journalEntrySchema", () => {
  it("accepts a title, body, and prompt id", () => {
    const result = journalEntrySchema.safeParse({
      title: "A quiet morning",
      body: "Some private reflection.",
      promptId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an entry with no title and no prompt", () => {
    const result = journalEntrySchema.safeParse({ body: "Just writing." });
    expect(result.success).toBe(true);
  });

  it("rejects a title over 200 characters", () => {
    const result = journalEntrySchema.safeParse({
      title: "x".repeat(201),
      body: "Body text.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a body over 20,000 characters", () => {
    const result = journalEntrySchema.safeParse({ body: "x".repeat(20_001) });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed prompt id", () => {
    const result = journalEntrySchema.safeParse({ body: "Body", promptId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});
