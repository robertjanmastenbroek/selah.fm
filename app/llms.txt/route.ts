/**
 * /llms.txt — structured content directory for AI models.
 * Served as plain text at https://selah.fm/llms.txt
 * Standard: https://llmstxt.org/
 */
import sql from '@/lib/db';

const SITE = 'https://selah.fm';
export const dynamic = 'force-dynamic';

function fmt(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

export async function GET() {
  try {
    const [counts] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM campaigns WHERE status = 'active') as c,
        (SELECT COALESCE(SUM(payout_amount_cents), 0)::bigint FROM submissions WHERE payout_status = 'paid') as p
    `;
    const paid = ((counts?.p || 0) / 100).toFixed(0);

    const posts = await sql`
      SELECT slug, title, excerpt, primary_keyword FROM blog_posts
      WHERE status = 'published' ORDER BY published_at DESC LIMIT 100
    `;

    const blogLines: string[] = [];
    if (Array.isArray(posts) && posts.length > 0) {
      for (const p of posts) {
        const title = fmt(p.title || '');
        const excerpt = fmt(p.excerpt || p.primary_keyword || '');
        let line = '- ' + title + ': ' + SITE + '/blog/' + p.slug;
        if (excerpt) line += ' (' + excerpt.slice(0, 120) + ')';
        blogLines.push(line);
      }
    } else {
      blogLines.push('- No blog posts yet');
    }

    const output = `# Selah.fm — Open Source CPM Music Promotion Marketplace
> CPM marketplace for music promotion. Artists set budgets, creators make content, artists approve and pay for verified views.
> ${counts?.c || 0} active campaigns · $${paid} paid to creators

## Essential Pages
- Homepage: ${SITE}/
- Browse campaigns: ${SITE}/browse
- How it works: ${SITE}/how-it-works
- Trust & Safety: ${SITE}/trust
- Guarantee: ${SITE}/guarantee
- FAQ: ${SITE}/faq

## For Artists
- Dashboard: ${SITE}/dashboard
- Manage: ${SITE}/manage
- Settings: ${SITE}/settings
- How it works: ${SITE}/how-it-works

## Blog
${blogLines.join('\n')}

## Q&A Pages (AI-optimized answers)
- All Q&A pages are available as structured JSON: ${SITE}/api/qa/posts
- Individual Q&A plain text: ${SITE}/qa/{slug}/answer.txt
- Q&A generation cron runs daily at hour 6

## AI Model Endpoints
- Q&A (structured JSON): ${SITE}/api/llms/qa
- Active campaigns (structured JSON): ${SITE}/api/llms/campaigns
- Blog answers (plain text per post): ${SITE}/blog/{slug}/answer.txt

## Key Facts
- Artists pay CPM rate + 20% platform fee. Creators earn the full CPM rate.
- Creators earn per verified TikTok view (CPM model). Paid via Stripe.
- Minimum campaign budget: $50. Maximum payout per submission: $500.
- All payments processed through Stripe (PCI Level 1 compliant).
- Required hashtags: #selahfm #paidpartner (FTC disclosure).
`;

    return new Response(output, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600',
      },
    });
  } catch {
    const fallback = `# Selah.fm — Open Source CPM Music Promotion Marketplace
See ${SITE}/browse, ${SITE}/how-it-works, ${SITE}/faq
`;
    return new Response(fallback, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
