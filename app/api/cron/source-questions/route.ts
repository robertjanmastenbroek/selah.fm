/**
 * GET /api/cron/source-questions
 * Sources fresh questions from Reddit for the blog batch.
 * Runs weekly via cron dispatcher.
 * Targets 500 questions, 50/50 artist/creator split.
 */
import { NextResponse } from 'next/server';
import { sourceRedditQuestions } from '@/lib/question-sourcer';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret') || request.headers.get('X-Cron-Secret') || '';
  const target = Math.min(parseInt(searchParams.get('target') || '500'), 1000);

  const isAuthorized = secret === process.env.CRON_SECRET;
  if (!isAuthorized) {
    try {
      const { getUser } = await import('@/lib/supabase/server');
      const user = await getUser();
      if (!user?.email || (!user.email.endsWith('@selah.fm') && !user.email.endsWith('@gmail.com'))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const result = await sourceRedditQuestions(target);

  return NextResponse.json({
    ok: true,
    target,
    sourced: result.sourced,
    artistQuestions: result.artistQuestions,
    creatorQuestions: result.creatorQuestions,
    errors: result.errors,
    message: `Sourced ${result.sourced} questions (${result.artistQuestions} artist, ${result.creatorQuestions} creator)`,
  });
}
