import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const revalidate = 86400;

// ── Keyword database ──────────────────────────────────────────────

const TEMPLATES: Record<string, {
  title: string; subtitle: string; audience: 'artists'|'creators'|'both'; pillar: string;
  image: string; benefits: { title: string; desc: string }[];
}> = {
  // PILLAR 1: Music Promotion (artist-focused)
  'music-promotion': { title:'Music Promotion', subtitle:'Get your tracks heard by real creators on TikTok, Reels, and Shorts. Set your budget. Pay per verified view.', audience:'artists', pillar:'Music Promotion', image:'https://images.pexels.com/photos/3771110/pexels-photo-3771110.jpeg?auto=compress&cs=tinysrgb&w=1200', benefits:[{title:'No more black-box ads',desc:'Facebook and Google ads eat your budget with no guarantees. With Selah.fm, you only pay for real, verified views.'},{title:'Creators do the work',desc:'Instead of making content yourself, hire creators who already have audiences. They make the videos. You approve them.'},{title:'Transparent pricing',desc:'Set your own CPM rate. Set a max budget. Never spend a cent more than you planned.'}] },
  'promote-music': { title:'Promote Your Music', subtitle:'Connect with creators who will promote your songs. You control the budget and only pay for results.', audience:'artists', pillar:'Music Promotion', image:'https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=1200', benefits:[{title:'Pick your creators',desc:'Browse creators by genre, platform, and style. Find someone whose audience matches your sound.'},{title:'Set your terms',desc:'You choose the CPM rate, max budget, and content requirements. Creators apply to work with you.'},{title:'Real results only',desc:'Every view is verified. No bots. No fake streams. You see exactly what your budget earned.'}] },
  'independent-artist': { title:'Independent Artist Promotion', subtitle:'No label needed. Promote your music directly through creators who earn per view.', audience:'artists', pillar:'Music Promotion', image:'https://images.pexels.com/photos/2258413/pexels-photo-2258413.jpeg?auto=compress&cs=tinysrgb&w=1200', benefits:[{title:'Built for independents',desc:'The whole system is designed for artists without labels. No gatekeepers. No minimum follower counts.'},{title:'Keep your rights',desc:'Unlike record deals, you keep 100% of your music rights. Selah.fm takes a platform fee only on completed campaigns.'},{title:'Start small',desc:'Launch a campaign for as little as €20. Test the waters before committing big budgets.'}] },
  'spotify-promotion': { title:'Spotify Promotion', subtitle:'Get on playlists and drive streams by having creators feature your track on TikTok and Reels.', audience:'artists', pillar:'Music Promotion', image:'https://images.pexels.com/photos/1616470/pexels-photo-1616470.jpeg?auto=compress&cs=tinysrgb&w=1200', benefits:[{title:'TikTok drives Spotify streams',desc:'When a creator uses your track in a viral TikTok, listeners rush to Spotify to save it. This is the modern discovery pipeline.'},{title:'Algorithm boost',desc:'Spotify rewards tracks with external traffic. Every TikTok view that leads to a stream tells the algorithm to push your song further.'},{title:'Real playlist potential',desc:'Organic streams from TikTok converts are weighted higher than paid playlist placements. Better for long-term growth.'}] },
  'tiktok-promotion': { title:'TikTok Music Promotion', subtitle:'The most effective TikTok promotion: pay creators per view. Your song, their audience.', audience:'artists', pillar:'Music Promotion', image:'https://images.pexels.com/photos/5054353/pexels-photo-5054353.jpeg?auto=compress&cs=tinysrgb&w=1200', benefits:[{title:'Viral-ready sound',desc:'When multiple creators use your track, TikTok sees it as a trending sound. That is how songs blow up.'},{title:'Authentic content',desc:'Creators make genuine videos, not ads. Audiences can tell the difference — and they engage more.'},{title:'Track everything',desc:'See exactly how many views each creator generated. Know your cost per view down to the cent.'}] },

  // PILLAR 2: Creator Earnings
  'earn-money': { title:'Earn Money as a Creator', subtitle:'Make money creating short videos. Promote music tracks and earn per verified view.', audience:'creators', pillar:'Creator Earnings', image:'https://images.pexels.com/photos/4386433/pexels-photo-4386433.jpeg?auto=compress&cs=tinysrgb&w=1200', benefits:[{title:'Get paid for what you already do',desc:'You are already making TikToks and Reels. Now get paid for them by featuring music tracks.'},{title:'No minimum followers',desc:'You do not need millions of followers. If your content gets views, you earn. Simple.'},{title:'Fast Stripe payouts',desc:'Connect your Stripe account. Earnings are paid directly to your bank. No waiting. No thresholds.'}] },
  'cpm-rates': { title:'CPM Rates for Creators', subtitle:'Compare CPM rates. See what artists are paying per 1,000 views on TikTok, Reels, and Shorts.', audience:'creators', pillar:'Creator Earnings', image:'https://images.pexels.com/photos/4386384/pexels-photo-4386384.jpeg?auto=compress&cs=tinysrgb&w=1200', benefits:[{title:'Transparent rates',desc:'Artists set their CPM publicly. You see the rate before you apply. No hidden cuts.'},{title:'You choose your campaigns',desc:'Browse campaigns by CPM rate, genre, and platform. Only apply to ones that match your style and pay what you want.'},{title:'Higher than Creator Fund',desc:'Most TikTok creators earn less than €0.03 per 1,000 views from the Creator Fund. On Selah.fm, artists often pay €1-5 CPM.'}] },
  'side-hustle': { title:'Side Hustle for Creators', subtitle:'Make extra income creating videos. No minimum followers. Just good content that gets views.', audience:'creators', pillar:'Creator Earnings', image:'https://images.pexels.com/photos/4491479/pexels-photo-4491479.jpeg?auto=compress&cs=tinysrgb&w=1200', benefits:[{title:'Start today',desc:'Create an account, browse campaigns, submit a video. You could earn your first payout this week.'},{title:'Work on your schedule',desc:'No deadlines. No quotas. Browse campaigns when you have time. Create when inspiration strikes.'},{title:'Build your portfolio',desc:'Every campaign you complete builds your creator profile. Higher ratings mean higher-paying campaigns.'}] },

  // PILLAR 3: Platform Strategy
  'tiktok-marketing': { title:'TikTok Marketing for Music', subtitle:'Use TikTok creators to market your music. Set campaigns. Pay per view. Scale your reach.', audience:'artists', pillar:'Platform Strategy', image:'https://images.pexels.com/photos/5054353/pexels-photo-5054353.jpeg?auto=compress&cs=tinysrgb&w=1200', benefits:[{title:'The algorithm is on your side',desc:'TikTok is built for music discovery. When creators use your sound, the algorithm pushes it further.'},{title:'Multiple creators = multiplier',desc:'One creator is good. Ten creators using your track in different styles is how songs go viral.'},{title:'Target your genre',desc:'Find creators who make content in your genre. Their audience is already primed for your sound.'}] },

  // PILLAR 5: Creator Marketplace
  'hire-creators': { title:'Hire Content Creators', subtitle:'Find creators who match your genre. They make videos using your music. You pay per view.', audience:'artists', pillar:'Creator Marketplace', image:'https://images.pexels.com/photos/4348401/pexels-photo-4348401.jpeg?auto=compress&cs=tinysrgb&w=1200', benefits:[{title:'Genre-matched creators',desc:'Search by music genre. Find creators whose content style fits your sound.'},{title:'Performance-based payment',desc:'You only pay for views. No upfront fees. No retainers. Pure performance.'},{title:'Review before paying',desc:'Creators submit videos for your approval. You decide which ones go live.'}] },
  'creator-marketplace': { title:'Creator Marketplace for Music', subtitle:'The marketplace where artists and creators connect. Music promotion, reimagined.', audience:'both', pillar:'Creator Marketplace', image:'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200', benefits:[{title:'Two-sided marketplace',desc:'Artists post campaigns. Creators apply. Both sides win when views are verified.'},{title:'Quality over quantity',desc:'Our review system ensures only real, quality content gets approved. No spam. No bots.'},{title:'Built on trust',desc:'Stripe handles all payments. Views are verified. Ratings keep creators accountable.'}] },
};

// ── Default for any keyword not explicitly defined ────────────────

function getDefault(slug: string) {
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return {
    title, subtitle: 'Promote your music through real creators on TikTok, Reels, and Shorts. Pay per verified view.',
    audience: 'both' as const, pillar: 'General',
    image: 'https://images.pexels.com/photos/3771110/pexels-photo-3771110.jpeg?auto=compress&cs=tinysrgb&w=1200',
    benefits: [
      { title:'You control the budget', desc:'Set your max spend. Set your CPM rate. Never pay more than you choose.' },
      { title:'Verified views only', desc:'We verify every view. No bots. No fake streams. You pay for real engagement.' },
      { title:'Direct creator connection', desc:'No agencies. No middlemen. Artists and creators work together directly.' },
    ],
  };
}

// ── Page ─────────────────────────────────────────────────────────

interface Props { params: { slug: string } }

export function generateStaticParams() {
  return Object.keys(TEMPLATES).map(slug => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const t = TEMPLATES[params.slug] || getDefault(params.slug);
  const title = `${t.title} — Selah.fm`;
  return {
    title, description: t.subtitle,
    openGraph: {
      title, description: t.subtitle,
      url: `https://selah.fm/tools/${params.slug}`, siteName: 'Selah.fm',
      images: [{ url: 'https://selah.fm/images/og-image.jpg', width:1200, height:630 }],
    },
    twitter: { card:'summary_large_image', title, description:t.subtitle, images:['https://selah.fm/images/og-image.jpg'] },
    alternates: { canonical: `https://selah.fm/tools/${params.slug}` },
  };
}

export default function ToolPage({ params }: Props) {
  const t = TEMPLATES[params.slug] || getDefault(params.slug);
  const isArtist = t.audience === 'artists' || t.audience === 'both';
  const isCreator = t.audience === 'creators' || t.audience === 'both';

  return (
    <div className="min-h-screen" style={{ background:'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.15) 0%, #0A0A0A 60%), #0A0A0A' }}>
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        
        <div className="text-sm text-muted-foreground mb-8">
          <a href="/" className="hover:text-foreground">Selah.fm</a>
          <span className="mx-2">/</span>
          <span className="text-foreground">{t.title}</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{t.title}</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{t.subtitle}</p>

        <div className="flex gap-3 mb-16">
          {isArtist && <a href="/welcome-artists" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity">Start promoting →</a>}
          {isCreator && <a href="/welcome-creators" className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-colors">Start earning →</a>}
        </div>

        {/* Feature image */}
        <div className="rounded-2xl overflow-hidden mb-16 ring-1 ring-white/[0.06]">
          <img src={t.image} alt={t.title} className="w-full h-64 md:h-80 object-cover" loading="lazy" />
        </div>

        <h2 className="text-xl font-bold mb-6">How it works</h2>
        <div className="grid gap-4 mb-16">
          {[
            { step:'1', title:'Create a campaign', desc:'Pick your track, set your CPM rate, choose your budget. Takes 2 minutes.' },
            { step:'2', title:'Creators submit videos', desc:'Content creators make TikToks, Reels, and Shorts using your music.' },
            { step:'3', title:'Approve and pay', desc:'Review submissions. Approve the best ones. Pay only for verified views.' },
          ].map(s => (
            <div key={s.step} className="flex gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">{s.step}</div>
              <div><h3 className="font-semibold text-sm mb-1">{s.title}</h3><p className="text-sm text-muted-foreground">{s.desc}</p></div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-6">Why {t.title} on Selah.fm?</h2>
        <div className="grid gap-4 mb-16">
          {t.benefits.map((b, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-primary mt-0.5 shrink-0">✓</span>
              <div>
                <p className="font-medium text-sm">{b.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 rounded-2xl bg-primary/[0.04] border border-primary/10 text-center">
          <h2 className="text-xl font-bold mb-2">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {isArtist ? 'Create your first campaign in 2 minutes. Set your budget and connect with creators.' : 'Browse active campaigns and start earning per view.'}
          </p>
          <div className="flex gap-3 justify-center">
            {isArtist && <a href="/welcome-artists" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity">I am an artist</a>}
            {isCreator && <a href="/welcome-creators" className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] font-semibold text-sm hover:bg-white/[0.08] transition-colors">I am a creator</a>}
          </div>
        </div>

      </div>
    </div>
  );
}
