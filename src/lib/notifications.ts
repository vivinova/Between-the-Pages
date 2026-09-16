import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "@/lib/supabase/types";

const CATEGORY_BY_TYPE: Record<NotificationType, string> = {
  needed_this: "needed_this",
  pressed_flower: "pressed_flower",
  margin_note_approved: "margin_note",
  margin_note_rejected: "margin_note",
};

/**
 * Notifies a recipient (almost always someone other than the acting user),
 * respecting their notification_settings if they've turned that category
 * off. Always runs as the admin client: a notification's recipient_id is
 * someone else's row, which the acting user's own session could never
 * legitimately write under RLS, and checking that *other* person's
 * preferences needs the same elevated read.
 *
 * Silently no-ops on any failure — a missed quiet notification should
 * never surface as a user-facing error on the action that triggered it.
 */
export async function notify(input: {
  recipientId: string;
  type: NotificationType;
  bookId?: string;
  interactionId?: string;
}): Promise<void> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("notification_settings")
    .eq("id", input.recipientId)
    .maybeSingle();

  const settings = (profile?.notification_settings ?? {}) as Record<string, unknown>;
  const category = CATEGORY_BY_TYPE[input.type];
  if (settings[category] === false) {
    return;
  }

  await admin.from("notifications").insert({
    recipient_id: input.recipientId,
    type: input.type,
    book_id: input.bookId ?? null,
    interaction_id: input.interactionId ?? null,
  });
}
