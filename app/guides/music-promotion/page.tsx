import type { Metadata } from 'next';
import Link from 'next/link';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Music Promotion Guide — How to Promote Your Music in 2026 | Selah.fm',
  description: 'Complete guide to music promotion. Learn how independent artists promote music on TikTok, Reels, and Shorts using creator-driven CPM campaigns. No label required.',
  openGraph: {
    title: 'Music Promotion Guide — How to Promote Your Music in 2026',
    description: 'Complete guide to music promotion. Learn how independent artists promote music on TikTok, Reels, and Shorts.',
    url: 'https://selah.fm/guides/music-promotion',
    type: 'article',
  },
};

async function getRelatedPosts() {
  const posts = await sql`
    SELECT title, slug, excerpt, published_at FROM blog_posts 
    WHERE status = 'published' AND (title ILIKE '%promot%' OR title ILIKE '%market%' OR title ILIKE '%tiktok%' OR title ILIKE '%creator%')
    ORDER BY published_at DESC LIMIT 8
  `;
  return posts;
}

export default async function MusicPromotionGuide() {
  const posts = await getRelatedPosts();

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23' }}>
      <main className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
          Music Promotion Guide
        </h1>
        <p className="text-muted-foreground text-lg mb-4 max-w-2xl">
          Everything independent artists need to know about promoting music in 2026. From TikTok strategies to CPM-based creator campaigns — no label, no gatekeepers, no bots.
        </p>
        <p className="text-xs text-muted-foreground/40 mb-12">Last updated: June 2, 2026</p>

        <div className="prose prose-invert max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4">The Problem With Traditional Music Promotion</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>Most independent artists spend money on promotion that doesn't work. Playlist pitching services promise thousands of streams but deliver bot farms. Meta and TikTok ads charge per impression with zero guarantee anyone actually listens. PR firms charge $2,000/month retainers for "exposure" that can't be tracked.</p>
              <p>The dirty secret: 80% of new music discovery now happens through short-form video — TikTok, Instagram Reels, YouTube Shorts. But the platforms don't pay artists for discovery. They pay creators.</p>
              <p>This guide covers what actually works in 2026: creator-driven promotion where you pay real people to make real content featuring your music. You set the budget, approve every video, and only pay for verified views.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">How Creator-Driven Promotion Works</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>Instead of paying for ads, you pay creators to make TikToks, Reels, and Shorts with your track. The math is simple:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Set your CPM rate</strong> — how much you'll pay per 1,000 verified views. Typical rates: $5-50 CPM ($5,000-$50,000 per 1M views). Higher rates attract more creators.</li>
                <li><strong>Set your budget</strong> — the total you want to spend. Example: $200 budget at $10/1M CPM = 20,000 views.</li>
                <li><strong>Creators submit videos</strong> — they browse your campaign, make content with your track, and paste the link.</li>
                <li><strong>You approve or reject</strong> — review every video before paying a cent. Reject anything that doesn't fit your vision.</li>
                <li><strong>Pay for verified views only</strong> — views are verified through the platform's public view counts. You only pay for real, organic views.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">CPM Rates: What Should You Pay?</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>CPM (Cost Per Mille) is the rate you pay per 1,000 views. On Selah.fm, rates are displayed per 1M views for clarity. Here's what different rates get you:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>$500/1M views</strong> — Entry-level. Attracts smaller creators. Good for testing. $50 budget = 100,000 views.</li>
                <li><strong>$2,000/1M views</strong> — Mid-range. Attracts creators with 10K-100K followers. $200 budget = 100,000 views.</li>
                <li><strong>$5,000-10,000/1M views</strong> — Competitive. Attracts established creators. $500 budget = 50,000-100,000 views from higher-quality content.</li>
              </ul>
              <p>A 20% platform fee is added on top of your CPM rate. Creators earn the full CPM — no deductions. Stripe fees are separate (2.9% + $0.30).</p>
              <p><strong>Important:</strong> CPM rates are locked once your campaign receives its first submission. This protects creators — they submitted at a specific rate expecting that payout. To change your rate, create a new campaign.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Platform Comparison: Where Should Creators Post?</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 px-3 font-semibold">Platform</th>
                    <th className="text-left py-2 px-3 font-semibold">Format</th>
                    <th className="text-left py-2 px-3 font-semibold">Best For</th>
                    <th className="text-left py-2 px-3 font-semibold">Creator Earnings</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-2 px-3">TikTok</td>
                    <td className="py-2 px-3">9:16 vertical, 15-60s</td>
                    <td className="py-2 px-3">Viral potential, dance/trend</td>
                    <td className="py-2 px-3">$0.02-0.04/1K views (Creator Fund)</td>
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-2 px-3">Instagram Reels</td>
                    <td className="py-2 px-3">9:16 vertical, 15-90s</td>
                    <td className="py-2 px-3">Aesthetic, lifestyle, fashion</td>
                    <td className="py-2 px-3">Bonus-based (no per-view rate)</td>
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-2 px-3">YouTube Shorts</td>
                    <td className="py-2 px-3">9:16 vertical, 15-60s</td>
                    <td className="py-2 px-3">Music, tutorials, reactions</td>
                    <td className="py-2 px-3">$0.01-0.06/1K views</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-[#22C55E]">Selah.fm</td>
                    <td className="py-2 px-3">Any platform</td>
                    <td className="py-2 px-3">You set the rate</td>
                    <td className="py-2 px-3 font-semibold text-[#22C55E]">Full CPM (you set it)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground/50 mt-2">On Selah.fm, creators earn the full CPM rate you set — 100x more than platform creator funds for the same content.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>Ready to promote your music? Here's your first campaign checklist:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Create a free Selah.fm account at <Link href="/login" className="text-primary hover:underline">selah.fm/login</Link></li>
                <li>Upload your track and set your CPM rate and budget</li>
                <li>Write a clear campaign brief — what kind of videos do you want?</li>
                <li>Share your campaign link with your audience</li>
                <li>Review and approve submissions as they come in</li>
              </ol>
              <p className="mt-4">The best campaigns get results because they're clear about what they want. Include reference videos, specific hashtags, and vibe descriptions. Creators want to make content that gets approved — help them help you.</p>
            </div>
          </section>
        </div>

        {posts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-white/[0.06]">
            <h2 className="text-2xl font-bold mb-6">Related articles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {posts.map((post: any) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 hover:border-primary/20 transition-colors">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{post.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.excerpt}</p>
                  <span className="text-[10px] text-muted-foreground/50">{new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'Music Promotion Guide — How to Promote Your Music in 2026',
        description: 'Complete guide to music promotion. Learn how independent artists promote music on TikTok, Reels, and Shorts using creator-driven CPM campaigns.',
        author: { '@type': 'Person', name: 'Robert-Jan Mastenbroek', url: 'https://selah.fm/about' },
        publisher: { '@type': 'Organization', name: 'Selah.fm' },
        datePublished: '2026-06-02',
      }) }} />
    </div>
  );
}
