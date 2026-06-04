import { Metadata } from 'next';
import sql from '@/lib/db';
import Link from 'next/link';
import TrackDetailClient from './TrackDetailClient';

export const dynamic = 'force-dynamic';

interface Props { params: { slug: string; id: string } }

async function getTrackData(slug: string, trackId: string) {
  let track: any = null;
  let stats: any = { total_views: 0, submission_count: 0 };
  let relatedTracks: any[] = [];

  // Detect if trackId is UUID or title-slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trackId);

  // Main track query
  try {
    let result;
    if (isUuid) {
      result = await sql`
        SELECT c.id, c.track_title as title, c.track_url as spotify_url, c.cover_art_url,
               c.cpm_rate_cents, c.created_at,
               da.artist_name, da.genres, da.monthly_listeners,
               ap.slug as profile_slug, ap.spotify_image_url,
               c.slug as campaign_slug, c.status as campaign_status,
               c.total_budget_cents, c.budget_remaining_cents
        FROM campaigns c
        LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
        LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
        LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
        WHERE ap.slug = ${slug} AND c.id = ${trackId}
        LIMIT 1
      `;
    } else {
      result = await sql`
        SELECT c.id, c.track_title as title, c.track_url as spotify_url, c.cover_art_url,
               c.cpm_rate_cents, c.created_at,
               da.artist_name, da.genres, da.monthly_listeners,
               ap.slug as profile_slug, ap.spotify_image_url,
               c.slug as campaign_slug, c.status as campaign_status,
               c.total_budget_cents, c.budget_remaining_cents
        FROM campaigns c
        LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
        LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
        LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
        WHERE ap.slug = ${slug} AND unaccent(LOWER(c.track_title)) LIKE unaccent(${'%' + trackId.toLowerCase().replace(/-/g, '%') + '%'})
        LIMIT 1
      `;
    }
    track = result[0] || null;
  } catch (e: any) { console.error('[TRACK] main query failed:', e.message); }

  // Fallback: try artist_tracks
  if (!track) {
    try {
      if (isUuid) {
        const fr = await sql`SELECT at.id, at.title, at.spotify_url, at.cover_art_url, at.cpm_rate_cents, at.created_at, da.artist_name, da.genres, da.monthly_listeners, ap.slug as profile_slug, ap.spotify_image_url, NULL as campaign_slug, NULL as campaign_status, NULL as total_budget_cents, NULL as budget_remaining_cents FROM artist_tracks at JOIN discovered_artists da ON da.id = at.artist_id JOIN artist_profiles ap ON ap.artist_id = da.id WHERE ap.slug = ${slug} AND at.id = ${trackId} LIMIT 1`;
        if (fr[0]) track = fr[0];
      } else {
        const likePattern = '%' + trackId.toLowerCase().replace(/-/g, '%') + '%';
        const fr = await sql`SELECT at.id, at.title, at.spotify_url, at.cover_art_url, at.cpm_rate_cents, at.created_at, da.artist_name, da.genres, da.monthly_listeners, ap.slug as profile_slug, ap.spotify_image_url, NULL as campaign_slug, NULL as campaign_status, NULL as total_budget_cents, NULL as budget_remaining_cents FROM artist_tracks at JOIN discovered_artists da ON da.id = at.artist_id JOIN artist_profiles ap ON ap.artist_id = da.id WHERE ap.slug = ${slug} AND unaccent(LOWER(at.title)) LIKE unaccent(${likePattern}) LIMIT 1`;
        if (fr[0]) track = fr[0];
      }
    } catch (e2: any) { console.error('[TRACK] fallback failed:', e2.message); }
  }

  if (!track) return null;

  // Stats
  try {
    const result = await sql`
      SELECT COALESCE(SUM(s.views_verified), 0)::int as total_views,
             COUNT(s.id)::int as submission_count
      FROM submissions s
      JOIN campaigns c ON c.id = s.campaign_id
      WHERE c.id = ${track.id}
        AND s.review_status = 'approved'
    `;
    stats = result[0] || stats;
  } catch (e: any) { console.error('[TRACK] stats query failed:', e.message); }

  // Resolve track ID for related tracks query
  const resolvedTrackId = isUuid ? trackId : track.id;

  // Related tracks
  try {
    relatedTracks = await sql`
      SELECT c.id, c.track_title as title, c.cover_art_url, c.cpm_rate_cents
      FROM campaigns c
      JOIN campaign_claims cc ON cc.campaign_id = c.id
      JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      JOIN artist_profiles ap ON ap.artist_id = da.id
      WHERE ap.slug = ${slug}
        AND c.id != ${resolvedTrackId}
      ORDER BY c.created_at DESC
      LIMIT 10
    `;
  } catch (e: any) { console.error('[TRACK] related query failed:', e.message); }

  return {
    ...track,
    total_views: stats?.total_views || 0,
    submission_count: stats?.submission_count || 0,
    relatedTracks: relatedTracks || [],
    track_slug: track?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || '',
  };
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
    alternates: { canonical: `https://selah.fm/artist/${params.slug}/tracks/${track.track_slug || params.id}` },
  };
}

export default async function TrackPage({ params }: Props) {
  const track = await getTrackData(params.slug, params.id);
  if (!track) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Track not found</p></div>;

  const artistName = track.artist_name;
  const trackTitle = track.title;
  const cpmPer1M = track.cpm_rate_cents ? `$${((track.cpm_rate_cents / 100) * 1000).toFixed(0)}` : null;
  const seoSlug = track.track_slug || params.id;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'MusicRecording', name: trackTitle, byArtist: { '@type': 'MusicGroup', name: artistName }, image: track.cover_art_url || track.spotify_image_url, url: `https://selah.fm/artist/${params.slug}/tracks/${seoSlug}`, datePublished: track.created_at ? new Date(track.created_at).toISOString().split('T')[0] : undefined },
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

      {/* Screen-reader SEO content — crawlable by Google even before JS loads */}
      <div className="sr-only" aria-hidden="true">
        <h1>{trackTitle} by {artistName}</h1>
        <p>{cpmPer1M ? `Promote "${trackTitle}" by ${artistName} and earn ${cpmPer1M} per 1M verified views. Available on Selah.fm.` : `Listen to "${trackTitle}" by ${artistName} and learn how to earn promoting it on Selah.fm.`}</p>
      </div>

      {/* Breadcrumb — server-rendered for SEO */}
      <nav aria-label="Breadcrumb" className="text-[11px] text-muted-foreground/40 max-w-4xl mx-auto px-4 pt-12 pb-0">
        <ol className="flex items-center gap-1.5">
          <li><a href="/" className="hover:text-muted-foreground">Selah.fm</a><span className="ml-1.5">/</span></li>
          <li><a href={`/artist/${params.slug}`} className="hover:text-muted-foreground">{artistName}</a><span className="ml-1.5">/</span></li>
          <li className="text-muted-foreground/60 truncate max-w-[200px]">{trackTitle}</li>
        </ol>
      </nav>

      {/* Client component — earnings calculator, CTA, sticky bar, streaming links */}
      <TrackDetailClient track={track} slug={params.slug} />
    </>
  );
}
