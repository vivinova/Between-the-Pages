import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NotificationItem } from "@/components/inbox/notification-item";
import { NotificationPreferences } from "@/components/inbox/notification-preferences";
import { MarkAllReadButton } from "@/components/inbox/mark-all-read-button";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: notifications }, { data: profile }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, book_id, read_at, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("notification_settings").eq("id", user.id).maybeSingle(),
  ]);

  const hasUnread = (notifications ?? []).some((n) => !n.read_at);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-wood-900">Inbox</h1>
          <p className="mt-1 text-wood-600">
            Quiet acknowledgments from readers. No counts, no rankings — just what
            happened.
          </p>
        </div>
        {hasUnread ? <MarkAllReadButton /> : null}
      </div>

      <NotificationPreferences
        settings={(profile?.notification_settings as Record<string, unknown>) ?? {}}
      />

      {notifications && notifications.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              id={notification.id}
              type={notification.type}
              bookId={notification.book_id}
              read={Boolean(notification.read_at)}
              createdAt={notification.created_at}
            />
          ))}
        </ul>
      ) : (
        <p className="text-wood-600">Nothing here yet.</p>
      )}
    </div>
  );
}
