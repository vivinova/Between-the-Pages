import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";

/**
 * No accounts anywhere in this app — the only gated route is the
 * passphrase-protected moderator dashboard. This check is a UI
 * convenience only (redirects an unauthenticated visitor away before the
 * page renders); the real boundary is requireAdminSession() re-verifying
 * the same cookie inside every /admin server action, since middleware
 * alone can't stop a direct POST to a server action's endpoint.
 */
export async function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const valid = token ? await verifyAdminSessionToken(token) : false;

  if (!valid) {
    const redirectUrl = new URL("/admin/login", request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
