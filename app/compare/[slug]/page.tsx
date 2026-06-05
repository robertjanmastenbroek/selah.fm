import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

const COMPARISONS: Record<string, { competitor: string; url: string; pros: string[]; cons: string[] }> = {
  'selah-vs-tiktok-creator-fund': {
    competitor: 'TikTok Creator Fund',
    url: 'https://www.tiktok.com/creators/creator-fund',
    pros: ['Built into TikTok, no setup needed', 'Automatic enrollment', 'No platform fees'],
    cons: ['Pays $0.02-0.05 per 1K views', 'Limited availability by region', 'TikTok controls all terms', 'No direct artist-to-creator connection'],
  },
  'selah-vs-youtube-shorts': {
    competitor: 'YouTube Shorts Fund',
    url: 'https://www.youtube.com/shorts',
    pros: ['Huge built-in audience', 'Monetization through YPP', 'Longer content lifespan'],
    cons: ['Shorts Fund pays $0.01-0.06 per 1K views', 'Requires 1K subs + 10M Shorts views', 'Revenue share model', 'No guaranteed CPM'],
  },
  'selah-vs-instagram-reels': {
    competitor: 'Instagram Reels Bonus',
    url: 'https://business.instagram.com/reels',
    pros: ['Invite-only bonuses can pay well', 'Large creator community', 'Cross-posting to Facebook'],
    cons: ['Bonus program is invite-only', 'No permanent monetization model', 'Bonus amounts unpredictable', "Must use Instagram's music library"],
  },
};

function formatTitle(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const comparison = COMPARISONS[params.slug];
  if (!comparison) { return { title: 'Comparison Not Found' }; }

  const title = `Selah.fm vs ${comparison.competitor}: Which is Better for Music Promotion?`;
  const description = `Compare Selah.fm with ${comparison.competitor}. See CPM rates, features, pros and cons. Selah.fm is the open-source alternative.`;

  return {
    title,
    description,
    openGraph: { title, description, url: `https://selah.fm/compare/${params.slug}`, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `https://selah.fm/compare/${params.slug}` },
  };
}

export default async function ComparePage({ params }: Props) {
  const comparison = COMPARISONS[params.slug];
  if (!comparison) notFound();

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <nav className="mb-6">
          <ol className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40">
            <li><Link href="/" className="hover:text-muted-foreground transition-colors">Selah.fm</Link></li>
            <li className="text-muted-foreground/20">/</li>
            <li><Link href="/browse" className="hover:text-muted-foreground transition-colors">Browse</Link></li>
            <li className="text-muted-foreground/20">/</li>
            <li className="text-muted-foreground/60">vs {comparison.competitor}</li>
          </ol>
        </nav>

        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
          Selah.fm vs {comparison.competitor}
        </h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-2xl">
          Compare CPM rates, features, and earnings potential. Selah.fm is the open-source 
          CPM marketplace where artists set budgets and creators earn per verified view.
        </p>

        {/* Comparison Table */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left p-4 font-semibold">Feature</th>
                <th className="text-left p-4 font-semibold text-primary">Selah.fm</th>
                <th className="text-left p-4 font-semibold">{comparison.competitor}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.06]">
                <td className="p-4 text-muted-foreground">CPM Rate</td>
                <td className="p-4 font-semibold">$0.10 - $10.00</td>
                <td className="p-4 text-muted-foreground">$0.02 - $0.06</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="p-4 text-muted-foreground">Who sets the rate?</td>
                <td className="p-4 font-semibold">Artists set their own CPM</td>
                <td className="p-4 text-muted-foreground">Platform decides</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="p-4 text-muted-foreground">Verified views</td>
                <td className="p-4 font-semibold">✅ Pay only for verified</td>
                <td className="p-4 text-muted-foreground">❌ No verification</td>
              </tr>
              <tr className="border-b border-white/[0.06]">
                <td className="p-4 text-muted-foreground">Open source</td>
                <td className="p-4 font-semibold">✅ MIT License</td>
                <td className="p-4 text-muted-foreground">❌ Proprietary</td>
              </tr>
              <tr>
                <td className="p-4 text-muted-foreground">Direct connection</td>
                <td className="p-4 font-semibold">✅ Artists ↔ Creators</td>
                <td className="p-4 text-muted-foreground">❌ No direct relationship</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pros/Cons */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
            <h2 className="font-semibold mb-4 text-primary">Selah.fm Advantage</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-green-500">✓</span>
                Artists control their budget and CPM rate
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-green-500">✓</span>
                Creators earn directly from artists
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-green-500">✓</span>
                Pay only for verified views
              </li>
              <li className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-green-500">✓</span>
                Open source and transparent
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
            <h2 className="font-semibold mb-4">{comparison.competitor} Limitations</h2>
            <ul className="space-y-2">
              {comparison.cons.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-0.5 text-red-400">✗</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Ready to earn what your content is worth?</p>
          <Link href="/welcome-creators" className="inline-flex px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity">
            Start earning on Selah.fm
          </Link>
        </div>

        {/* FAQ */}
        <section className="mt-8">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>FAQ</h2>
          <div className="space-y-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <h3 className="font-semibold text-sm mb-1">How does Selah.fm compare to {comparison.competitor}?</h3>
              <p className="text-sm text-muted-foreground">Selah.fm lets artists set their own CPM rate starting at $0.10, while {comparison.competitor} pays a fixed rate of $0.02-0.06 per 1,000 views. Artists pay only for verified views.</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <h3 className="font-semibold text-sm mb-1">Can I use both Selah.fm and {comparison.competitor}?</h3>
              <p className="text-sm text-muted-foreground">Absolutely. Selah.fm works alongside any platform. Use it to get direct CPM deals from artists while also earning from platform funds.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
