import { Metadata } from 'next';
import CampaignDetailClient from './CampaignDetailClient';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props { params: { id: string } }

/** Direct DB query — no HTTP fetch, no network failure risk for metadata */
async function getCampaign(id: string) {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const campaigns = isUuid
      ? await sql`
          SELECT c.*, COALESCE(c.title, c.track_title) as title,
            COALESCE(u.display_name, da.artist_name) as artist_name,
            da.social_links, da.artist_name as da_artist_name,
            aa.youtube_video_url as audit_youtube_url,
            aa.spotify_embed_url,
            ap.slug as artist_slug
          FROM campaigns c
          LEFT JOIN users u ON u.id = c.artist_id
          LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
          LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
          LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
          LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
          WHERE c.id = ${id}::uuid
          ORDER BY aa.audited_at DESC LIMIT 1
        `
      : await sql`
          SELECT c.*, COALESCE(c.title, c.track_title) as title,
            COALESCE(u.display_name, da.artist_name) as artist_name,
            da.social_links, da.artist_name as da_artist_name,
            aa.youtube_video_url as audit_youtube_url,
            aa.spotify_embed_url,
            ap.slug as artist_slug
          FROM campaigns c
          LEFT JOIN users u ON u.id = c.artist_id
          LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
          LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
          LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
          LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
          WHERE c.slug = ${id}
          ORDER BY aa.audited_at DESC LIMIT 1
        `;
    return campaigns[0] || null;
  } catch {
    return null;
  }
}

function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_URL || 'https://selah.fm';
  if (!path) return `${base}/images/og-image.jpg`;
  if (path.startsWith('data:')) return `${base}/images/og-image.jpg`;
  if (path.startsWith('/api/images/')) return `${base}${path}`;
  if (path.startsWith('/images/')) return `${base}${path}`;
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const campaign = await getCampaign(params.id);
  if (!campaign) {
    return {
      title: 'Campaign not found — Selah.fm',
      openGraph: { images: [{ url: 'https://selah.fm/images/og-image.jpg' }] },
      twitter: { card: 'summary_large_image', images: ['https://selah.fm/images/og-image.jpg'] },
    };
  }

  const displayTitle = campaign.title || campaign.track_title;
  const artistName = campaign.artist_name || 'the artist';
  const trackTitle = campaign.track_title;
  const cpm = campaign.cpm_rate_cents ? (campaign.cpm_rate_cents / 100).toFixed(2) : null;
  const imageUrl = absoluteUrl(campaign.cover_art_url);
  const canonicalSlug = campaign.slug || params.id;
  const canonicalUrl = `https://selah.fm/c/${canonicalSlug}`;

  const cpmPer1M = cpm ? `$${(parseFloat(cpm) * 1000).toFixed(0)}` : null;
  const title = cpmPer1M
    ? `Earn ${cpmPer1M}/1M views promoting "${trackTitle}" by ${artistName} — Selah.fm`
    : `Promote "${trackTitle}" by ${artistName} and earn per view — Selah.fm`;

  const desc = cpmPer1M
    ? `Submit a video for ${artistName}'s "${trackTitle}" and earn ${cpmPer1M} per 1M verified views. Artists can start at $0.10 CPM. Join free on Selah.fm.`
    : `Submit a video for ${artistName}'s "${trackTitle}" and earn per verified view. Artists set the CPM. Zero upfront cost on Selah.fm.`;

  return {
    title,
    description: desc.slice(0, 160),
    alternates: { canonical: canonicalUrl },
    keywords: [
      artistName, trackTitle,
      `promote ${trackTitle}`, `earn promoting ${artistName}`,
      'submit music video', 'get paid per view',
      'music promotion marketplace', 'UGC music campaign', 'creator earnings', 'selah.fm',
    ].filter(Boolean),
    openGraph: {
      title, description: desc, type: 'website', url: canonicalUrl, siteName: 'Selah.fm',
      images: [{ url: imageUrl }],
      ...(process.env.FACEBOOK_APP_ID ? { 'fb:app_id': process.env.FACEBOOK_APP_ID } : {}),
    } as any,
    twitter: { card: 'summary_large_image', title, description: desc, images: [imageUrl] },
    robots: { index: true, follow: true },
  };
}

function stripBase64Images(data: any): any {
  if (!data) return data;
  if (typeof data.cover_art_url === 'string' && data.cover_art_url.startsWith('data:') && data.cover_art_url.length > 1000) {
    data = { ...data, cover_art_url: '' };
  }
  return data;
}

interface ListenLink { platform: string; url: string; icon: string; }

function buildListenLinks(campaign: any): ListenLink[] {
  const links: ListenLink[] = [];
  const socialLinks = typeof campaign?.social_links === 'string' ? JSON.parse(campaign.social_links) : (campaign?.social_links || {});
  const artistName = campaign?.artist_name || campaign?.da_artist_name || '';
  const trackTitle = campaign?.track_title || campaign?.title || '';
  const query = encodeURIComponent(`${artistName} ${trackTitle}`);
  const addLink = (platform: string, icon: string, directUrl: string | null | undefined, searchUrl: string) => {
    if (directUrl && (directUrl.startsWith('https://') || directUrl.startsWith('http://')) && !directUrl.includes('/search') && !directUrl.includes('/results?')) {
      links.push({ platform, url: directUrl, icon }); return;
    }
    links.push({ platform, url: searchUrl, icon });
  };
  const bcUrl = socialLinks.bandcamp || (campaign?.track_url?.includes('bandcamp.com') ? campaign.track_url : null);
  if (bcUrl) links.push({ platform: 'Bandcamp', url: bcUrl, icon: '🎵' });
  addLink('Spotify', '🟢', socialLinks.spotify || campaign?.latest_track_spotify_url || campaign?.spotify_embed_url, `https://open.spotify.com/search/${query}`);
  addLink('YouTube', '▶️', socialLinks.youtube || campaign?.youtube_video_url || campaign?.audit_youtube_url, `https://www.youtube.com/results?search_query=${query}`);
  addLink('Apple Music', '🍎', socialLinks.apple_music, `https://music.apple.com/search?term=${query}`);
  addLink('SoundCloud', '☁️', socialLinks.soundcloud, `https://soundcloud.com/search?q=${query}`);
  return links;
}

export default async function CampaignPage({ params }: Props) {
  const campaign = await getCampaign(params.id);
  const lightweightCampaign = stripBase64Images(campaign);

  const displayTitle = campaign?.title || campaign?.track_title || 'Untitled';
  const artistName = campaign?.artist_name || 'an artist';
  const trackTitle = campaign?.track_title || '';
  const imageUrl = absoluteUrl(campaign?.cover_art_url);
  const canonicalSlug = campaign?.slug || params.id;
  const canonicalUrl = `https://selah.fm/c/${canonicalSlug}`;
  const createdAt = campaign?.created_at || new Date().toISOString();
  const cpmDollars = campaign?.cpm_rate_cents ? (campaign.cpm_rate_cents / 100).toFixed(2) : null;
  const cpmPer1M = cpmDollars ? `$${(parseFloat(cpmDollars) * 1000).toFixed(0)}` : null;
  const budget = campaign?.total_budget_cents ? (campaign.total_budget_cents / 100).toFixed(0) : null;

  // ── Server-rendered related campaigns for internal linking ──
  let relatedCampaigns: any[] = [];
  try {
    relatedCampaigns = await sql`
      SELECT c.slug, COALESCE(c.title, c.track_title) as title, c.track_title,
        COALESCE(u.display_name, da.artist_name) as artist_name,
        c.cover_art_url, c.cpm_rate_cents
      FROM campaigns c
      LEFT JOIN users u ON u.id = c.artist_id
      LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
      LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      WHERE c.status IN ('active', 'draft') AND c.slug IS NOT NULL AND c.slug != ${canonicalSlug}
      ORDER BY c.created_at DESC LIMIT 6
    `;
  } catch (e: any) { console.error('Unhandled error in c/[id]/page.tsx:', e); }

  // ── Multi-schema JSON-LD ────────────────────────────────────
  const jsonLd = campaign ? {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'MusicRecording', name: trackTitle, byArtist: { '@type': 'MusicGroup', name: artistName }, ...(imageUrl ? { image: imageUrl } : {}), url: canonicalUrl },
      { '@type': 'VideoObject', name: `Promote "${trackTitle}" by ${artistName}`, description: cpmDollars ? `Submit a video and earn $${(parseFloat(cpmDollars) * 1000).toFixed(0)} per 1M verified views promoting "${trackTitle}".` : `Join this campaign for "${trackTitle}" and earn per verified view.`, thumbnailUrl: imageUrl, contentUrl: canonicalUrl, uploadDate: createdAt },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Selah.fm', item: 'https://selah.fm' }, { '@type': 'ListItem', position: 2, name: 'Browse Campaigns', item: 'https://selah.fm/browse' }, { '@type': 'ListItem', position: 3, name: displayTitle, item: canonicalUrl }] },
      ...(cpmDollars ? [{ '@type': 'Offer', name: `Earn $${(parseFloat(cpmDollars) * 1000).toFixed(0)} per 1M views promoting "${trackTitle}"`, price: cpmDollars, priceCurrency: 'USD', description: `Creators earn per verified view. Artists pay CPM + 20% platform fee.${budget ? ` Budget: $${budget}.` : ''}`, url: canonicalUrl }] : []),
      { '@type': 'FAQPage', mainEntity: [
        { '@type': 'Question', name: `How do I earn money promoting "${trackTitle}"?`, acceptedAnswer: { '@type': 'Answer', text: `Create a short video featuring "${trackTitle}" on TikTok, Instagram Reels, or YouTube Shorts. Submit your video to this campaign. The artist approves and you earn per verified view.` } },
        { '@type': 'Question', name: 'How much can I earn per video?', acceptedAnswer: { '@type': 'Answer', text: cpmDollars ? `At this campaign's rate, you earn $${(parseFloat(cpmDollars) * 1000).toFixed(0)} per 1 million verified views. A video with 10,000 views earns about $${(parseFloat(cpmDollars) * 10).toFixed(2)}.` : 'Earnings depend on the CPM rate set by the artist and how many views your video gets.' } },
        { '@type': 'Question', name: 'What platforms can I post my video on?', acceptedAnswer: { '@type': 'Answer', text: 'TikTok, Instagram Reels, and YouTube Shorts are all supported. Post wherever your audience is — views count across all platforms.' } },
        { '@type': 'Question', name: 'How does the artist pay me?', acceptedAnswer: { '@type': 'Answer', text: 'Artists pay through Selah.fm for verified views only. You connect your Stripe account and get paid automatically when your views are verified.' } },
      ]},
      { '@type': 'HowTo', name: `How to earn money promoting "${trackTitle}" by ${artistName}`, description: cpmPer1M ? `Create a short video with "${trackTitle}", submit it, and earn ${cpmPer1M} per 1M verified views.` : `Create a short video with "${trackTitle}", submit it, and earn per verified view.`, step: [
        { '@type': 'HowToStep', position: 1, name: 'Download or find the audio', text: `Search for "${trackTitle}" on TikTok, Instagram, or YouTube and use the official audio.` },
        { '@type': 'HowToStep', position: 2, name: 'Create your video', text: 'Record a vertical 9:16 video (15-60 seconds) using the official audio. Make sure your account is public.' },
        { '@type': 'HowToStep', position: 3, name: 'Submit and earn', text: cpmPer1M ? `Post your video publicly, paste the link in your submission. Earn ${cpmPer1M} per 1M verified views — paid automatically via Stripe.` : 'Post your video publicly, paste the link. Earn per verified view — paid automatically via Stripe.' },
      ]},
    ],
  } : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      {/* Screen-reader SEO content — crawlable by Google even before JS loads */}
      <div className="sr-only" aria-hidden="true">
        <h1>{displayTitle} — Music Promotion Campaign on Selah.fm</h1>
        <p>{cpmPer1M ? `Join this campaign for "${trackTitle}" by ${artistName}. Create a short video and earn ${cpmPer1M} per 1M verified views on TikTok, Instagram Reels, or YouTube Shorts.` : `Join this campaign for "${trackTitle}" by ${artistName}. Create a short video and earn per verified view.`}</p>
        <h2>How to participate:</h2>
        <ol>
          <li>Find the audio — search for &quot;{trackTitle}&quot; on TikTok, Instagram, or YouTube</li>
          <li>Create your video — record a vertical 9:16 video using the official audio</li>
          <li>Submit and earn{cpmPer1M ? ` — earn ${cpmPer1M} per 1M verified views` : ''}</li>
        </ol>
      </div>

      {/* Visible breadcrumb — matches BreadcrumbList JSON-LD */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 pt-4 pb-0">
        <ol className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40">
          <li><a href="/" className="hover:text-muted-foreground transition-colors">Selah.fm</a></li>
          <li className="text-muted-foreground/20">/</li>
          <li><a href="/browse" className="hover:text-muted-foreground transition-colors">Browse</a></li>
          <li className="text-muted-foreground/20">/</li>
          <li className="text-muted-foreground/60 truncate max-w-[200px]">{displayTitle}</li>
        </ol>
      </nav>

      {/* Artist profile link */}
      {campaign?.artist_slug && (
        <div className="max-w-7xl mx-auto px-4 pt-2 pb-0">
          <a href={`/artist/${campaign.artist_slug}`}
            className="inline-flex items-center gap-1.5 text-[11px] text-primary/60 hover:text-primary transition-colors">
            View {artistName}'s full catalog →
          </a>
        </div>
      )}

      <CampaignDetailClient id={campaign?.id || params.id} initialCampaign={lightweightCampaign} listenLinks={buildListenLinks(campaign)} artistSlug={campaign?.artist_slug || null} />

      {/* Server-rendered related campaigns — crawlable by Google, visible to users */}
      {relatedCampaigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-16" aria-labelledby="more-heading">
          <h2 id="more-heading" className="font-bold text-base mb-5" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
            More campaigns
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {relatedCampaigns.map((rc: any) => (
              <a key={rc.slug} href={`/c/${rc.slug}`}
                className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-[#4338CA]/20 hover:bg-white/[0.05] transition-all">
                <div className="aspect-square bg-white/[0.02] relative overflow-hidden">
                  {rc.cover_art_url ? (
                    <img src={rc.cover_art_url} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4338CA]/10 to-[#22C55E]/5">
                      <span className="text-[10px] font-bold text-white/10">{(rc.title || rc.track_title || '?')[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-semibold truncate leading-tight">{rc.title || rc.track_title}</p>
                  <p className="text-[10px] text-muted-foreground/50 truncate mt-0.5">
                    {rc.artist_name || 'Artist'}
                    {rc.cpm_rate_cents ? ` · $${((rc.cpm_rate_cents / 100) * 1000).toFixed(0)}/1M` : ''}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
