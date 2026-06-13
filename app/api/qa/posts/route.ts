/**
 * GET /api/qa/posts — returns published Q&A pages.
 * Used by the sitemap and AI model endpoints.
 */
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pages = await sql`
      SELECT slug, question, answer_text, primary_keyword, category, published_at, word_count
      FROM qa_pages
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 500
    `;

    return NextResponse.json({ pages, count: pages.length });
  } catch (e: any) {
    return NextResponse.json({ pages: [], count: 0, error: e.message });
  }
}
