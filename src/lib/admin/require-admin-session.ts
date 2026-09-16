import "server-only";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";

/**
 * The real /admin authorization boundary — middleware's redirect is only a
 * UI convenience (see middleware.ts). Every moderation server action must
 * call this first, since a direct POST to a server action's endpoint
 * skips middleware entirely.
 */
export async function requireAdminSession(): Promise<{ ok: true } | { ok: false; error: string }> {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !(await verifyAdminSessionToken(token))) {
    return { ok: false, error: "You must be signed in as a moderator to do that." };
  }
  return { ok: true };
}
