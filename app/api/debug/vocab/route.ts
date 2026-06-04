/**
 * Debug endpoint to test vocabulary system
 * GET /api/debug/vocab?secret=CRON_SECRET
 */
import { NextResponse } from 'next/server';
import { getBannedWordsList, getVocabStats, recordBio } from '@/lib/bio-vocabulary';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = new URL(request.url).searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, any> = {};

  // Test 1: can we query the DB at all?
  try {
    const [{ count }] = await sql`SELECT COUNT(*)::int FROM bio_word_counts`;
    results.db_query = { ok: true, count };
  } catch (e: any) {
    results.db_query = { ok: false, error: e.message };
  }

  // Test 2: getBannedWordsList
  try {
    const banned = await getBannedWordsList();
    results.banned_words = { ok: true, list: banned.slice(0, 200) };
  } catch (e: any) {
    results.banned_words = { ok: false, error: e.message };
  }

  // Test 3: recordBio with a test string
  try {
    await recordBio('This is a test bio with some unique vocabulary words like innovative groundbreaking and experimental');
    const stats = await getVocabStats();
    results.record_bio = { ok: true, stats };
  } catch (e: any) {
    results.record_bio = { ok: false, error: e.message };
  }

  // Test 4: sql.raw directly
  try {
    const result = await sql.raw('SELECT COUNT(*)::int as c FROM bio_word_counts');
    results.sql_raw = { ok: true, count: result[0]?.c };
  } catch (e: any) {
    results.sql_raw = { ok: false, error: e.message };
  }

  return NextResponse.json(results);
}
