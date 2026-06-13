import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Lightweight health check endpoint — used by Railway's healthcheck probe.
 * Returns instantly without DB queries so the deployment Network step
 * completes reliably within Railway's healthcheckTimeout window.
 *
 * DB connectivity failures are surfaced through Sentry + runtime logs,
 * not through the health endpoint (which would cause deploy failures
 * on transient DB blips).
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
