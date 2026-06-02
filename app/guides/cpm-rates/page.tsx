import type { Metadata } from 'next';
import Link from 'next/link';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CPM Rates Guide — How to Set Your Music Promotion Budget | Selah.fm',
  description: 'Understand CPM rates for music promotion. Learn how to calculate your budget, choose the right rate tier, and attract creators on Selah.fm. Includes platform fee and CPM lock policy.',
  openGraph: {
    title: 'CPM Rates Guide — How to Set Your Music Promotion Budget',
    description: 'Understand CPM rates for music promotion. Learn how to calculate your budget, choose the right rate tier, and attract creators on Selah.fm.',
    url: 'https://selah.fm/guides/cpm-rates',
    type: 'article',
  },
};

async function getRelatedPosts() {
  const posts = await sql`
    SELECT title, slug, excerpt, published_at FROM blog_posts 
    WHERE status = 'published' AND (title ILIKE '%cpm%' OR title ILIKE '%rate%' OR title ILIKE '%budget%' OR title ILIKE '%cost%' OR title ILIKE '%price%')
    ORDER BY published_at DESC LIMIT 8
  `;
  return posts;
}

export default async function CpmRatesGuide() {
  const posts = await getRelatedPosts();

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23' }}>
      <main className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
          CPM Rates Guide
        </h1>
        <p className="text-muted-foreground text-lg mb-4 max-w-2xl">
          Everything you need to know about CPM rates for music promotion. Learn how to set the right rate, calculate your budget, and understand the platform fees — so you get the most views for your money.
        </p>
        <p className="text-xs text-muted-foreground/40 mb-12">Last updated: June 2, 2026</p>

        <div className="prose prose-invert max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4">What Is CPM?</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>CPM stands for <strong>Cost Per Mille</strong> — the cost per one thousand impressions or views. In music promotion, CPM is the rate you pay creators for every 1,000 verified views their content generates.</p>
              <p>On Selah.fm, CPM rates are displayed per 1,000,000 views (1M) for readability. So when you see "$2,000/1M," that means you're paying $2.00 for every 1,000 views — or $2,000 for a full million views.</p>
              <div className="rounded-lg border border-white/[0.06] p-4 bg-white/[0.02] mt-3">
                <p className="text-sm"><strong>Quick conversion:</strong> CPM per 1M ÷ 1,000 = CPM per 1K. So $2,000/1M = $2.00/1K views.</p>
              </div>
              <p>This is different from advertising CPM (where you pay per ad impression whether anyone engages or not). With Selah.fm CPM, you pay for <strong>verified organic views</strong> — real people watching real content featuring your music.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">How to Calculate Your Budget</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>Your total campaign cost has two components: the CPM payout to creators and the 20% platform fee. Here's the formula:</p>
              <div className="rounded-lg border border-white/[0.06] p-4 bg-white/[0.02]">
                <p className="text-sm"><strong>Total Cost = (Desired Views ÷ 1,000,000) × CPM Rate × 1.20</strong></p>
              </div>
              <p>Let's walk through a few examples:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>$100 budget, $500/1M CPM:</strong> You pay $83.33 to creators + $16.67 platform fee. Creators earn for ~166,000 views.</li>
                <li><strong>$250 budget, $2,000/1M CPM:</strong> You pay $208.33 to creators + $41.67 platform fee. Creators earn for ~104,000 views.</li>
                <li><strong>$1,000 budget, $5,000/1M CPM:</strong> You pay $833.33 to creators + $166.67 platform fee. Creators earn for ~166,000 views.</li>
              </ul>
              <p>The key insight: higher CPM rates attract more creators, which means more submissions and potentially more total views — but each view costs more. Lower CPM rates stretch your budget further but may attract fewer submissions.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">CPM Rate Tiers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left py-2 px-3 font-semibold">Tier</th>
                    <th className="text-left py-2 px-3 font-semibold">CPM Rate (per 1M views)</th>
                    <th className="text-left py-2 px-3 font-semibold">Who It Attracts</th>
                    <th className="text-left py-2 px-3 font-semibold">Best For</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-2 px-3"><strong>Entry</strong></td>
                    <td className="py-2 px-3">$500/1M</td>
                    <td className="py-2 px-3">Smaller creators, micro-influencers</td>
                    <td className="py-2 px-3">Testing the waters, small budgets</td>
                  </tr>
                  <tr className="border-b border-white/[0.03]">
                    <td className="py-2 px-3"><strong>Standard</strong></td>
                    <td className="py-2 px-3">$2,000/1M</td>
                    <td className="py-2 px-3">Creators with 10K-100K followers</td>
                    <td className="py-2 px-3">Serious promotion, mid-range budgets</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3"><strong>Premium</strong></td>
                    <td className="py-2 px-3">$5,000-$10,000/1M</td>
                    <td className="py-2 px-3">Established creators, high engagement</td>
                    <td className="py-2 px-3">Maximum reach, competitive genres</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground/50 mt-2">Higher CPM rates signal to creators that you're serious. The best creators filter campaigns by CPM — make sure yours stands out.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Platform Fee Explained (20%)</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>Selah.fm charges a <strong>20% platform fee</strong> on top of your CPM rate. This fee covers:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>View verification infrastructure</strong> — we pull public view counts from TikTok, Instagram, and YouTube to verify every view.</li>
                <li><strong>Payment processing</strong> — managing payouts to creators across Stripe Connect.</li>
                <li><strong>Campaign hosting and discovery</strong> — your campaign is listed for creators to browse, filter, and submit to.</li>
                <li><strong>Fraud detection</strong> — automated systems that flag suspicious view patterns.</li>
              </ul>
              <p>The fee is calculated on top of your CPM rate — it does not come out of the creator's earnings. Creators receive exactly the CPM rate you set. If you set $2,000/1M, creators earn $2,000 for every million views. The platform fee is a separate line item you pay as the artist.</p>
              <div className="rounded-lg border border-white/[0.06] p-4 bg-white/[0.02]">
                <p className="text-sm"><strong>Example:</strong> You set a $2,000/1M CPM with a $100 budget. Creators get $83.33 of that for views. Selah.fm charges $16.67 (20%). Stripe processing fees (~2.9% + $0.30) apply separately.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">CPM Lock Policy</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>Once your campaign receives its first submission, the CPM rate is <strong>locked</strong>. This is a core protection for creators:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Why it locks:</strong> Creators submit content based on the CPM rate you advertised. Changing the rate after submissions would be unfair — they committed effort expecting a specific payout.</li>
                <li><strong>When it locks:</strong> Immediately upon the first approved submission. You can edit your CPM freely before that point.</li>
                <li><strong>What you can still change:</strong> Your campaign budget, description, track, and creative brief can be updated at any time — even after CPM is locked.</li>
                <li><strong>To change your rate:</strong> Create a new campaign with the new CPM rate. You can run multiple campaigns simultaneously at different rates.</li>
              </ul>
              <p>This policy ensures trust on both sides. Creators know their rate won't drop after they invest time making content. Artists can still experiment by running multiple campaigns at different CPM tiers.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Choosing the Right CPM Rate</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>Not sure what rate to pick? Here's a decision framework:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Start low if you're testing.</strong> $500/1M is a great entry point. Run a small campaign ($50-100) to see what kind of content creators make for your track.</li>
                <li><strong>Go mid-range for serious promotion.</strong> $2,000/1M is the sweet spot for most artists. It attracts creators with established audiences without breaking the bank.</li>
                <li><strong>Go premium for competitive genres.</strong> Hip-hop, pop, and EDM are crowded. $5,000+/1M helps your campaign stand out when creators are filtering by CPM.</li>
                <li><strong>Run multiple campaigns.</strong> The best strategy: one campaign at $500/1M for volume, another at $2,000/1M for quality. See which performs better for your track.</li>
              </ol>
              <p className="mt-4">Remember: CPM is about <strong>attracting creators</strong>, not just buying views. A higher CPM signals that you value creators' time and effort. The most talented creators sort by CPM — they want campaigns that pay fairly.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>Ready to launch your first campaign? Here's your setup checklist:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Create a free account at <Link href="/login" className="text-primary hover:underline">selah.fm/login</Link></li>
                <li>Upload your track and fill in your campaign details</li>
                <li>Set your CPM rate — use the tiers above as a guide</li>
                <li>Set your total budget — remember the 20% platform fee</li>
                <li>Write a compelling campaign brief so creators know exactly what you want</li>
                <li>Launch and monitor — review submissions as they come in</li>
              </ol>
              <p className="mt-4">Track your results from the dashboard. You'll see real-time view counts, creator earnings, and remaining budget. If one CPM rate isn't working, launch another campaign at a different rate — there's no limit.</p>
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
        headline: 'CPM Rates Guide — How to Set Your Music Promotion Budget',
        description: 'Understand CPM rates for music promotion. Learn how to calculate your budget, choose the right rate tier, and attract creators on Selah.fm.',
        author: { '@type': 'Person', name: 'Robert-Jan Mastenbroek', url: 'https://selah.fm/about' },
        publisher: { '@type': 'Organization', name: 'Selah.fm' },
        datePublished: '2026-06-02',
      }) }} />
    </div>
  );
}
