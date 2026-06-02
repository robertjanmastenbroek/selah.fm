import type { Metadata } from 'next';
import Link from 'next/link';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Creator Earnings Guide — How Much Do Creators Earn in 2026? | Selah.fm',
  description: 'Compare creator earnings across TikTok, Reels, Shorts, and Selah.fm. See real payout math, CPM models, and how to earn more as a content creator.',
  openGraph: {
    title: 'Creator Earnings Guide — How Much Do Creators Earn in 2026?',
    description: 'Compare creator earnings across TikTok, Reels, Shorts, and Selah.fm. See real payout math, CPM models, and how to earn more as a content creator.',
    url: 'https://selah.fm/guides/creator-earnings',
    type: 'article',
  },
};

async function getRelatedPosts() {
  const posts = await sql`
    SELECT title, slug, excerpt, published_at FROM blog_posts 
    WHERE status = 'published' AND (title ILIKE '%earn%' OR title ILIKE '%creat%' OR title ILIKE '%payout%' OR title ILIKE '%money%' OR title ILIKE '%cpm%')
    ORDER BY published_at DESC LIMIT 8
  `;
  return posts;
}

export default async function CreatorEarningsGuide() {
  const posts = await getRelatedPosts();

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23' }}>
      <main className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
          Creator Earnings Guide
        </h1>
        <p className="text-muted-foreground text-lg mb-4 max-w-2xl">
          How much do creators actually earn in 2026? We break down real payouts on TikTok, Instagram Reels, YouTube Shorts, and compare them to the Selah.fm CPM model — where you set your own rate.
        </p>
        <p className="text-xs text-muted-foreground/40 mb-12">Last updated: June 2, 2026</p>

        <div className="prose prose-invert max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4">How Much Do Creators Actually Earn?</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>The short answer: not nearly enough from the platforms themselves. TikTok's Creator Fund pays roughly $0.02-$0.04 per 1,000 views. YouTube Shorts pays $0.01-$0.06 per 1,000 views. Instagram Reels pays through unpredictable bonuses — no fixed per-view rate exists.</p>
              <p>For context: a video that gets 1 million views on TikTok earns the creator between $20 and $40 from the platform. That's less than minimum wage when you factor in the time to script, film, edit, and post.</p>
              <p>The real money for creators comes from brand deals, sponsorships, affiliate marketing — and music promotion campaigns. Selah.fm flips the model: instead of the platform setting your rate, you earn what the artist sets as their CPM. At $2,000/1M views, that same 1M-view video pays $2,000 — <strong>100x more</strong> than TikTok's Creator Fund.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Platform Creator Payouts Compared</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 px-3 font-semibold">Platform</th>
                    <th className="text-left py-2 px-3 font-semibold">Payout Model</th>
                    <th className="text-left py-2 px-3 font-semibold">Per 1M Views</th>
                    <th className="text-left py-2 px-3 font-semibold">Requirements</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-2 px-3">TikTok Creator Fund</td>
                    <td className="py-2 px-3">Fixed per-view pool</td>
                    <td className="py-2 px-3">$20-$40</td>
                    <td className="py-2 px-3">10K followers, 100K views/30 days</td>
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-2 px-3">TikTok Creativity Program</td>
                    <td className="py-2 px-3">RPM based (60s+ videos)</td>
                    <td className="py-2 px-3">$400-$600</td>
                    <td className="py-2 px-3">10K followers, 100K views/30 days, 60s+ videos</td>
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-2 px-3">Instagram Reels</td>
                    <td className="py-2 px-3">Invite-only bonuses</td>
                    <td className="py-2 px-3">$0-$1,200 (variable)</td>
                    <td className="py-2 px-3">Invite only, no public eligibility</td>
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-2 px-3">YouTube Shorts</td>
                    <td className="py-2 px-3">Ad revenue share pool</td>
                    <td className="py-2 px-3">$10-$60</td>
                    <td className="py-2 px-3">1K subscribers, 10M Shorts views/90 days</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-[#22C55E]">Selah.fm</td>
                    <td className="py-2 px-3">Artist-set CPM</td>
                    <td className="py-2 px-3 font-semibold text-[#22C55E]">$500-$5,000+</td>
                    <td className="py-2 px-3">No minimums — just make good content</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground/50 mt-2">On Selah.fm, creators earn the full CPM rate the artist sets — zero deductions from the creator side. The 20% platform fee is paid by the artist on top of the CPM.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">How CPM Earnings Work on Selah.fm</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>CPM stands for Cost Per Mille — the rate per 1,000 views. On Selah.fm, rates are displayed per 1,000,000 views for readability. Here's how it breaks down:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>You choose which campaigns to create for.</strong> Browse open music promotion campaigns, pick tracks you like, and create content.</li>
                <li><strong>The CPM rate is locked when you submit.</strong> Once a campaign gets its first submission, the CPM cannot change. You know exactly what you'll earn per view.</li>
                <li><strong>You earn for verified views only.</strong> Views are pulled from the platform's public view count. No inflated numbers, no bots.</li>
                <li><strong>You keep 100% of the CPM.</strong> Artists pay a 20% platform fee on top of the CPM. Creators receive the full CPM rate with no deductions (Stripe payout fees may apply).</li>
              </ul>
              <p>This model puts creators in control. You're not hoping for a bonus or fighting a mysterious algorithm — you're earning a transparent, fixed rate for every view you generate.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Real Earnings Scenarios</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <div className="rounded-lg border border-white/[0.06] p-4 bg-white/[0.02]">
                <h3 className="font-semibold text-base mb-2">Scenario 1: Small Creator, Consistent Output</h3>
                <p className="text-sm">You make 5 TikToks for a $500/1M CPM campaign. Each video gets ~10,000 views. That's 50,000 total views across 5 videos.</p>
                <p className="text-sm mt-1"><strong>Earnings:</strong> 50,000 views ÷ 1,000,000 × $500 = <strong className="text-[#22C55E]">$25.00</strong></p>
                <p className="text-xs text-muted-foreground/50 mt-1">Compare: TikTok Creator Fund would pay ~$1.00-$2.00 for the same views.</p>
              </div>

              <div className="rounded-lg border border-white/[0.06] p-4 bg-white/[0.02]">
                <h3 className="font-semibold text-base mb-2">Scenario 2: Mid-Tier Creator, One Hit</h3>
                <p className="text-sm">One of your Reels for a $2,000/1M CPM campaign blows up to 500,000 views.</p>
                <p className="text-sm mt-1"><strong>Earnings:</strong> 500,000 views ÷ 1,000,000 × $2,000 = <strong className="text-[#22C55E]">$1,000.00</strong></p>
                <p className="text-xs text-muted-foreground/50 mt-1">Compare: Instagram Reels bonuses are invite-only and unpredictable — you might get $0 for the same video.</p>
              </div>

              <div className="rounded-lg border border-white/[0.06] p-4 bg-white/[0.02]">
                <h3 className="font-semibold text-base mb-2">Scenario 3: Established Creator, High CPM</h3>
                <p className="text-sm">You produce 3 TikToks for a $5,000/1M CPM campaign. Combined they hit 800,000 views.</p>
                <p className="text-sm mt-1"><strong>Earnings:</strong> 800,000 views ÷ 1,000,000 × $5,000 = <strong className="text-[#22C55E]">$4,000.00</strong></p>
                <p className="text-xs text-muted-foreground/50 mt-1">Compare: TikTok Creativity Program pays ~$320-$480 for the same views, and only for 60-second videos.</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">These aren't hypotheticals — creators on Selah.fm earn 10-100x what platforms pay for the exact same content. The key difference is you're earning from the artist's promotion budget, not the platform's ad revenue share.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Why Platform Creator Funds Fall Short</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>Platform creator funds aren't designed to pay creators fairly. They're designed to keep you on the platform, posting more content:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Fixed pools, growing creators.</strong> TikTok's Creator Fund is a fixed $1B pool. As more creators join, each person's share shrinks.</li>
                <li><strong>Opaque algorithms.</strong> No platform publishes exactly how payouts are calculated. Creators report wild inconsistencies.</li>
                <li><strong>Arbitrary eligibility.</strong> Instagram Reels bonuses appear and disappear. YouTube Shorts requires 10M views in 90 days just to qualify.</li>
                <li><strong>Gaming the system.</strong> Low per-view rates incentivize quantity over quality — spam content that chases views rather than genuine creative work.</li>
              </ul>
              <p>Selah.fm's model is different. The artist sets the rate, the creator chooses to participate, and the payment is transparent. No algorithm, no mystery pool — just verified views × CPM rate.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Getting Started as a Creator</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>Ready to earn from your content? Here's how to start:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Sign up for free at <Link href="/login" className="text-primary hover:underline">selah.fm/login</Link> — no follower minimums, no approval process.</li>
                <li>Browse open campaigns. Filter by CPM rate, genre, and budget to find tracks you actually like.</li>
                <li>Create content. Make TikToks, Reels, or Shorts featuring the track. Be creative — artists approve every submission.</li>
                <li>Submit your video link. Paste the public URL and wait for artist approval.</li>
                <li>Get paid per view. Once approved, your video starts earning. Track views and earnings in real time from your dashboard.</li>
              </ol>
              <p className="mt-4">Pro tip: The best-earning creators treat this like curation. Pick tracks you genuinely like, make content your audience will engage with, and submit videos that feel native to your feed. Artists approve videos that feel authentic — because those are the ones that get views.</p>
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
        headline: 'Creator Earnings Guide — How Much Do Creators Earn in 2026?',
        description: 'Compare creator earnings across TikTok, Reels, Shorts, and Selah.fm. See real payout math, CPM models, and how to earn more as a content creator.',
        author: { '@type': 'Person', name: 'Robert-Jan Mastenbroek', url: 'https://selah.fm/about' },
        publisher: { '@type': 'Organization', name: 'Selah.fm' },
        datePublished: '2026-06-02',
      }) }} />
    </div>
  );
}
