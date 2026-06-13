/**
 * /qa/[slug]/answer.txt — plain-text Q&A for AI models.
 * Returns just the question + answer, no HTML.
 */
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  try {
    const [page] = await sql`
      SELECT question, answer_text FROM qa_pages
      WHERE slug = ${params.slug} AND status = 'published'
    `;
    if (!page) return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });

    const output = `Question: ${page.question}\n\nAnswer: ${page.answer_text}\n\nSource: https://selah.fm/qa/${params.slug}\n`;
    return new Response(output, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' },
    });
  } catch {
    return new Response('Error', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}
