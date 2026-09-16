import { describe, expect, it } from "vitest";
import { sanitizeUuidList } from "@/lib/library";

describe("sanitizeUuidList", () => {
  it("keeps well-formed UUIDs", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(sanitizeUuidList([id])).toEqual([id]);
  });

  it("drops anything that isn't a UUID, including filter-syntax injection attempts", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    expect(sanitizeUuidList([id, "') OR (1=1", "", "not-a-uuid"])).toEqual([id]);
  });

  it("returns an empty array when nothing is valid", () => {
    expect(sanitizeUuidList(["nope", "still-nope"])).toEqual([]);
  });
});
