import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin/session";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = { title: "Moderator sign in" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (token && (await verifyAdminSessionToken(token))) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-serif text-2xl text-wood-900">Moderator sign in</h1>
      <p className="mt-1 text-wood-600">
        There are no accounts here — just a single shared passphrase.
      </p>
      <LoginForm />
    </div>
  );
}
