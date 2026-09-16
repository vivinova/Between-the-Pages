import { describe, expect, it } from "vitest";
import { submitConfessionSchema, deleteConfessionSchema } from "@/lib/validation/confessions";

const VALID_CATEGORY_ID = "11111111-1111-4111-8111-111111111111";

describe("submitConfessionSchema", () => {
  it("accepts a valid confession with no email", () => {
    const result = submitConfessionSchema.safeParse({
      categoryId: VALID_CATEGORY_ID,
      bodyText: "This is a confession that is long enough to pass validation.",
      emailOptIn: false,
      contactEmail: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid confession with an opted-in email", () => {
    const result = submitConfessionSchema.safeParse({
      categoryId: VALID_CATEGORY_ID,
      bodyText: "This is a confession that is long enough to pass validation.",
      emailOptIn: true,
      contactEmail: "reader@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a confession shorter than 20 characters", () => {
    const result = submitConfessionSchema.safeParse({
      categoryId: VALID_CATEGORY_ID,
      bodyText: "too short",
      emailOptIn: false,
      contactEmail: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a confession longer than 3000 characters", () => {
    const result = submitConfessionSchema.safeParse({
      categoryId: VALID_CATEGORY_ID,
      bodyText: "a".repeat(3001),
      emailOptIn: false,
      contactEmail: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing category", () => {
    const result = submitConfessionSchema.safeParse({
      categoryId: "",
      bodyText: "This is a confession that is long enough to pass validation.",
      emailOptIn: false,
      contactEmail: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects emailOptIn true with no email address", () => {
    const result = submitConfessionSchema.safeParse({
      categoryId: VALID_CATEGORY_ID,
      bodyText: "This is a confession that is long enough to pass validation.",
      emailOptIn: true,
      contactEmail: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed email address", () => {
    const result = submitConfessionSchema.safeParse({
      categoryId: VALID_CATEGORY_ID,
      bodyText: "This is a confession that is long enough to pass validation.",
      emailOptIn: true,
      contactEmail: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteConfessionSchema", () => {
  it("accepts a valid id and token", () => {
    const result = deleteConfessionSchema.safeParse({
      confessionId: VALID_CATEGORY_ID,
      ownerToken: "some-token",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a non-uuid confessionId", () => {
    const result = deleteConfessionSchema.safeParse({
      confessionId: "not-a-uuid",
      ownerToken: "some-token",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty ownerToken", () => {
    const result = deleteConfessionSchema.safeParse({
      confessionId: VALID_CATEGORY_ID,
      ownerToken: "",
    });
    expect(result.success).toBe(false);
  });
});
