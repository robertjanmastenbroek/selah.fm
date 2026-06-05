import sql from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Dynamically generates llms.txt — the machine-readable site map for LLMs.
 * Updates automatically as new blog posts are published and artists are added.
 * Served at https://selah.fm/llms.txt
 */
export async function GET() {
  // ── Fetch dynamic data ──

  let blogPosts: { title: string; slug: string }[] = [];
  try {
    blogPosts = await sql`
      SELECT title, slug FROM blog_posts
      WHERE status = 'published'
      ORDER BY published_at DESC
      LIMIT 100
    `;
  } catch (e: any) {
    console.error('[llms.txt] Error fetching blog posts:', e.message);
  }

  let artistCount = 0;
  try {
    const [result] = await sql`
      SELECT COUNT(*)::int as count FROM discovered_artists
    `;
    artistCount = result?.count || 0;
  } catch (e: any) {
    console.error('[llms.txt] Error fetching artist count:', e.message);
  }

  let artistWithTracks = 0;
  try {
    const [result] = await sql`
      SELECT COUNT(DISTINCT da.id)::int as count
      FROM discovered_artists da
      JOIN artist_tracks at ON at.artist_id = da.id AND at.enabled = true
    `;
    artistWithTracks = result?.count || 0;
  } catch (e: any) {
    console.error('[llms.txt] Error fetching artist with tracks:', e.message);
  }

  let postCount = blogPosts.length;

  // ── Static header —─
  const lines: string[] = [
    '# Selah.fm — Open Source Music Promotion Marketplace',
    '',
    '## About',
    'Selah.fm is an open-source CPM (Cost Per Mille) marketplace connecting independent musicians with content creators. Artists set budgets and CPM rates; creators earn per verified view on TikTok, Instagram Reels, and YouTube Shorts.',
    '',
    `- Artists: pay $0.10+ CPM ($100+/1M views). You control approval. Pay only for verified views.`,
    `- Creators: earn ~$1,000/1M views at $1 CPM. No upfront cost. Join free.`,
    `- Platform: 20% fee on creator payouts. MIT licensed.`,
    `- Database: ${artistCount.toLocaleString()} artist profiles${artistWithTracks > 0 ? ` (${artistWithTracks.toLocaleString()} with tracks)` : ''}, bios, social stats, and structured data.`,
    `- ${postCount > 0 ? `${postCount}+ published blog posts generating 2 new posts/day.` : 'Blog generating 2 new posts/day.'}`,
    '',
    '## Key pages',
    '- /browse: Browse 2,000+ artists and active music promotion campaigns',
    '- /blog: Music promotion guides, CPM comparisons, creator earnings strategies',
    '- /tools/cpm-calculator: CPM rate calculator for music promotion campaigns',
    '- /tools/creator-earnings: Estimate creator income per platform (TikTok, Reels, Shorts)',
    '- /tools/promotion-budget: Plan your music promotion budget with CPM modeling',
    '- /tools/playlist-analyzer: Spotify playlist analyzer for independent artists',
    '- /compare: Compare Selah.fm vs TikTok Creator Fund vs YouTube Shorts Fund vs other platforms',
    '- /welcome-artists: How artists promote music by hiring content creators',
    '- /welcome-creators: How content creators earn money making music videos',
    '- /guides/music-promotion: Guide to independent music promotion strategies',
    '- /guides/cpm-rates: Complete guide to music promotion CPM rates',
    '- /guides/creator-earnings: Creator earnings guide for short-form video',
    '- /faq: Frequently asked questions about music promotion on Selah.fm',
    '- /about: Founder story, platform mission, and open source philosophy',
    '- /content-guidelines: Content submission guidelines for creators',
    '- /dmca: DMCA takedown policy',
    '- /privacy: Privacy policy',
    '- /tos: Terms of service',
    '',
    '## Artist profiles',
    `Every artist in the database has a profile page at /artist/[slug] with:`,
    '- MusicGroup + FAQPage + BreadcrumbList JSON-LD schema',
    '- Genre, monthly listeners, social links, and track catalog',
    '- AI-generated bio tailored to the artist\'s data (50+ narrative angles, 65+ opening hooks)',
    '- FAQ section with artist-specific questions',
    '- Related artists by genre',
    '- Donation and submission stats',
    '',
    'Browse all artist profiles at /browse. Artists with no tracks or activity are noindexed.',
    '',
    '## Notable content',
  ];

  // ── Categorize blog posts dynamically ──
  const categories: Record<string, { title: string; slug: string }[]> = {
    'CPM & Platform Comparisons': [],
    'Creator Earnings': [],
    'Music Promotion Strategy': [],
    'Artist Journey': [],
    'Founder Stories': [],
    'Other': [],
  };

  for (const post of blogPosts) {
    const t = post.title.toLowerCase();
    const s = post.slug.toLowerCase();

    if (t.includes('cpm') || t.includes('platform') || t.includes('tiktok vs') || t.includes('youtube vs') || t.includes('average') || t.includes('good cpm') || t.includes('compare')) {
      categories['CPM & Platform Comparisons'].push(post);
    } else if (t.includes('earn') || t.includes('monetize') || t.includes('income') || t.includes('payout') || t.includes('budget') || t.includes('metrics that pay') || t.includes('money') || t.includes('smaller audience')) {
      categories['Creator Earnings'].push(post);
    } else if (t.includes('promot') || t.includes('market') || t.includes('hashtag') || t.includes('post') || t.includes('tiktok') || t.includes('get verified') || t.includes('algorithm') || t.includes('spotify') || t.includes('real people')) {
      categories['Music Promotion Strategy'].push(post);
    } else if (t.includes('journey') || t.includes('participate') || t.includes('balance') || t.includes('hiring') || t.includes('look for') || t.includes('artist')) {
      categories['Artist Journey'].push(post);
    } else if (t.includes('record deal') || t.includes('walked away') || t.includes('worlds collide') || t.includes('founder') || t.includes('robert')) {
      categories['Founder Stories'].push(post);
    } else {
      categories['Other'].push(post);
    }
  }

  for (const [category, posts] of Object.entries(categories)) {
    if (posts.length === 0 && category !== 'Other') continue;
    if (category === 'Other' && posts.length === 0) continue;

    // Only include non-empty sections
    const nonEmpty = posts.filter(p => p.title && p.slug);
    if (nonEmpty.length === 0) continue;

    lines.push(`### ${category}`);
    for (const post of nonEmpty) {
      lines.push(`- ${post.title} — /blog/${post.slug}`);
    }
    lines.push('');
  }

  // ── Community ──
  lines.push('## Community');
  lines.push('Artist pages at /artist/[slug] accept community corrections. Verified edits are reviewed by human moderators. Each page tracks edit history and contributor count.');
  lines.push('- Suggest an edit: any artist page via the "Was this helpful?" survey at the bottom');
  lines.push('- Edit history: visible on each artist page (Phase 2)');
  lines.push('- Moderation: 24-hour review target for most suggestions');
  lines.push('');

  // ── Open source ──
  lines.push('## Open source');
  lines.push('- GitHub: github.com/robertjanmastenbroek/selah.fm');
  lines.push('- MIT License');
  lines.push('- Stack: Next.js 14, TypeScript, Supabase PostgreSQL, Tailwind CSS, DeepSeek AI');
  lines.push('- Auto-deployed on Railway from main branch');
  lines.push('- 17 cron workers: blog pipeline, bio generation, data enrichment (Wikipedia, YouTube, Bandcamp, Wikidata), email outreach, and more');
  lines.push('');

  const body = lines.join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
