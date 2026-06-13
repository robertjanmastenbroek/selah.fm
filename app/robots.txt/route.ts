/**
 * robots.txt — serves /robots.txt
 * Welcomes AI crawlers (GPTBot, PerplexityBot, CCBot) explicitly.
 */
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const txt = `# robots.txt for selah.fm
# https://selah.fm/robots.txt

# Allow all Google crawlers (Googlebot + Google AI Overviews)
User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Allow: /

# Welcome AI training crawlers
User-agent: GPTBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: CCBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /

# Default: allow everything
User-agent: *
Allow: /
Sitemap: https://selah.fm/sitemap.xml
`;

  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400',
    },
  });
}
