import type { Metadata } from "next";
import Link from "next/link";
import { RequestResetForm } from "./request-reset-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-wood-900">Reset your password</h1>
        <p className="mt-1 text-sm text-wood-600">
          We&apos;ll email you a link to choose a new password.
        </p>
      </div>
      <RequestResetForm />
      <p className="text-center text-sm text-wood-600">
        <Link href="/login" className="font-medium text-dusk-700 underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
