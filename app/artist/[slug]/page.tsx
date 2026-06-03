import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import sql from '@/lib/db';
import ArtistProfileClient from './ArtistProfileClient';

export const dynamic = 'force-dynamic';

interface Props { params: { slug: string } }

async function getArtistData(slug: string) {
  // Find artist by slug
  const [artist] = await sql`
    SELECT da.id, da.artist_name, da.genres, da.monthly_listeners, da.followers,
           da.social_links, da.latest_track_name, da.latest_track_cover_url,
           da.instagram_handle, da.tiktok_handle, da.spotify_id,
           da.comment_count,
           ap.slug as profile_slug, ap.spotify_image_url, ap.total_followers,
           ap.total_streams, ap.total_platforms,
           COALESCE(aa.bio, '') as bio
    FROM discovered_artists da
    LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
    LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
    WHERE ap.slug = ${slug}
    ORDER BY aa.audited_at DESC
    LIMIT 1
  `;
  if (!artist) return null;

  const artistId = artist.id;

  // Fetch tracks from artist_tracks catalog
  const tracks = await sql`
    SELECT at.id, at.title as track_title, at.spotify_url as track_url,
           at.cover_art_url, at.cpm_rate_cents, at.enabled, at.sort_order,
           at.created_at
    FROM artist_tracks at
    WHERE at.artist_id = ${artistId} AND at.enabled = true
    ORDER BY at.sort_order ASC, at.created_at DESC
  `;

  // Fetch donation totals (campaign + artist-level)
  const [donationStats] = await sql`
    SELECT
      (COALESCE(SUM(cd.amount_cents), 0) + COALESCE(SUM(ad2.amount_cents), 0))::int as total_cents,
      (COUNT(DISTINCT cd.id) + COUNT(DISTINCT ad2.id))::int as donation_count,
      COUNT(DISTINCT COALESCE(cd.donor_id, ad2.donor_id))::int as supporter_count
    FROM discovered_artists da
    LEFT JOIN campaigns c ON c.id IN (SELECT cc2.campaign_id FROM campaign_claims cc2 WHERE cc2.discovered_artist_id = da.id)
    LEFT JOIN campaign_claims cc ON cc.discovered_artist_id = da.id AND cc.campaign_id = c.id
    LEFT JOIN campaign_donations cd ON cd.campaign_id = c.id
    LEFT JOIN artist_donations ad2 ON ad2.artist_id = da.id AND ad2.status = 'completed'
    WHERE da.id = ${artistId}
  `;

  // Fetch recent approved submissions
  const recentSubmissions = await sql`
    SELECT s.id, s.content_url, s.platform, s.views_verified, s.reactions_count,
           s.created_at, c.track_title
    FROM submissions s
    JOIN campaigns c ON c.id = s.campaign_id
    JOIN campaign_claims cc ON cc.campaign_id = c.id
    WHERE cc.discovered_artist_id = ${artistId}
      AND s.review_status = 'approved'
    ORDER BY s.created_at DESC LIMIT 6
  `;


  // Fetch related artists (same genre, different artist)
  const relatedArtists = await sql`
    SELECT da.id, da.artist_name, da.genres, da.monthly_listeners,
           ap.slug, ap.spotify_image_url
    FROM discovered_artists da
    JOIN artist_profiles ap ON ap.artist_id = da.id
    WHERE da.id != ${artistId}
      AND da.genres::text ILIKE ${"%" + (Array.isArray(artist.genres) ? artist.genres[0] || "" : "") + "%"}
      AND EXISTS (SELECT 1 FROM artist_tracks at WHERE at.artist_id = da.id AND at.enabled = true)
    ORDER BY da.monthly_listeners DESC NULLS LAST
    LIMIT 4
  `;

  return {
    artist: {
      ...artist,
      genres: artist.genres
        ? (Array.isArray(artist.genres) ? artist.genres : [artist.genres])
        : [],
      social_links: typeof artist.social_links === 'string'
        ? JSON.parse(artist.social_links)
        : (artist.social_links || {}),
    },
    tracks,
    stats: {
      total_tracks: tracks.length,
      total_donations_cents: donationStats.total_cents,
      donation_count: donationStats.donation_count,
      supporter_count: donationStats.supporter_count,
      total_views: tracks.reduce((s: number, t: any) => s + (t.total_views || 0), 0),
      total_submissions: tracks.reduce((s: number, t: any) => s + (t.submissions_count || 0), 0),
    },
    recent_submissions: recentSubmissions,
    related_artists: relatedArtists,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getArtistData(params.slug);
  if (!data) return { title: 'Artist not found — Selah.fm' };

  const { artist, stats } = data;
  const name = artist.artist_name;
  const genres = artist.genres || [];
  const trackLabel = stats.total_tracks === 1 ? '1 track' : `${stats.total_tracks} tracks`;
  const desc = `Support ${name} on Selah.fm. ${trackLabel} available. ${genres.slice(0, 2).join(', ')} artist. Donate, make videos, and earn per view.`;

  // Noindex artists with no tracks and no activity (thin content)
  const isThin = stats.total_tracks === 0 || (stats.total_donations_cents === 0 && (artist.comment_count || 0) === 0 && stats.total_submissions === 0);

  return {
    title: `${name} — Music Promotion & Fan Community | Selah.fm`,
    description: desc.slice(0, 160),
    ...(isThin ? { robots: { index: false, follow: true } as const } : {}),
    openGraph: {
      title: `${name} — Selah.fm`,
      description: desc.slice(0, 160),
      images: artist.spotify_image_url ? [{ url: artist.spotify_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — Selah.fm`,
      description: desc.slice(0, 160),
      images: artist.spotify_image_url ? [artist.spotify_image_url] : [],
    },
    alternates: { canonical: `https://selah.fm/artist/${params.slug}` },
  };
}

export default async function ArtistPage({ params }: Props) {
  const data = await getArtistData(params.slug);
  if (!data) notFound();

  const { artist, tracks, stats, recent_submissions, related_artists } = data;

  // Build JSON-LD
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MusicGroup',
        name: artist.artist_name,
        genre: artist.genres?.join(', ') || undefined,
        ...(artist.spotify_image_url ? { image: artist.spotify_image_url } : {}),
        ...(artist.monthly_listeners ? { 'identifier': `spotify:${artist.spotify_id || ''}` } : {}),
      },
      ...tracks.map((t: any) => ({
        '@type': 'MusicRecording',
        name: t.track_title,
        byArtist: { '@type': 'MusicGroup', name: artist.artist_name },
        ...(t.cover_art_url ? { image: t.cover_art_url } : {}),
      })),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Selah.fm', item: 'https://selah.fm' },
          { '@type': 'ListItem', position: 2, name: 'Browse Artists', item: 'https://selah.fm/browse' },
          { '@type': 'ListItem', position: 3, name: artist.artist_name, item: `https://selah.fm/artist/${params.slug}` },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `How do I support ${artist.artist_name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `You can support ${artist.artist_name} by donating through Selah.fm. Your donations go toward promoting their music, and creators earn per view for making videos featuring their tracks.`,
            },
          },
          {
            '@type': 'Question',
            name: `How do I make a video for ${artist.artist_name} and earn?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Pick a track from ${artist.artist_name}'s catalog, create a short video on TikTok, Instagram Reels, or YouTube Shorts featuring the official audio, submit it, and earn per verified view.`,
            },
          },
        ],
      },
    ],
  };

  // Build social links
  const socialLinks = artist.social_links || {};
  const socialButtons: { label: string; url: string; icon: string }[] = [];
  if (artist.instagram_handle) socialButtons.push({ label: 'Instagram', url: `https://instagram.com/${artist.instagram_handle}`, icon: '📸' });
  if (artist.tiktok_handle) socialButtons.push({ label: 'TikTok', url: `https://tiktok.com/@${artist.tiktok_handle}`, icon: '🎵' });
  if (socialLinks.spotify) socialButtons.push({ label: 'Spotify', url: socialLinks.spotify, icon: '🟢' });
  if (socialLinks.youtube) socialButtons.push({ label: 'YouTube', url: socialLinks.youtube, icon: '▶️' });
  if (socialLinks.bandcamp) socialButtons.push({ label: 'Bandcamp', url: socialLinks.bandcamp, icon: '🎵' });
  if (socialLinks.soundcloud) socialButtons.push({ label: 'SoundCloud', url: socialLinks.soundcloud, icon: '☁️' });

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* SEO breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-5xl mx-auto px-4 pt-4 pb-0">
        <ol className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40">
          <li><a href="/" className="hover:text-muted-foreground transition-colors">Selah.fm</a></li>
          <li className="text-muted-foreground/20">/</li>
          <li><a href="/browse" className="hover:text-muted-foreground transition-colors">Browse</a></li>
          <li className="text-muted-foreground/20">/</li>
          <li className="text-muted-foreground/60 truncate max-w-[200px]">{artist.artist_name}</li>
        </ol>
      </nav>

      {/* Client-side interactive profile */}
      <ArtistProfileClient
        artist={artist}
        tracks={tracks}
        stats={stats}
        recentSubmissions={recent_submissions}
        relatedArtists={related_artists || []}
        socialButtons={socialButtons}
        slug={params.slug}
      />
    </>
  );
}
