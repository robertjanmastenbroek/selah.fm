import { NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * Health check endpoint for Railway + uptime monitoring.
 * GET /api/health
 * 
 * Returns:
 * - 200: { status: "ok", db: "connected", uptime: "..." }
 * - 503: { status: "error", db: "disconnected" }
 * 
 * Monitor this endpoint with uptimerobot.com, betterstack.com, or similar.
 */
export async function GET() {
  const start = Date.now();
  
  try {
    // Check DB connectivity
    const dbResult = await sql`SELECT 1 as ok`;
    const dbLatency = Date.now() - start;

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      db_latency_ms: dbLatency,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({
      status: 'error',
      db: 'disconnected',
      error: process.env.NODE_ENV === 'production' ? 'Database unavailable' : e.message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
