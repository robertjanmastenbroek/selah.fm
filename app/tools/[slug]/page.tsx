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
