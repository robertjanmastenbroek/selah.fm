import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-static';
export const revalidate = 86400; // 24h cache

// ── Keyword database (compiled in-memory for static generation) ──
const KEYWORD_TEMPLATES: Record<string, { title: string; subtitle: string; audience: string; pillar: string }> = {
  // PILLAR 1: Music Promotion
  'music-promotion': { title: 'Music Promotion', subtitle: 'Get your tracks heard by real creators on TikTok, Reels, and Shorts. Set your budget. Pay per verified view.', audience: 'artists', pillar: 'Music Promotion' },
  'promote-music': { title: 'Promote Music', subtitle: 'Connect with creators who will promote your songs. You control the budget and only pay for results.', audience: 'artists', pillar: 'Music Promotion' },
  'independent-artist': { title: 'Independent Artist Promotion', subtitle: 'No label needed. Promote your music directly through creators who earn per view.', audience: 'artists', pillar: 'Music Promotion' },
  'indie-promotion': { title: 'Indie Music Promotion', subtitle: 'Independent artists deserve better promotion. Set your CPM, launch a campaign, get real views.', audience: 'artists', pillar: 'Music Promotion' },
  'music-marketing': { title: 'Music Marketing', subtitle: 'A new way to market your music: pay creators per verified view instead of burning money on ads.', audience: 'artists', pillar: 'Music Promotion' },
  'organic-promotion': { title: 'Organic Music Promotion', subtitle: 'Real creators. Real views. No bots. Organic promotion through short-form video creators.', audience: 'artists', pillar: 'Music Promotion' },
  'spotify-promotion': { title: 'Spotify Promotion', subtitle: 'Get on playlists and drive streams by having creators feature your track on TikTok and Reels.', audience: 'artists', pillar: 'Music Promotion' },
  'tiktok-promotion': { title: 'TikTok Music Promotion', subtitle: 'The most effective TikTok promotion: pay creators per view. Your song, their audience.', audience: 'artists', pillar: 'Music Promotion' },
  'promote-song': { title: 'Promote Your Song', subtitle: 'Launch a campaign for your single. Creators make videos using your track. You pay per view.', audience: 'artists', pillar: 'Music Promotion' },
  'music-campaign': { title: 'Music Promotion Campaign', subtitle: 'Create a campaign in 2 minutes. Set budget and CPM. Creators submit videos. You approve and pay.', audience: 'artists', pillar: 'Music Promotion' },
  'promotion-budget': { title: 'Music Promotion Budget', subtitle: 'Start from any budget. You set the CPM rate and max payout. Never overspend.', audience: 'artists', pillar: 'Music Promotion' },
  'promotion-cost': { title: 'Music Promotion Cost', subtitle: 'Transparent pricing: you choose the CPM rate. Typical rates: €0.50–€5.00 per 1,000 views.', audience: 'artists', pillar: 'Music Promotion' },
  'promotion-roi': { title: 'Music Promotion ROI', subtitle: 'Track every view. Measure every dollar. See exactly what your promotion budget is earning.', audience: 'artists', pillar: 'Music Promotion' },

  // PILLAR 2: Creator Earnings
  'earn-money': { title: 'Earn Money as a Creator', subtitle: 'Make money creating short videos. Promote music tracks and earn per verified view.', audience: 'creators', pillar: 'Creator Earnings' },
  'make-money': { title: 'Make Money Making Videos', subtitle: 'Turn your TikTok, Reels, and Shorts into income. Promote music and earn per view.', audience: 'creators', pillar: 'Creator Earnings' },
  'creator-earnings': { title: 'Creator Earnings', subtitle: 'See what top creators earn promoting music. Transparent CPM rates, verified views, fast payouts.', audience: 'creators', pillar: 'Creator Earnings' },
  'paid-views': { title: 'Get Paid for Views', subtitle: 'Every view counts. Promote music tracks and earn real money per verified view on your content.', audience: 'creators', pillar: 'Creator Earnings' },
  'content-creator': { title: 'Content Creator Income', subtitle: 'A new revenue stream for content creators: promote independent music and earn CPM-based payouts.', audience: 'creators', pillar: 'Creator Earnings' },
  'tiktok-earnings': { title: 'TikTok Creator Earnings', subtitle: 'How much can you earn promoting music on TikTok? Real CPM rates. Verified payouts.', audience: 'creators', pillar: 'Creator Earnings' },
  'tiktok-monetization': { title: 'TikTok Monetization', subtitle: 'Monetize your TikTok beyond the Creator Fund. Earn per view promoting music tracks.', audience: 'creators', pillar: 'Creator Earnings' },
  'side-hustle': { title: 'Side Hustle for Creators', subtitle: 'Make extra income creating videos. No minimum followers. Just good content that gets views.', audience: 'creators', pillar: 'Creator Earnings' },
  'cpm-rates': { title: 'CPM Rates for Creators', subtitle: 'Compare CPM rates. See what artists are paying per 1,000 views on TikTok, Reels, and Shorts.', audience: 'creators', pillar: 'Creator Earnings' },
  'cost-per-view': { title: 'Cost Per View Music Promotion', subtitle: 'How cost-per-view music promotion works. Artists pay. Creators earn. Views verified.', audience: 'both', pillar: 'Creator Earnings' },
  'pay-per-view': { title: 'Pay Per View Music Promotion', subtitle: 'The fairest model in music promotion: you only pay for views that actually happen.', audience: 'both', pillar: 'Creator Earnings' },
  'creator-calculator': { title: 'Creator Earnings Calculator', subtitle: 'Estimate your earnings. Enter your average views per video and see what you could make.', audience: 'creators', pillar: 'Creator Earnings' },

  // PILLAR 3: Platform Strategy
  'tiktok-marketing': { title: 'TikTok Marketing for Music', subtitle: 'Use TikTok creators to market your music. Set campaigns. Pay per view. Scale your reach.', audience: 'artists', pillar: 'Platform Strategy' },
  'tiktok-growth': { title: 'TikTok Growth Strategy', subtitle: 'Grow on TikTok by promoting music tracks. Earn per view while building your following.', audience: 'creators', pillar: 'Platform Strategy' },
  'instagram-reels': { title: 'Instagram Reels Promotion', subtitle: 'Promote your music through Instagram Reels creators. Same CPM model. Same verified views.', audience: 'artists', pillar: 'Platform Strategy' },
  'youtube-shorts': { title: 'YouTube Shorts Promotion', subtitle: 'Get your music on YouTube Shorts. Creators make videos. You pay per verified view.', audience: 'artists', pillar: 'Platform Strategy' },
  'platform-comparison': { title: 'Best Platform for Music Promotion', subtitle: 'TikTok vs Reels vs Shorts: which platform delivers the best ROI for music promotion?', audience: 'artists', pillar: 'Platform Strategy' },
  'vertical-video': { title: 'Vertical Video Music Promotion', subtitle: 'Vertical video is the future. Promote your music through portrait-format creator content.', audience: 'both', pillar: 'Platform Strategy' },

  // PILLAR 4: CPM
  'what-is-cpm': { title: 'What is CPM Music Promotion?', subtitle: 'CPM = Cost Per Mille (1,000 views). Artists set a rate. Creators earn per view. Simple.', audience: 'both', pillar: 'CPM & Campaign Mechanics' },
  'cpm-explained': { title: 'CPM Explained for Musicians', subtitle: 'How cost-per-thousand-views works for music promotion. No confusing ad jargon.', audience: 'artists', pillar: 'CPM & Campaign Mechanics' },
  'campaign-budget': { title: 'Set Your Campaign Budget', subtitle: 'You control the budget. Set max payout. Set CPM rate. Never spend more than you choose.', audience: 'artists', pillar: 'CPM & Campaign Mechanics' },
  'verified-views': { title: 'Verified Views Music Promotion', subtitle: 'Only pay for real, verified views. No bots. No fake streams. Transparent tracking.', audience: 'both', pillar: 'CPM & Campaign Mechanics' },
  'create-campaign': { title: 'Create a Music Campaign', subtitle: 'Launch your first campaign in 2 minutes. Pick a track. Set a budget. Creators apply.', audience: 'artists', pillar: 'CPM & Campaign Mechanics' },

  // PILLAR 5: Creator Marketplace
  'hire-creators': { title: 'Hire Content Creators', subtitle: 'Find creators who match your genre. They make videos using your music. You pay per view.', audience: 'artists', pillar: 'Creator Marketplace' },
  'find-creators': { title: 'Find Music Content Creators', subtitle: 'Browse creators by genre, platform, and view count. Find the perfect match for your track.', audience: 'artists', pillar: 'Creator Marketplace' },
  'creator-marketplace': { title: 'Creator Marketplace for Music', subtitle: 'The marketplace where artists and creators connect. Music promotion, reimagined.', audience: 'both', pillar: 'Creator Marketplace' },
  'ugc-platform': { title: 'UGC Music Promotion Platform', subtitle: 'User-generated content is the most effective music promotion. Our marketplace makes it simple.', audience: 'both', pillar: 'Creator Marketplace' },
  'ugc-creator': { title: 'UGC Creator for Music', subtitle: 'Become a UGC creator for musicians. Make authentic content. Earn real money per view.', audience: 'creators', pillar: 'Creator Marketplace' },
  'ugc-marketing': { title: 'UGC Music Marketing', subtitle: 'User-generated content marketing for music. Authentic. Scalable. Performance-based.', audience: 'artists', pillar: 'Creator Marketplace' },
  'creator-search': { title: 'Search Music Creators', subtitle: 'Find creators by genre, platform, CPM rate, and location. Your perfect match is a search away.', audience: 'artists', pillar: 'Creator Marketplace' },
  'browse-creators': { title: 'Browse Music Creators', subtitle: 'Explore our creator marketplace. Filter by TikTok, Reels, Shorts. Find your sound match.', audience: 'artists', pillar: 'Creator Marketplace' },

  // PILLAR 6: Faith
  'christian-music': { title: 'Christian Music Promotion', subtitle: 'Promote your Christian and worship music through creators who understand the message.', audience: 'artists', pillar: 'Faith & Purpose' },
  'worship-music': { title: 'Worship Music Promotion', subtitle: 'Get your worship music heard. Connect with faith-driven creators. Pay per verified view.', audience: 'artists', pillar: 'Faith & Purpose' },
  'electronic-worship': { title: 'Electronic Worship Music', subtitle: 'Promote electronic worship and Christian EDM. Find creators who match your sound and spirit.', audience: 'artists', pillar: 'Faith & Purpose' },
  'music-production': { title: 'Music Production & Promotion', subtitle: 'From bedroom producer to published artist. Promote your tracks through our creator marketplace.', audience: 'artists', pillar: 'Faith & Purpose' },
  'independent-music': { title: 'Independent Music Promotion', subtitle: 'No label. No problem. Promote your independent music directly through creators.', audience: 'artists', pillar: 'Faith & Purpose' },
};

// ── Generate page for any keyword slug ────────────────────────────

interface Props { params: { slug: string } }

export function generateStaticParams() {
  return Object.keys(KEYWORD_TEMPLATES).map(slug => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const kw = KEYWORD_TEMPLATES[params.slug];
  if (!kw) return { title: 'Music Promotion — Selah.fm' };

  const title = `${kw.title} — Selah.fm`;
  const description = kw.subtitle;

  return {
    title,
    description,
    openGraph: {
      title, description,
      url: `https://selah.fm/tools/${params.slug}`,
      siteName: 'Selah.fm',
      images: [{ url: 'https://selah.fm/images/og-image.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image', title, description,
      images: ['https://selah.fm/images/og-image.jpg'],
    },
    alternates: { canonical: `https://selah.fm/tools/${params.slug}` },
  };
}

function generatePageContent(slug: string) {
  const kw = KEYWORD_TEMPLATES[slug];
  if (!kw) { const title = slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "); return { title, subtitle: "Promote your music through real creators on TikTok, Reels, and Shorts. Pay per verified view.", audience: "both", pillar: "General", slug, isArtist: true, isCreator: true, howItWorks: [{ step: "1", title: "Create a campaign", desc: "Pick your track, set your CPM rate, choose your budget." }, { step: "2", title: "Creators submit videos", desc: "Content creators make TikToks, Reels, and Shorts using your music." }, { step: "3", title: "Approve and pay", desc: "Review submissions. Pay only for verified views." }] }; }

  const isArtist = kw.audience === 'artists' || kw.audience === 'both';
  const isCreator = kw.audience === 'creators' || kw.audience === 'both';

  return {
    ...kw,
    slug,
    isArtist,
    isCreator,
    howItWorks: isArtist ? [
      { step: '1', title: 'Create a campaign', desc: 'Pick your track, set your CPM rate, choose your budget. Takes 2 minutes.' },
      { step: '2', title: 'Creators submit videos', desc: 'Content creators make TikToks, Reels, and Shorts using your music.' },
      { step: '3', title: 'Approve and pay', desc: 'Review submissions. Approve the best ones. Pay only for verified views.' },
    ] : [
      { step: '1', title: 'Browse campaigns', desc: 'Find artists promoting tracks in your genre. Pick ones that fit your style.' },
      { step: '2', title: 'Create and submit', desc: 'Make a short video using their track. Submit for review.' },
      { step: '3', title: 'Earn per view', desc: 'Get paid for every verified view your video generates. Fast Stripe payouts.' },
    ],
  };
}

export default function ToolPage({ params }: Props) {
  const page = generatePageContent(params.slug);
  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0A' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Music Promotion Tools</h1>
          <p className="text-muted-foreground mb-6">Explore our music promotion and creator earning guides.</p>
          <div className="flex gap-4 justify-center">
            <a href="/welcome-artists" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold">I&apos;m an artist</a>
            <a href="/welcome-creators" className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-semibold">I&apos;m a creator</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.15) 0%, #0A0A0A 60%), #0A0A0A' }}>
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground mb-8">
          <a href="/" className="hover:text-foreground">Selah.fm</a>
          <span className="mx-2">/</span>
          <span className="text-foreground">{page.title}</span>
        </div>

        {/* Hero */}
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{page.title}</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{page.subtitle}</p>

        {/* CTAs */}
        <div className="flex gap-3 mb-16">
          {page.isArtist && (
            <a href="/welcome-artists" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity">
              Start promoting →
            </a>
          )}
          {page.isCreator && (
            <a href="/welcome-creators" className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              Start earning →
            </a>
          )}
        </div>

        {/* How it works */}
        <h2 className="text-xl font-bold mb-6">How it works</h2>
        <div className="grid gap-4 mb-16">
          {page.howItWorks.map((s: any) => (
            <div key={s.step} className="flex gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">{s.step}</div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Why Selah.fm */}
        <h2 className="text-xl font-bold mb-6">Why Selah.fm?</h2>
        <div className="grid gap-3 mb-16">
          {[
            { title: 'You control the budget', desc: 'Set your max spend. Set your CPM rate. Never pay more than you choose.' },
            { title: 'Verified views only', desc: 'We verify every view. No bots. No fake streams. You pay for real engagement.' },
            { title: 'Direct creator connection', desc: 'No agencies. No middlemen. Artists and creators work together directly.' },
            { title: 'Fast Stripe payouts', desc: 'Creators get paid through Stripe Connect. Artists fund campaigns with any card.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-primary mt-0.5">✓</span>
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="p-8 rounded-2xl bg-primary/[0.04] border border-primary/10 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {page.isArtist && page.isCreator
              ? 'Join as an artist to promote your music, or as a creator to earn per view. Or both.'
              : page.isArtist
              ? 'Create your first campaign in 2 minutes. Set your budget, pick your CPM, and connect with creators.'
              : 'Browse active campaigns and start earning per view. No minimum followers required.'}
          </p>
          <div className="flex gap-3 justify-center">
            {page.isArtist && (
              <a href="/welcome-artists" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">
                I&apos;m an artist
              </a>
            )}
            {page.isCreator && (
              <a href="/welcome-creators" className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] font-semibold text-sm hover:bg-white/[0.08] transition-colors">
                I&apos;m a creator
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
