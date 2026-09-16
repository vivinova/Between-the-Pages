import { describe, expect, it } from "vitest";
import {
  toggleReactionSchema,
  submitReplySchema,
  reportSchema,
} from "@/lib/validation/interactions";

const VALID_ID = "11111111-1111-4111-8111-111111111111";

describe("toggleReactionSchema", () => {
  it("accepts a valid reaction toggle", () => {
    expect(
      toggleReactionSchema.safeParse({ confessionId: VALID_ID, type: "me_too" }).success,
    ).toBe(true);
    expect(
      toggleReactionSchema.safeParse({ confessionId: VALID_ID, type: "sending_love" }).success,
    ).toBe(true);
  });

  it("rejects a reply as a reaction type", () => {
    expect(
      toggleReactionSchema.safeParse({ confessionId: VALID_ID, type: "reply" }).success,
    ).toBe(false);
  });

  it("rejects a non-uuid confessionId", () => {
    expect(
      toggleReactionSchema.safeParse({ confessionId: "not-a-uuid", type: "me_too" }).success,
    ).toBe(false);
  });
});

describe("submitReplySchema", () => {
  it("accepts an ordinary reply", () => {
    expect(
      submitReplySchema.safeParse({ confessionId: VALID_ID, bodyText: "I felt this too." })
        .success,
    ).toBe(true);
  });

  it("rejects an empty reply", () => {
    expect(
      submitReplySchema.safeParse({ confessionId: VALID_ID, bodyText: "" }).success,
    ).toBe(false);
  });

  it("rejects a reply longer than 500 characters", () => {
    expect(
      submitReplySchema.safeParse({ confessionId: VALID_ID, bodyText: "a".repeat(501) })
        .success,
    ).toBe(false);
  });
});

describe("reportSchema", () => {
  it("accepts a valid confession report", () => {
    expect(
      reportSchema.safeParse({ targetType: "confession", targetId: VALID_ID, reason: "spam" })
        .success,
    ).toBe(true);
  });

  it("accepts a valid interaction report", () => {
    expect(
      reportSchema.safeParse({
        targetType: "interaction",
        targetId: VALID_ID,
        reason: "harassment",
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown reason", () => {
    expect(
      reportSchema.safeParse({
        targetType: "confession",
        targetId: VALID_ID,
        reason: "not_a_real_reason",
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown target type", () => {
    expect(
      reportSchema.safeParse({ targetType: "book", targetId: VALID_ID, reason: "spam" })
        .success,
    ).toBe(false);
  });
});
