import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { adminSessionSecret: () => "test-secret-do-not-use-in-production" },
}));

const { createAdminSessionToken, verifyAdminSessionToken } = await import(
  "@/lib/admin/session"
);

describe("admin session token", () => {
  it("a freshly issued token verifies as valid", async () => {
    const token = await createAdminSessionToken();
    expect(await verifyAdminSessionToken(token)).toBe(true);
  });

  it("rejects a token with a tampered payload", async () => {
    const token = await createAdminSessionToken();
    const [, signature] = token.split(".");
    const tamperedPayload = Buffer.from(JSON.stringify({ exp: Date.now() + 999_999_999 }))
      .toString("base64url");
    expect(await verifyAdminSessionToken(`${tamperedPayload}.${signature}`)).toBe(false);
  });

  it("rejects a malformed token", async () => {
    expect(await verifyAdminSessionToken("not-a-real-token")).toBe(false);
    expect(await verifyAdminSessionToken("")).toBe(false);
  });

  it("rejects an expired token", async () => {
    vi.useFakeTimers();
    try {
      const token = await createAdminSessionToken();
      vi.advanceTimersByTime(1000 * 60 * 60 * 13); // past the 12-hour session duration
      expect(await verifyAdminSessionToken(token)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
