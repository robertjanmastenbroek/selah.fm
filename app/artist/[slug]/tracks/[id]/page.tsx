import { Metadata } from 'next';
import sql from '@/lib/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Props { params: { slug: string; id: string } }

async function getTrackData(slug: string, trackId: string) {
  try {
    const [track] = await sql`
      SELECT at.id, at.title, at.spotify_url, at.cover_art_url, at.cpm_rate_cents,
             at.created_at, at.description,
             da.artist_name, da.genres, da.monthly_listeners,
             ap.slug as profile_slug, ap.spotify_image_url,
             c.slug as campaign_slug, c.status as campaign_status,
             c.total_budget_cents, c.budget_remaining_cents
      FROM artist_tracks at
      JOIN discovered_artists da ON da.id = at.artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      LEFT JOIN campaigns c ON c.id IN (
        SELECT cc.campaign_id FROM campaign_claims cc WHERE cc.discovered_artist_id = da.id
      )
      WHERE ap.slug = ${slug} AND at.id = ${trackId}::uuid
      LIMIT 1
    `;
    if (!track) return null;

    // Get stats
    const [stats] = await sql`
      SELECT COALESCE(SUM(s.views_verified), 0)::int as total_views,
             COUNT(s.id)::int as submission_count
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      WHERE cc.discovered_artist_id = (SELECT artist_id FROM artist_profiles WHERE slug = ${slug})
        AND s.review_status = 'approved'
    `;

    return { ...track, total_views: stats?.total_views || 0, submission_count: stats?.submission_count || 0 };
  } catch (e: any) {
    console.error('Track data error:', e);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const track = await getTrackData(params.slug, params.id);
  if (!track) return { title: 'Track not found — Selah.fm' };

  const artistName = track.artist_name;
  const trackTitle = track.title;
  const cpmRate = track.cpm_rate_cents ? `$${(track.cpm_rate_cents / 100).toFixed(2)}` : null;

  return {
    title: `"${trackTitle}" by ${artistName} — Listen & Promote | Selah.fm`,
    description: `${cpmRate ? `Earn ${cpmRate}/1M views promoting "${trackTitle}" by ${artistName}. ` : ''}${track.submission_count > 0 ? `${track.submission_count} submitted videos. ` : ''}Join on Selah.fm and start earning per verified view.`,
    openGraph: {
      title: `"${trackTitle}" by ${artistName}`,
      description: `Promote this track on Selah.fm and earn per verified view.`,
      images: track.cover_art_url ? [{ url: track.cover_art_url }] : [],
    },
    alternates: { canonical: `https://selah.fm/artist/${params.slug}/tracks/${params.id}` },
  };
}

export default async function TrackPage({ params }: Props) {
  const track = await getTrackData(params.slug, params.id);
  if (!track) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Track not found</p></div>;

  const artistName = track.artist_name;
  const trackTitle = track.title;
  const cpmPer1M = track.cpm_rate_cents ? `$${((track.cpm_rate_cents / 100) * 1000).toFixed(0)}` : null;
  const campaignActive = track.campaign_status === 'active';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'MusicRecording', name: trackTitle, byArtist: { '@type': 'MusicGroup', name: artistName }, image: track.cover_art_url || track.spotify_image_url, url: `https://selah.fm/artist/${params.slug}/tracks/${params.id}${track.spotify_url ? `, ${track.spotify_url}` : ''}`, datePublished: track.created_at ? new Date(track.created_at).toISOString().split('T')[0] : undefined },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Selah.fm', item: 'https://selah.fm' },
        { '@type': 'ListItem', position: 2, name: artistName, item: `https://selah.fm/artist/${params.slug}` },
        { '@type': 'ListItem', position: 3, name: trackTitle, item: `https://selah.fm/artist/${params.slug}/tracks/${params.id}` },
      ]},
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Screen-reader SEO content */}
      <div className="sr-only" aria-hidden="true">
        <h1>{trackTitle} by {artistName}</h1>
        <p>{cpmPer1M ? `Promote "${trackTitle}" by ${artistName} and earn ${cpmPer1M} per 1M verified views. Available on Selah.fm.` : `Listen to "${trackTitle}" by ${artistName} and learn how to earn promoting it on Selah.fm.`}</p>
      </div>

      <div className="min-h-screen" style={{ background: '#0F0F23' }}>
        <main className="max-w-4xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="text-[11px] text-muted-foreground/40 mb-6">
            <ol className="flex items-center gap-1.5">
              <li><a href="/" className="hover:text-muted-foreground">Selah.fm</a><span className="ml-1.5">/</span></li>
              <li><a href={`/artist/${params.slug}`} className="hover:text-muted-foreground">{artistName}</a><span className="ml-1.5">/</span></li>
              <li className="text-muted-foreground/60 truncate max-w-[200px]">{trackTitle}</li>
            </ol>
          </nav>

          {/* Track header */}
          <div className="flex items-start gap-6 mb-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-white/[0.04] shrink-0">
              {track.cover_art_url ? (
                <img src={track.cover_art_url} alt={`${trackTitle} cover`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/10">
                  {trackTitle[0]?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
                {trackTitle}
              </h1>
              <Link href={`/artist/${params.slug}`} className="text-primary hover:underline text-sm">
                {artistName}
              </Link>
              {campaignActive && <span className="ml-3 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active campaign</span>}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'CPM', value: cpmPer1M ? `${cpmPer1M}/1M views` : '—' },
              { label: 'Views', value: track.total_views?.toLocaleString() || '0' },
              { label: 'Submissions', value: String(track.submission_count || 0) },
              { label: 'Status', value: campaignActive ? 'Active' : track.campaign_status || 'Draft' },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3 mb-12">
            {track.campaign_slug && (
              <a href={`/c/${track.campaign_slug}`} className="px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition-all">
                {cpmPer1M ? `Earn ${cpmPer1M}/1M views →` : 'Join campaign →'}
              </a>
            )}
            {track.spotify_url && (
              <a href={track.spotify_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl bg-[#1DB954]/10 text-[#1DB954] font-semibold text-sm border border-[#1DB954]/20 hover:bg-[#1DB954]/20 transition-all">
                Listen on Spotify
              </a>
            )}
            <a href={`/artist/${params.slug}`} className="px-6 py-3 rounded-xl bg-white/[0.04] text-muted-foreground font-medium text-sm hover:bg-white/[0.06] transition-all">
              View all tracks →
            </a>
          </div>

          {/* SEO content */}
          <section className="text-sm text-muted-foreground/60 leading-relaxed space-y-4 max-w-2xl">
            <h2 className="text-base font-semibold text-foreground">About this track</h2>
            <p>"{trackTitle}" is a track by {artistName} available on Selah.fm. Creators can make short-form videos featuring this track and earn per verified view.</p>
            {cpmPer1M && <p>At the current CPM rate of {track.cpm_rate_cents ? `$${(track.cpm_rate_cents / 100).toFixed(2)}` : '—'} per 1,000 views, creators can earn {cpmPer1M} for every 1 million verified views their video receives.</p>}
            {track.submission_count > 0 && <p>{track.submission_count} creator{track.submission_count !== 1 ? 's have' : ' has'} already submitted videos for this track, generating {track.total_views?.toLocaleString() || '0'} verified views.</p>}
          </section>
        </main>
      </div>
    </>
  );
}
