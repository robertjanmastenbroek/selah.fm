/**
 * GET /api/cron/generate-qa
 * Runs the Q&A page generator — creates short, structured answers
 * from unused batch questions. Designed for high volume (50+ per day).
 * Dispatched at UTC hour 6 daily.
 */
import { NextResponse } from 'next/server';
import { runQAGenerator } from '@/lib/qa-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';

  const isAuthorized = secret === process.env.CRON_SECRET;
  if (!isAuthorized) {
    try {
      const { getUser } = await import('@/lib/supabase/server');
      const user = await getUser();
      if (!user?.email || (!user.email.endsWith('@selah.fm') && !user.email.endsWith('@gmail.com')))
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const result = await runQAGenerator();
  return NextResponse.json({ ok: true, generated: result.generated, errors: result.errors.slice(0, 10) });
}
