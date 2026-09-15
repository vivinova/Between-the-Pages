import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create an account" };

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-wood-900">Begin your journal</h1>
        <p className="mt-1 text-sm text-wood-600">
          Private by default. Nothing you write here is shared unless you choose to.
        </p>
      </div>
      <SignUpForm />
      <p className="text-center text-sm text-wood-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-dusk-700 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
