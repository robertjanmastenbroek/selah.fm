import { Metadata } from 'next';
import sql from '@/lib/db';
import Link from 'next/link';
import TrackDetailClient from './TrackDetailClient';

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
      JOIN artist_profiles ap ON ap.id = at.artist_id
      JOIN discovered_artists da ON da.id = ap.artist_id
      LEFT JOIN campaigns c ON c.id IN (
        SELECT cc.campaign_id FROM campaign_claims cc WHERE cc.discovered_artist_id = da.id
      )
      WHERE ap.slug = ${slug} AND at.id = ${trackId}::uuid
      LIMIT 1
    `;
    if (!track) return null;

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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'MusicRecording', name: trackTitle, byArtist: { '@type': 'MusicGroup', name: artistName }, image: track.cover_art_url || track.spotify_image_url, url: `https://selah.fm/artist/${params.slug}/tracks/${params.id}`, datePublished: track.created_at ? new Date(track.created_at).toISOString().split('T')[0] : undefined },
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
