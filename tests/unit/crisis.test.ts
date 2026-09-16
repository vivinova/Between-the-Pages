import { describe, expect, it } from "vitest";
import { checkForCrisisLanguage } from "@/lib/moderation/crisis";

describe("checkForCrisisLanguage", () => {
  it("flags an unambiguous crisis phrase", () => {
    expect(checkForCrisisLanguage("some nights I think about wanting to end my life")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(checkForCrisisLanguage("I WANT TO DIE some days")).toBe(true);
  });

  it("does not flag ordinary reflective text", () => {
    expect(checkForCrisisLanguage("today felt quieter than usual, and that was enough")).toBe(
      false,
    );
  });
});
