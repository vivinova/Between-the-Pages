import "server-only";
import { cookies, headers } from "next/headers";
import { createHash, randomUUID } from "node:crypto";

const ANON_COOKIE = "btp_anon_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * A long-lived, httpOnly, random id identifying this browser — not tied to
 * any account (there are none). Created on first write (a confession,
 * reaction, reply, or report), read on every write after that. Clearing
 * cookies resets it, which is a known, accepted gap in dedup/rate limiting
 * — see the rate-limit.ts doc comment.
 */
function getOrCreateAnonId(): string {
  const store = cookies();
  const existing = store.get(ANON_COOKIE)?.value;
  if (existing) return existing;

  const id = randomUUID();
  store.set(ANON_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return id;
}

/**
 * Stands in for identity anywhere this app needs *a* stable key without
 * that key being personally identifying on its own — reaction/report
 * dedup, rate limiting. Hashes the anon cookie id together with a coarse
 * IP signal so clearing cookies alone (without also changing network)
 * doesn't trivially reset it, without ever storing the raw IP.
 */
export function getFingerprintHash(): string {
  const anonId = getOrCreateAnonId();
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(`${anonId}:${ip}`).digest("hex");
}
