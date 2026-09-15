import type { Metadata } from "next";
import { UpdatePasswordForm } from "./update-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function ConfirmResetPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-wood-900">Choose a new password</h1>
      </div>
      <UpdatePasswordForm />
    </div>
  );
}
