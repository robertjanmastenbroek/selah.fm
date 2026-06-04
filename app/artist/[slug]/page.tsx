import type { Metadata } from 'next';
import sql from '@/lib/db';
import ArtistProfileClient from './ArtistProfileClient';

export const dynamic = 'force-dynamic';

interface Props { params: { slug: string } }

async function getArtistData(slug: string) {
  try {
  // Find artist by slug (with name-based fallback)
  let [artist] = await sql`
    SELECT da.id, da.artist_name, da.genres, da.monthly_listeners, da.followers,
           da.social_links, da.latest_track_name, da.latest_track_cover_url,
           da.instagram_handle, da.tiktok_handle, da.spotify_id,
           da.wikipedia_url, da.wikidata_id,
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

  // Fallback: search by artist name (slug → de-slugified name)
  if (!artist) {
    const slugName = slug.replace(/-/g, ' ');
    console.warn(`[ARTIST FALLBACK] No profile slug match for "${slug}" — trying name search with "${slugName}"`);
    [artist] = await sql`
      SELECT da.id, da.artist_name, da.genres, da.monthly_listeners, da.followers,
             da.social_links, da.latest_track_name, da.latest_track_cover_url,
             da.instagram_handle, da.tiktok_handle, da.spotify_id,
             da.wikipedia_url, da.wikidata_id,
             da.comment_count,
             ap.slug as profile_slug, ap.spotify_image_url, ap.total_followers,
             ap.total_streams, ap.total_platforms,
             COALESCE(aa.bio, '') as bio
      FROM discovered_artists da
      LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
      LEFT JOIN artist_audits aa ON aa.discovered_artist_id = da.id
      WHERE LOWER(da.artist_name) LIKE ${'%' + slugName.toLowerCase() + '%'}
      ORDER BY da.monthly_listeners DESC NULLS LAST
      LIMIT 1
    `;
    if (artist) console.log(`[ARTIST FALLBACK] Found "${artist.artist_name}" via name search for slug "${slug}"`);
  }

  if (!artist) {
    console.error(`[ARTIST 404] No artist found for slug: ${slug} — check artist_profiles and campaign_claims`);
    return null;
  }

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

  // Fetch donation totals + submission stats (across all campaigns, not just artist_tracks)
  // Also includes lifetime deposits from wallet (not just individual donation records)
  const [donationStats] = await sql`
    SELECT
      (COALESCE(SUM(cd.amount_cents), 0) + COALESCE(SUM(ad2.amount_cents), 0) + COALESCE(MAX(ap.lifetime_deposits_cents), 0))::int as total_cents,
      (COUNT(DISTINCT cd.id) + COUNT(DISTINCT ad2.id))::int as donation_count,
      COUNT(DISTINCT COALESCE(cd.donor_id, ad2.donor_id))::int as supporter_count
    FROM discovered_artists da
    LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
    LEFT JOIN campaigns c ON c.id IN (SELECT cc2.campaign_id FROM campaign_claims cc2 WHERE cc2.discovered_artist_id = da.id)
    LEFT JOIN campaign_claims cc ON cc.discovered_artist_id = da.id AND cc.campaign_id = c.id
    LEFT JOIN campaign_donations cd ON cd.campaign_id = c.id
    LEFT JOIN artist_donations ad2 ON ad2.artist_id = da.id AND ad2.status = 'completed'
    WHERE da.id = ${artistId}
  `;

  // Fetch ALL submissions count from campaign_claims (not just from artist_tracks)
  const [submissionStats] = await sql`
    SELECT
      COALESCE(SUM(s.views_verified), 0)::int as total_views,
      COUNT(s.id)::int as total_submissions,
      COUNT(CASE WHEN s.review_status = 'approved' THEN 1 END)::int as approved_submissions
    FROM submissions s
    JOIN campaigns c ON c.id = s.campaign_id
    JOIN campaign_claims cc ON cc.campaign_id = c.id
    WHERE cc.discovered_artist_id = ${artistId}
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


  // Fetch active campaigns for this artist
  const campaigns = await sql`
    SELECT c.id, c.slug, c.track_title, c.cpm_rate_cents, c.total_budget_cents,
           c.status, c.created_at
    FROM campaigns c
    JOIN campaign_claims cc ON cc.campaign_id = c.id
    WHERE cc.discovered_artist_id = ${artistId}
      AND c.status = 'active'
    ORDER BY c.created_at DESC LIMIT 5
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

  // Fetch balance
  const [balanceRow] = await sql`
    SELECT balance_cents FROM artist_profiles WHERE artist_id = ${artistId}
  `;

  return {
    artist: {
      ...artist,
      genres: artist.genres
        ? (Array.isArray(artist.genres) ? artist.genres : 
           typeof artist.genres === 'string' 
             ? (() => { try { return JSON.parse(artist.genres); } catch { return [artist.genres]; } })()
             : [artist.genres])
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
      total_views: submissionStats.total_views,
      total_submissions: submissionStats.total_submissions,
    },
    balance_cents: balanceRow?.balance_cents || 0,
    recent_submissions: recentSubmissions,
    related_artists: relatedArtists,
    campaigns,
  };
  } catch (e: any) {
    console.error('[ARTIST DATA] Error in getArtistData:', e.message);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getArtistData(params.slug);
  if (!data) return { title: 'Artist not found — Selah.fm' };

  const { artist, stats, tracks } = data;
  const name = artist.artist_name;
  const genres = artist.genres || [];
  const trackLabel = stats.total_tracks === 1 ? '1 track' : `${stats.total_tracks} tracks`;
  const topTrack = tracks[0]?.track_title || '';
  const topCpm = tracks[0]?.cpm_rate_cents ? (tracks[0].cpm_rate_cents / 100).toFixed(2) : null;
  const listeners = artist.monthly_listeners || 0;
  const listenerStr = listeners > 0
    ? `${listeners >= 1000 ? (listeners / 1000).toFixed(1) + 'K' : listeners} monthly listeners`
    : '';

  // Keyword-rich, unique meta description per artist
  const desc = `Support ${name} on Selah.fm. ${trackLabel}${topTrack ? ` including "${topTrack}"` : ''}${listenerStr ? `. ${listenerStr}` : ''}${topCpm ? `. Earn $${(parseFloat(topCpm) * 1000).toFixed(0)} per 1M verified views` : ''}. ${genres.slice(0, 2).join(' / ')} artist. Donate, create content, and earn per verified view.`;

  // Noindex artists with no tracks and no activity (thin content)
  const isThin = stats.total_tracks === 0 || (stats.total_donations_cents === 0 && (artist.comment_count || 0) === 0 && stats.total_submissions === 0);

  return {
    title: `${name} — Music Promotion & Fan Community | Selah.fm`,
    description: desc.slice(0, 160),
    ...(isThin ? { robots: { index: false, follow: true } as const } : {}),
    openGraph: {
      title: `${name} — Music Promotion & Fan Community | Selah.fm`,
      description: desc.slice(0, 160),
      images: artist.spotify_image_url ? [{ url: artist.spotify_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — Music Promotion & Fan Community | Selah.fm`,
      description: desc.slice(0, 160),
      images: artist.spotify_image_url ? [artist.spotify_image_url] : [],
    },
    alternates: { canonical: `https://selah.fm/artist/${params.slug}` },
  };
}

export default async function ArtistPage({ params }: Props) {
  const data = await getArtistData(params.slug);
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0F0F23' }}>
        <div className="text-center max-w-sm space-y-4">
          <h1 className="text-4xl mb-2">🎵</h1>
          <h2 className="text-lg font-semibold">Artist not found</h2>
          <p className="text-sm text-muted-foreground">
            This artist doesn't exist or has been removed from Selah.fm.
          </p>
          <a href="/browse" className="inline-block px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            Browse artists
          </a>
        </div>
      </div>
    );
  }

  const { artist, tracks, stats, recent_submissions, related_artists, campaigns } = data;

  // Build JSON-LD with dynamic FAQ, description, and aggregateRating
  const bio = artist.bio || '';
  const supporterCount = stats.supporter_count || 0;
  const totalDonations = stats.total_donations_cents || 0;
  const listeners = artist.monthly_listeners || 0;
  const genres = artist.genres || [];
  const topCpm = tracks[0]?.cpm_rate_cents ? (tracks[0].cpm_rate_cents / 100).toFixed(2) : null;

  // Dynamic FAQ — artist-specific, genre-tailored
  const faqQuestions: { '@type': string; name: string; acceptedAnswer: { '@type': string; text: string } }[] = [
    {
      '@type': 'Question',
      name: `How do I support ${artist.artist_name} on Selah.fm?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Donate to ${artist.artist_name}'s campaign on Selah.fm. Your donation funds promotion of their music${topCpm ? `, and creators earn $${(parseFloat(topCpm) * 1000).toFixed(0)} per 1M verified views` : ''} for making videos featuring their tracks. ${genres.slice(0, 2).join(' and ')} artist.`,
      },
    },
    {
      '@type': 'Question',
      name: `How can creators earn money making videos for ${artist.artist_name}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Pick a track from ${artist.artist_name}'s catalog, create a short video on TikTok, Instagram Reels, or YouTube Shorts featuring the official audio, submit it, and earn${topCpm ? ` $${(parseFloat(topCpm) * 1000).toFixed(0)} per 1M` : ''} verified views. No upfront cost for creators — join free.`,
      },
    },
    {
      '@type': 'Question',
      name: `What genre is ${artist.artist_name}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${artist.artist_name} creates ${genres.slice(0, 3).join(', ')} music.${listeners > 0 ? ` They have ${listeners >= 1000 ? (listeners / 1000).toFixed(1) + 'K' : listeners} monthly listeners on Spotify.` : ''} Support them on Selah.fm.`,
      },
    },
    {
      '@type': 'Question',
      name: `How many tracks does ${artist.artist_name} have on Selah.fm?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${artist.artist_name} has ${stats.total_tracks} ${stats.total_tracks === 1 ? 'track' : 'tracks'}${tracks[0]?.track_title ? ` including "${tracks[0].track_title}"` : ''} available on Selah.fm. Each track has its own CPM rate for creator earnings.`,
      },
    },
  ];

  // Add genre-specific question if we have a genre match
  const genreQuestionMap: Record<string, { q: string; a: string }> = {
    electronic: { q: `Where can I listen to ${artist.artist_name}'s electronic music?`, a: `Stream ${artist.artist_name}'s electronic tracks on Spotify, Apple Music, and YouTube. Visit their Selah.fm profile for direct links and to support their music promotion.` },
    'hip-hop': { q: `Is ${artist.artist_name} looking for video creators?`, a: `Yes, ${artist.artist_name} is accepting video submissions on Selah.fm. Creators can submit TikTok, Reels, and YouTube Shorts featuring their tracks and earn per verified view.` },
    pop: { q: `What makes ${artist.artist_name}'s pop music unique?`, a: `${artist.artist_name} creates ${genres.slice(0, 2).join(' and ')} music. Support their promotion on Selah.fm by donating or creating video content featuring their tracks.` },
    rock: { q: `Does ${artist.artist_name} have active music promotion campaigns?`, a: `${artist.artist_name} promotes their music through Selah.fm. Creators can earn by making videos for their tracks. Check their profile for active campaigns and CPM rates.` },
    indie: { q: `How can I discover more indie artists like ${artist.artist_name}?`, a: `Browse ${genres[0]} artists on Selah.fm's artist directory. Each independent artist has tracks available for creator video campaigns with transparent CPM rates.` },
  };
  for (const genre of genres) {
    const match = genreQuestionMap[genre.toLowerCase()];
    if (match) {
      faqQuestions.push({
        '@type': 'Question',
        name: match.q,
        acceptedAnswer: { '@type': 'Answer', text: match.a },
      });
      break; // Add at most one genre-specific question
    }
  }

  const socialLinks = artist.social_links || {};

  // Build identifiers array (spotify, wikidata) for Schema.org identifier
  const identifiers = [
    artist.spotify_id && `spotify:${artist.spotify_id}`,
    artist.wikidata_id && `wikidata:${artist.wikidata_id}`,
  ].filter(Boolean);

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `https://selah.fm/artist/${params.slug}#webpage`,
        url: `https://selah.fm/artist/${params.slug}`,
        name: `${artist.artist_name} — Music Promotion Profile | Selah.fm`,
        description: (bio || `Support ${artist.artist_name} on Selah.fm`).slice(0, 200),
        mainEntity: { '@id': `https://selah.fm/artist/${params.slug}#artist` },
      },
      {
        '@type': 'MusicGroup',
        '@id': `https://selah.fm/artist/${params.slug}#artist`,
        name: artist.artist_name,
        url: `https://selah.fm/artist/${params.slug}`,
        description: (bio || `Independent ${genres.slice(0, 2).join(' and ')} artist on Selah.fm`).slice(0, 200),
        genre: genres.join(', ') || undefined,
        image: artist.spotify_image_url || undefined,
        identifier: identifiers.length > 0 ? identifiers : undefined,
        sameAs: [
          ...(artist.spotify_id ? [`https://open.spotify.com/artist/${artist.spotify_id}`] : []),
          ...(socialLinks.spotify ? [socialLinks.spotify] : []),
          ...(socialLinks.youtube ? [socialLinks.youtube] : []),
          ...(socialLinks.bandcamp ? [socialLinks.bandcamp] : []),
          ...(socialLinks.soundcloud ? [socialLinks.soundcloud] : []),
          ...(artist.instagram_handle ? [`https://instagram.com/${artist.instagram_handle}`] : []),
          ...(artist.wikipedia_url ? [artist.wikipedia_url] : []),
        ].filter(Boolean),
        ...(supporterCount > 0 ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Math.min(5, Math.max(1, Math.round((supporterCount / 10) * 10) / 10)),
            bestRating: 5,
            ratingCount: supporterCount,
            reviewCount: supporterCount,
          },
        } : {}),
        ...(campaigns.length > 0 ? {
          potentialAction: {
            '@type': 'DonateAction',
            target: `https://selah.fm/artist/${params.slug}`,
          },
        } : {}),
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
        mainEntity: faqQuestions,
      },
    ],
  };

  // Build social links (defined before schema for sameAs use)
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
        campaigns={campaigns}
        balanceCents={data.balance_cents}
      />
    </>
  );
}
