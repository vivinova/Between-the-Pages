import { describe, expect, it } from "vitest";
import { passwordsMatch } from "@/lib/admin/password";

describe("passwordsMatch", () => {
  it("returns true for identical strings", () => {
    expect(passwordsMatch("correct-horse-battery-staple", "correct-horse-battery-staple")).toBe(
      true,
    );
  });

  it("returns false for different strings of the same length", () => {
    expect(passwordsMatch("aaaaaaaaaa", "bbbbbbbbbb")).toBe(false);
  });

  it("returns false for different-length strings without throwing", () => {
    expect(() => passwordsMatch("short", "a-much-longer-password")).not.toThrow();
    expect(passwordsMatch("short", "a-much-longer-password")).toBe(false);
  });

  it("returns false for an empty submitted password against a real one", () => {
    expect(passwordsMatch("", "the-real-password")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(passwordsMatch("Password123", "password123")).toBe(false);
  });
});
