"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from "@/lib/admin/session";
import { passwordsMatch } from "@/lib/admin/password";
import { checkRateLimit, RATE_LIMITS, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { getFingerprintHash } from "@/lib/fingerprint";

export type AdminLoginResult = { ok: true } | { ok: false; error: string };

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // matches session.ts's 12-hour token expiry

export async function loginAdmin(password: string): Promise<AdminLoginResult> {
  const fingerprint = getFingerprintHash();
  if (!(await checkRateLimit(fingerprint, RATE_LIMITS.adminLogin))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }

  if (!passwordsMatch(password, env.adminPassword())) {
    return { ok: false, error: "Incorrect password." };
  }

  const token = await createAdminSessionToken();
  cookies().set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
  });

  return { ok: true };
}

export async function logoutAdmin(): Promise<void> {
  cookies().delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}
