import { describe, expect, it } from "vitest";
import { pickRandom } from "@/lib/random";

describe("pickRandom", () => {
  it("returns undefined for an empty array", () => {
    expect(pickRandom([])).toBeUndefined();
  });

  it("returns the only item in a single-item array", () => {
    expect(pickRandom(["only"])).toBe("only");
  });

  it("always returns an item that belongs to the input array", () => {
    const items = ["a", "b", "c", "d", "e"];
    for (let i = 0; i < 50; i++) {
      expect(items).toContain(pickRandom(items));
    }
  });
});
