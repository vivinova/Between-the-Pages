import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Hashes both sides to a fixed 32-byte digest before comparing, so a
 * length mismatch never short-circuits into a length-dependent timing
 * signal — timingSafeEqual itself throws on mismatched-length buffers.
 */
export function passwordsMatch(submitted: string, expected: string): boolean {
  const submittedHash = createHash("sha256").update(submitted).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(submittedHash, expectedHash);
}
