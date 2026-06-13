/** Admin email allow-list — shared between server and client code. */
export const ADMIN_EMAILS = ['mastenbroekrobertjan@gmail.com', 'motomotosings@gmail.com'];

/**
 * Internal base URL for self-referencing HTTP calls.
 * Uses localhost + Railway's PORT to avoid routing through the public load balancer.
 * During deployment transitions, the public URL may point to a stale container,
 * causing 502s or timeouts in cron workers and internal API chaining.
 *
 * Function (not const) so it resolves at call time, not at module-load time.
 */
export function getInternalUrl(): string {
  return `http://localhost:${process.env.PORT || 3000}`;
}