import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type AuditLogEntry = {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  diff?: unknown;
};

/**
 * Appends a row to the audit_log table using the service-role client so that
 * RLS is bypassed and writes always succeed regardless of caller identity.
 *
 * Uses an untyped (generic-free) client because audit_log is not yet reflected
 * in the generated database.types.ts (will be after `supabase db pull`).
 *
 * Failures are logged to stderr but never thrown — audit writes must not
 * interrupt the primary operation.
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("[audit-log] missing env vars — skipping write");
    return;
  }

  // Untyped client: no Database generic so the table schema is `Record<string, unknown>`.
  // This is intentional until database.types.ts is regenerated with the new tables.
  const admin: SupabaseClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any).from("audit_log").insert({
    actor_user_id: entry.actorUserId ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    diff: entry.diff !== undefined ? entry.diff : null,
  });

  if (error) {
    console.error("[audit-log] write failed:", (error as { message: string }).message, entry);
  }
}
