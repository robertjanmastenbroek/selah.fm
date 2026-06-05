/**
 * Rate limiting middleware for Selah.fm API routes.
 * DB-backed — scales across multiple Railway instances.
 * Uses PostgreSQL for atomic increment + cleanup.
 */
import sql from '@/lib/db';

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 30;

export async function rateLimit(
  key: string,
  options?: { windowMs?: number; maxRequests?: number }
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const windowMs = options?.windowMs || DEFAULT_WINDOW_MS;
  const maxRequests = options?.maxRequests || DEFAULT_MAX_REQUESTS;
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    // Atomic UPSERT: create or increment
    const [row] = await sql.raw(`
      INSERT INTO rate_limits (key, count, reset_at)
      VALUES ($1, 1, $2)
      ON CONFLICT (key) 
      DO UPDATE SET count = CASE 
        WHEN rate_limits.reset_at < NOW() THEN 1
        ELSE rate_limits.count + 1
      END, reset_at = CASE 
        WHEN rate_limits.reset_at < NOW() THEN $2
        ELSE rate_limits.reset_at
      END
      RETURNING count, reset_at
    `, [key, resetAt.toISOString()]);

    const count = row?.count || 1;
    const actualReset = row?.reset_at ? new Date(row.reset_at) : resetAt;
    const remaining = Math.max(0, maxRequests - count);
    const resetIn = Math.max(0, actualReset.getTime() - now.getTime());

    // Periodic cleanup: delete expired entries (runs ~1% of calls)
    if (Math.random() < 0.01) {
      sql.raw(`DELETE FROM rate_limits WHERE reset_at < NOW()`).catch(() => {});
    }

    return { allowed: count <= maxRequests, remaining, resetIn };
  } catch {
    // Fallback: if DB fails, allow the request
    return { allowed: true, remaining: maxRequests, resetIn: windowMs };
  }
}

/**
 * Rate limit for anonymous feedback submissions.
 * 10 per hour per session/IP.
 */
export async function rateLimitFeedback(key: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  return rateLimit(`feedback:${key}`, { windowMs: 3600_000, maxRequests: 10 });
}

/**
 * Rate limit for authenticated edit suggestions.
 * 3 per day per user.
 */
export async function rateLimitEditSuggestion(userId: string): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  return rateLimit(`edit:user:${userId}`, { windowMs: 86400_000, maxRequests: 3 });
}

/**
 * Get rate limit key from request (IP or session).
 */
export function getRateLimitKey(request: Request): string {
  // Prefer session-based limiting
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/session=([^;]+)/);
  if (sessionMatch) {
    return `session:${sessionMatch[1].substring(0, 20)}`;
  }
  // Fall back to IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `ip:${ip}`;
}
