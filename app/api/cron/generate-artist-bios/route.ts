import { NextResponse } from 'next/server';
import { batchGenerateBios } from '@/lib/artist-content';

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

/**
 * Cron: batch-generate SEO bios for artists without them.
 * Runs overnight. Processes 50 artists per run.
 * 1,800 artists × 50/run = 36 runs at $0.14/artist ≈ $252 total.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fire-and-forget: return immediately, process in background
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  
  batchGenerateBios(limit)
    .then(result => console.log('Artist bios generated:', result))
    .catch(e => console.error('Artist bios error:', e));

  return NextResponse.json({ status: 'started', message: `Generating bios for up to ${limit} artists` });
}
