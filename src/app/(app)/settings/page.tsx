import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BlockedLabelsForm } from "@/components/settings/blocked-labels-form";
import { ReducedMotionToggle } from "@/components/settings/reduced-motion-toggle";
import { MarginNoteDefaultsForm } from "@/components/settings/margin-note-defaults-form";
import { NotificationPreferences } from "@/components/inbox/notification-preferences";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { UpdatePasswordForm } from "@/app/(auth)/reset-password/confirm/update-password-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "blocked_labels, notification_settings, reduced_motion, default_allow_margin_notes, default_notes_visible_to_readers",
    )
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <div>
        <h1 className="font-serif text-3xl text-wood-900">Settings</h1>
        <p className="mt-1 text-wood-600">{user.email}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl text-wood-900">Content warnings</h2>
        <BlockedLabelsForm initialBlocked={profile?.blocked_labels ?? []} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl text-wood-900">Notifications</h2>
        <NotificationPreferences
          settings={(profile?.notification_settings as Record<string, unknown>) ?? {}}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl text-wood-900">Margin note defaults</h2>
        <MarginNoteDefaultsForm
          initialAllow={profile?.default_allow_margin_notes ?? true}
          initialVisible={profile?.default_notes_visible_to_readers ?? false}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl text-wood-900">Accessibility</h2>
        <ReducedMotionToggle initialEnabled={profile?.reduced_motion ?? false} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl text-wood-900">Password</h2>
        <UpdatePasswordForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-xl text-wood-900">Your data</h2>
        <p className="text-sm text-wood-600">
          Download a copy of your private journal entries and account data as JSON.
        </p>
        <a
          href="/api/export"
          download
          className="inline-block w-fit rounded-md bg-wood-100 px-4 py-2 text-sm font-medium text-wood-800 hover:bg-cream-200"
        >
          Export my data
        </a>
      </section>

      <section className="flex flex-col gap-3 border-t border-wood-400/20 pt-6">
        <h2 className="font-serif text-xl text-wood-900">Delete account</h2>
        <DeleteAccountButton />
      </section>
    </div>
  );
}
