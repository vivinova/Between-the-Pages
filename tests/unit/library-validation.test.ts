import { describe, expect, it } from "vitest";
import { reportBookSchema } from "@/lib/validation/library";

describe("reportBookSchema", () => {
  it("accepts a valid report", () => {
    const result = reportBookSchema.safeParse({
      bookId: "550e8400-e29b-41d4-a716-446655440000",
      reason: "harassment",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unrecognized reason", () => {
    const result = reportBookSchema.safeParse({
      bookId: "550e8400-e29b-41d4-a716-446655440000",
      reason: "made_up_reason",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed book id", () => {
    const result = reportBookSchema.safeParse({ bookId: "not-a-uuid", reason: "spam" });
    expect(result.success).toBe(false);
  });
});
