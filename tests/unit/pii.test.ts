import { describe, expect, it } from "vitest";
import { checkForPossiblePii } from "@/lib/moderation/pii";

describe("checkForPossiblePii", () => {
  it("flags an email address", () => {
    const result = checkForPossiblePii("reach me at jamie.doe@example.com anytime");
    expect(result.hasPossibleMatch).toBe(true);
    expect(result.matches.some((m) => m.kind === "email")).toBe(true);
  });

  it("flags a phone number", () => {
    const result = checkForPossiblePii("call me at 555-123-4567 tonight");
    expect(result.hasPossibleMatch).toBe(true);
    expect(result.matches.some((m) => m.kind === "phone")).toBe(true);
  });

  it("flags a mid-sentence capitalized word pair as a possible proper noun", () => {
    const result = checkForPossiblePii("I still think about John Carter every day.");
    expect(result.hasPossibleMatch).toBe(true);
    expect(result.matches.some((m) => m.kind === "possible_proper_noun")).toBe(true);
  });

  it("does not flag a sentence-initial capitalized phrase at the very start of the text", () => {
    const result = checkForPossiblePii("Some Random thing happened but nothing else did.");
    expect(result.matches.some((m) => m.kind === "possible_proper_noun")).toBe(false);
  });

  it("returns no matches for ordinary lowercase reflection", () => {
    const result = checkForPossiblePii("today felt quieter than usual, and that was enough.");
    expect(result.hasPossibleMatch).toBe(false);
    expect(result.matches).toHaveLength(0);
  });
});
