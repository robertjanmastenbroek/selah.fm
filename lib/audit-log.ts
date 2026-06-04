import sql from '@/lib/db';

/**
 * Log an auditable event — financial transactions, campaign changes, etc.
 * Fire-and-forget: never throw on failure.
 */
export async function logAudit(
  actorId: string | null,
  action: string,
  targetType: string,
  targetId: string | null,
  details?: Record<string, any>,
  ipHash?: string | null,
) {
  try {
    await sql`
      INSERT INTO audit_log (actor_id, action, target_type, target_id, details, ip_hash)
      VALUES (
        ${actorId || null},
        ${action},
        ${targetType},
        ${targetId || null},
        ${JSON.stringify(details || {})}::jsonb,
        ${ipHash || null}
      )
    `;
  } catch {
    // Fire-and-forget: non-critical
  }
}
