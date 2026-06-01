import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import { CpmCalculator, CreatorEarningsEstimator, PromotionBudgetPlanner } from '@/components/ToolCalculators';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour for fresh CPM data

// ── Valid tool slugs ──────────────────────────────────────────────

const VALID_TOOLS = ['cpm-calculator', 'creator-earnings', 'promotion-budget'];

const TOOL_META: Record<string, { title: string; description: string }> = {
  'cpm-calculator': {
    title: 'CPM Calculator — See What Creators Earn Per 1,000 Views',
    description: 'Compare CPM rates across TikTok, YouTube, and Selah.fm. Calculate your earnings or campaign budget with real-time marketplace data.',
  },
  'creator-earnings': {
    title: 'Creator Earnings Estimator — How Much Can You Make?',
    description: 'Estimate your monthly earnings as a short-form video creator. Compare Selah.fm payouts vs TikTok Creator Fund and YouTube Partner Program.',
  },
  'promotion-budget': {
    title: 'Music Promotion Budget Planner — What Your Budget Buys',
    description: 'Plan your music promotion budget. See exactly how many verified views $10, $50, or $500 buys on Selah.fm vs traditional ads.',
  },
};

// ── FAQ data per tool — targets Google "People Also Ask" ──────────

const TOOL_FAQ: Record<string, { q: string; a: string }[]> = {
  'cpm-calculator': [
    { q: 'What is a good CPM rate for music promotion?', a: 'A good CPM rate depends on what you want. TikTok pays creators $0.02–0.04 per 1,000 views through the Creator Fund. YouTube Shorts pays $0.01–0.06. Instagram Reels Bonus (invite-only) pays $0.50–1.00. On Selah.fm, artists set their own CPM — most campaigns average $10 per 1,000 verified views, meaning creators earn significantly more than any platform fund.' },
    { q: 'How does CPM work for TikTok music promotion?', a: 'CPM (cost per mille) means you pay per 1,000 verified views. Instead of guessing with ads, you set a budget, creators make videos using your song, and you only pay when the views are verified. No bots. No wasted spend.' },
    { q: 'Why does TikTok pay creators so little?', a: "TikTok's Creator Fund splits a fixed pool among millions of creators. The math doesn't work in creators' favor — you need millions of views to earn meaningful money. Selah.fm flips this: artists directly pay creators at rates they set, so creators earn what their content is actually worth." },
    { q: 'Can content creators really make money from CPM?', a: 'Yes. With the right CPM rate and consistent views, creators can earn real income. For example, at $10 CPM and 100,000 views per month, that\'s $1,000/month — far more than platform funds pay for the same views. Browse campaigns on Selah.fm to see real rates artists are offering right now.' },
    { q: 'What CPM rate should I set for my music campaign?', a: 'Most artists on Selah.fm set rates between $5 and $30 per 1,000 views. Higher rates attract more creators and better content. A good starting point: $10 CPM. That\'s competitive enough to get quality submissions without blowing your budget. You can always adjust it.' },
  ],
  'creator-earnings': [
    { q: 'How much do content creators earn per 1,000 views?', a: 'It depends on the platform. TikTok Creator Fund pays $0.02–0.04 per 1,000 views. YouTube Shorts pays $0.01–0.06. But on Selah.fm, creators earn whatever CPM the artist sets — typically $5–30 per 1,000 verified views. That\'s 100x more than platform funds for the same content.' },
    { q: 'Can you make a living as a short-form video creator?', a: 'Yes, but not through platform funds alone. The TikTok Creator Fund pays pennies. Real creator income comes from brand deals, fan support, and marketplaces like Selah.fm where you get paid directly for promoting music. Consistency and quality matter more than follower count.' },
    { q: 'How does Selah.fm compare to the TikTok Creator Fund?', a: "Selah.fm pays creators per verified view at rates set by artists — typically $5–30 CPM. The TikTok Creator Fund pays around $0.02–0.04 CPM. That means Selah.fm creators earn roughly 100–500x more per view. And you're making music promotion content, which is what you'd be doing anyway." },
    { q: 'Do I need millions of followers to earn as a creator?', a: 'No. Unlike brand deals that care about follower count, CPM-based promotion cares about views. A creator with 2,000 followers who consistently gets 10,000 views per video can earn more than someone with 100,000 followers. What matters is making engaging content that gets watched.' },
    { q: 'How do creators get paid on Selah.fm?', a: 'Creators connect their Stripe account during onboarding. After your videos are approved and views are verified, payouts happen automatically. Artists pay for verified views — you earn exactly what the campaign CPM promises. No waiting for a fund to distribute pennies.' },
  ],
  'promotion-budget': [
    { q: 'How much does it cost to promote a song?', a: 'It depends on your goals. $10 can get you hundreds of real views via Selah.fm creators. $50 gets thousands. The key difference from traditional ads: you only pay for verified views. No bots, no wasted impressions. Set a budget that fits your release strategy and adjust based on results.' },
    { q: "Is $100 enough to promote a song?", a: "Yes. $100 at a typical Selah.fm CPM rate of $10/1,000 views gives you around 10,000 verified views across multiple creator videos. That's real people watching real content featuring your song — not ad impressions people scroll past. For an independent artist, that's meaningful exposure." },
    { q: "What's the best way to promote music on a small budget?", a: 'Start with $25–50 on Selah.fm. Set a competitive CPM rate ($10–15) to attract creators. Write clear campaign requirements so creators know exactly what kind of video you want. Focus on one platform (TikTok works best for music discovery). If one creator\'s video takes off, you can always increase the budget.' },
    { q: 'How many views can I get for $50?', a: 'At $10 CPM, $50 buys about 5,000 verified views. At $5 CPM, that doubles to 10,000. The actual number depends on the rate you set and how many creators participate. Higher CPM attracts more creators, which means more total videos and views — but costs more per thousand.' },
    { q: 'Is playlist pitching better than paying creators?', a: "Playlist pitching puts your song in a list — but you don't control who listens or if they're real. Creator promotion puts your song in videos that real people watch because they're entertaining. 80% of new music discovery happens through short-form video now. Paying creators gives you organic discovery that lasts beyond a playlist placement." },
  ],
};

// ── Fetch live CPM data ───────────────────────────────────────────

async function getLiveCpmData() {
  try {
    const [row] = await sql`
      SELECT COALESCE(AVG(cpm_rate_cents), 0)::int as avg_cpm_cents,
             COUNT(*)::int as campaign_count
      FROM campaigns WHERE cpm_rate_cents > 0
    `;
    const avgCpm = (row?.avg_cpm_cents || 100) / 100; // Default $1.00 CPM if no data
    return { avgCpm, campaignCount: row?.campaign_count || 0 };
  } catch {
    return { avgCpm: 1.00, campaignCount: 0 };
  }
}

// ── Metadata ──────────────────────────────────────────────────────

interface Props { params: { slug: string } }

export function generateStaticParams() {
  return VALID_TOOLS.map(slug => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const meta = TOOL_META[params.slug];
  if (!meta) return { title: 'Tools — Selah.fm' };

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://selah.fm/tools/${params.slug}`,
      siteName: 'Selah.fm',
      images: [{ url: 'https://selah.fm/images/og-image.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: ['https://selah.fm/images/og-image.jpg'],
    },
    alternates: { canonical: `https://selah.fm/tools/${params.slug}` },
  };
}

// ── Page ─────────────────────────────────────────────────────────

export default async function ToolPage({ params }: Props) {
  // Redirect old thin tool pages to the most relevant new tool
  if (!VALID_TOOLS.includes(params.slug)) {
    // Map old slugs to relevant new tools
    const redirectMap: Record<string, string> = {
      'music-promotion': 'promotion-budget',
      'promote-music': 'promotion-budget',
      'independent-artist': 'promotion-budget',
      'spotify-promotion': 'promotion-budget',
      'tiktok-promotion': 'promotion-budget',
      'earn-money': 'creator-earnings',
      'cpm-rates': 'cpm-calculator',
      'side-hustle': 'creator-earnings',
      'tiktok-marketing': 'promotion-budget',
      'hire-creators': 'creator-earnings',
      'creator-marketplace': 'creator-earnings',
    };
    const target = redirectMap[params.slug] || 'cpm-calculator';
    redirect(`/tools/${target}`);
  }

  const { avgCpm, campaignCount } = await getLiveCpmData();

  const meta = TOOL_META[params.slug];

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.15) 0%, #0F0F23 60%), #0F0F23' }}>
      {/* FAQ Schema — Google "People Also Ask" rich results */}
      {TOOL_FAQ[params.slug] && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: TOOL_FAQ[params.slug].map(faq => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: { '@type': 'Answer', text: faq.a },
              })),
            }),
          }}
        />
      )}
      <article className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        {/* Breadcrumb */}
        <nav className="text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
          <a href="/" className="hover:text-foreground">Selah.fm</a>
          <span className="mx-2">/</span>
          <span className="text-foreground">{meta.title.split(' — ')[0]}</span>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            {meta.title.split(' — ')[0]}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            {meta.description}
          </p>
          {campaignCount > 0 && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live data from {campaignCount} active campaign{campaignCount !== 1 ? 's' : ''} on Selah.fm
            </p>
          )}
        </header>

        {/* Tool content */}
        {params.slug === 'cpm-calculator' && <CpmCalculator avgCpm={avgCpm} />}
        {params.slug === 'creator-earnings' && <CreatorEarningsEstimator avgCpm={avgCpm} />}
        {params.slug === 'promotion-budget' && <PromotionBudgetPlanner avgCpm={avgCpm} />}

        {/* FAQ Section — keyword-rich, targets Google "People Also Ask" */}
        {TOOL_FAQ[params.slug] && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Frequently asked questions</h2>
            <div className="space-y-6">
              {TOOL_FAQ[params.slug].map((faq, i) => (
                <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
                  <h3 className="font-semibold text-sm mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Read more on the blog */}
        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">Read more on our blog</h2>
          <div className="flex flex-wrap gap-3">
            {params.slug === 'cpm-calculator' && (
              <>
                <a href="/blog" className="text-sm text-primary hover:underline">CPM strategies for independent artists →</a>
                <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How to set your campaign CPM rate →</a>
              </>
            )}
            {params.slug === 'creator-earnings' && (
              <>
                <a href="/blog" className="text-sm text-primary hover:underline">How creators earn on Selah.fm →</a>
                <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">TikTok Creator Fund vs direct CPM →</a>
              </>
            )}
            {params.slug === 'promotion-budget' && (
              <>
                <a href="/blog" className="text-sm text-primary hover:underline">Music promotion on a budget →</a>
                <a href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How to get the most views for your money →</a>
              </>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 p-8 rounded-2xl bg-primary/[0.04] border border-primary/10 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join Selah.fm and connect with real creators who will promote your music on TikTok, Reels, and Shorts.
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/welcome-artists" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
              I'm an artist
            </a>
            <a href="/welcome-creators" className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] font-semibold text-sm hover:bg-white/[0.08] transition-colors">
              I'm a creator
            </a>
          </div>
        </div>
      </article>
    </div>
  );
}
