import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-wood-900">Welcome back</h1>
        <p className="mt-1 text-sm text-wood-600">Your journal is waiting, undisturbed.</p>
      </div>
      <SignInForm />
      <div className="flex justify-between text-sm text-wood-600">
        <Link href="/signup" className="font-medium text-dusk-700 underline">
          Create an account
        </Link>
        <Link href="/reset-password" className="font-medium text-dusk-700 underline">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
