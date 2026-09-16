import { createAdminClient } from "@/lib/supabase/admin";

/**
 * audit_log has no RLS policy for anon or authenticated — only the admin
 * client (service_role, which bypasses RLS) can read or write it. Call
 * this after every moderator decision so there's a record of what
 * happened and why. There's a single shared admin passphrase rather than
 * per-moderator accounts, so `actor` is always "admin" — this exists to
 * record the action, not attribute it to a specific person.
 */
export async function recordAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}
