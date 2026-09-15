import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-serif text-3xl text-wood-900">Settings</h1>
      <p className="text-wood-600">
        Account, blocked topics, notifications, export, and deletion controls will live
        here. Coming in Phase 6.
      </p>
    </div>
  );
}
