import type { Metadata } from "next";
import { CrisisResourceNotice } from "@/components/support/crisis-resource-notice";

export const metadata: Metadata = { title: "Support resources" };

export default function SupportPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-4 py-16">
      <div>
        <h1 className="font-serif text-2xl text-wood-900">Support resources</h1>
        <p className="mt-2 text-wood-600">
          Between the Pages is a quiet space for peer reflection — it is not therapy,
          crisis counseling, or emergency support, and no one here is monitoring in
          real time.
        </p>
      </div>
      <CrisisResourceNotice />
    </div>
  );
}
