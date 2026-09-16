import { createAdminClient } from "@/lib/supabase/admin";

/**
 * audit_log has no RLS policy for anon or authenticated — only the admin
 * client (service_role, which bypasses RLS) can read or write it. Call
 * this after every moderator decision so there's a record of who did what
 * and why, per the moderator-dashboard requirement.
 */
export async function recordAuditLog(
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("audit_log").insert({
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}
