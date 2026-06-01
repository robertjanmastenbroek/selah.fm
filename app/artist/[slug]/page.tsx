import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import { getArtistMetricsTimeline } from '@/lib/artist-metrics';
import ArtistCardClient from './ArtistCardClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const [artist] = await sql`
    SELECT da.artist_name, ap.spotify_image_url FROM artist_profiles ap
    JOIN discovered_artists da ON da.id = ap.artist_id
    WHERE ap.slug = ${params.slug} LIMIT 1
  `;
  if (!artist) return { title: 'Artist not found — Selah.fm' };
  return {
    title: `${artist.artist_name} Stats — Spotify Listeners, Social Followers | Selah.fm`,
    description: `See ${artist.artist_name}'s complete music & social stats. Free by Selah.fm.`,
    openGraph: { title: `${artist.artist_name} — Artist Dashboard | Selah.fm`, images: artist.spotify_image_url ? [{ url: artist.spotify_image_url }] : [] },
  };
}

export default async function ArtistCardPage({ params }: { params: { slug: string } }) {
  const [artist] = await sql`
    SELECT da.id, da.artist_name, da.latest_track_name, ap.slug, ap.spotify_image_url,
           ap.last_refreshed_at, ap.total_followers,
           c.slug as campaign_slug,
           aa.instagram_handle, aa.tiktok_handle, aa.youtube_video_url as youtube_url
    FROM artist_profiles ap
    JOIN discovered_artists da ON da.id = ap.artist_id
    LEFT JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
    LEFT JOIN campaigns c ON c.id = cc.campaign_id
    LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
    WHERE ap.slug = ${params.slug} LIMIT 1
  `;
  if (!artist) notFound();

  const data = await getArtistMetricsTimeline(artist.id);
  return <ArtistCardClient artist={artist} initialData={data || {}} />;
}
