import { describe, expect, it } from "vitest";
import { createPromptSchema, createShelfSchema, updateShelfSchema } from "@/lib/validation/admin";

describe("createShelfSchema", () => {
  it("accepts a valid slug and name", () => {
    const result = createShelfSchema.safeParse({ slug: "for-quiet-mornings", name: "For quiet mornings" });
    expect(result.success).toBe(true);
  });

  it("rejects a slug with spaces or uppercase letters", () => {
    expect(createShelfSchema.safeParse({ slug: "Not A Slug", name: "x" }).success).toBe(false);
    expect(createShelfSchema.safeParse({ slug: "not_a_slug", name: "x" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    const result = createShelfSchema.safeParse({ slug: "ok-slug", name: "" });
    expect(result.success).toBe(false);
  });
});

describe("updateShelfSchema", () => {
  it("accepts a valid update", () => {
    const result = updateShelfSchema.safeParse({ name: "Renamed", isHidden: true });
    expect(result.success).toBe(true);
  });
});

describe("createPromptSchema", () => {
  it("accepts prompt text without a theme", () => {
    expect(createPromptSchema.safeParse({ promptText: "What are you carrying today?" }).success).toBe(
      true,
    );
  });

  it("rejects empty prompt text", () => {
    expect(createPromptSchema.safeParse({ promptText: "   " }).success).toBe(false);
  });
});
