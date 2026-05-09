/**
 * Rate limiting middleware for Selah.fm API routes.
 * Simple in-memory token bucket — resets per window.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 30;

export function rateLimit(
  key: string,
  options?: { windowMs?: number; maxRequests?: number }
): { allowed: boolean; remaining: number; resetIn: number } {
  const windowMs = options?.windowMs || DEFAULT_WINDOW_MS;
  const maxRequests = options?.maxRequests || DEFAULT_MAX_REQUESTS;
  const now = Date.now();

  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(key, entry);
  }

  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetIn = Math.max(0, entry.resetAt - now);

  // Cleanup old entries periodically
  if (rateLimitStore.size > 10_000) {
    for (const [k, v] of rateLimitStore) {
      if (now > v.resetAt) rateLimitStore.delete(k);
    }
  }

  return {
    allowed: entry.count <= maxRequests,
    remaining,
    resetIn,
  };
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
