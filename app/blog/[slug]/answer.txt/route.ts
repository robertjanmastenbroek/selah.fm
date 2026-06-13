/**
 * /blog/[slug]/answer.txt
 * Returns the direct answer for a blog post as plain text.
 * AI models can fetch this to get the answer without HTML parsing.
 * 
 * Example: curl https://selah.fm/blog/how-to-promote-music-on-tiktok/answer.txt
 */
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const [post] = await sql`
      SELECT title, content_html, excerpt, meta_description, primary_keyword
      FROM blog_posts
      WHERE slug = ${params.slug} AND status = 'published'
    `;

    if (!post) {
      return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
    }

    // Extract the first paragraph or direct answer from the HTML
    const content = post.content_html || '';
    const firstP = content.match(/<p>(.*?)<\/p>/);
    const directAnswer = firstP ? firstP[1].replace(/<[^>]*>/g, '') : '';

    // Strip HTML from everything
    const plainText = content
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g, '\n$1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/g, '\n$1')
      .replace(/<li[^>]*>(.*?)<\/li>/g, '\n- $1')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const output = `Question: ${post.title}

Direct answer: ${post.meta_description || post.excerpt || directAnswer}

${plainText}

---
Source: https://selah.fm/blog/${params.slug}
`;

    return new Response(output, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=86400',
      },
    });
  } catch {
    return new Response('Error loading post', { status: 500, headers: { 'Content-Type': 'text/plain' } });
  }
}
