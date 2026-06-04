import { Metadata } from 'next';
import Link from 'next/link';
import sql from '@/lib/db';
import ArtistCardClient from '@/components/ArtistCard';

export const dynamic = 'force-dynamic';

interface Props { params: { genre: string } }

const GENRE_LABELS: Record<string, string> = {
  'electronic': 'Electronic Music', 'hip-hop': 'Hip Hop', 'pop': 'Pop',
  'rock': 'Rock', 'indie': 'Indie', 'r&b': 'R&B / Soul', 'jazz': 'Jazz',
  'metal': 'Metal', 'folk': 'Folk', 'country': 'Country', 'ambient': 'Ambient',
  'punk': 'Punk', 'alternative': 'Alternative', 'experimental': 'Experimental',
  'latin': 'Latin', 'classical': 'Classical', 'reggae': 'Reggae',
  'blues': 'Blues', 'soul': 'Soul', 'funk': 'Funk', 'world': 'World',
  'dance': 'Dance',
};

const GENRE_DESCRIPTIONS: Record<string, string> = {
  electronic: `Browse electronic artists on Selah.fm. Make videos featuring house, techno, ambient, or experimental electronic tracks and earn per verified view.`,
  'hip-hop': `Browse hip hop artists on Selah.fm. Make TikToks, Reels, and Shorts featuring rap and hip hop tracks and earn per view. Independent rappers can promote their music through creator-generated content.`,
  pop: `Browse pop artists on Selah.fm. Create content featuring pop music and earn per verified view. Pop artists grow their reach through creator submissions.`,
  rock: `Browse rock artists on Selah.fm. Make videos featuring rock, indie rock, and alternative tracks. Earn per view helping rock artists reach new audiences.`,
  indie: `Browse indie artists on Selah.fm. Independent musicians get discovered through creator-made content. Earn per view making videos for indie tracks.`,
  'r&b': `Browse R&B and Soul artists on Selah.fm. Create content featuring R&B tracks and earn per verified view. Support soulful artists by making videos with their music.`,
  jazz: `Browse jazz artists on Selah.fm. Make videos featuring jazz, fusion, and contemporary jazz. Earn per view helping jazz musicians reach new listeners.`,
  metal: `Browse metal artists on Selah.fm. Create content featuring metal, hardcore, and heavy music. Earn per view promoting metal artists.`,
  folk: `Browse folk artists on Selah.fm. Make videos featuring folk, singer-songwriter, and acoustic tracks. Earn per view supporting independent folk musicians.`,
  country: `Browse country artists on Selah.fm. Create content featuring country, alt-country, and Americana. Earn per view helping country artists grow.`,
  ambient: `Browse ambient artists on Selah.fm. Make videos featuring ambient, drone, and soundscape tracks. Earn per view promoting ambient musicians.`,
  punk: `Browse punk artists on Selah.fm. Create content featuring punk, hardcore, and DIY music. Earn per view supporting independent punk artists.`,
  alternative: `Browse alternative artists on Selah.fm. Make videos featuring alternative, grunge, and post-punk. Earn per view promoting alternative musicians.`,
  experimental: `Browse experimental artists on Selah.fm. Create content featuring experimental, avant-garde, and boundary-pushing music. Earn per view.`,
  latin: `Browse latin artists on Selah.fm. Make videos featuring Latin, reggaeton, bachata, and salsa. Earn per view supporting Latin musicians.`,
};

const GENRE_EMOJIS: Record<string, string> = {
  electronic: '⚡', 'hip-hop': '🎤', pop: '⭐', rock: '🎸', indie: '🎵',
  'r&b': '🎙️', jazz: '🎷', metal: '🤘', folk: '🪕', country: '🤠',
  ambient: '🌊', punk: '🔥', alternative: '🌀', experimental: '🔬', latin: '💃',
  classical: '🎻', reggae: '🌴', blues: '🎶', soul: '💫', funk: '🕺',
  world: '🌍', dance: '💃',
};

const RELATED: Record<string, string[]> = {
  electronic: ['ambient', 'pop', 'experimental', 'dance'],
  'hip-hop': ['pop', 'r&b', 'latin', 'reggae'],
  pop: ['electronic', 'hip-hop', 'rock', 'dance'],
  rock: ['alternative', 'indie', 'metal', 'punk'],
  indie: ['alternative', 'folk', 'rock', 'country'],
  'r&b': ['hip-hop', 'pop', 'jazz', 'soul'],
  jazz: ['ambient', 'r&b', 'experimental', 'blues'],
  metal: ['punk', 'rock', 'experimental', 'alternative'],
  folk: ['indie', 'country', 'ambient', 'blues'],
  country: ['folk', 'rock', 'indie', 'blues'],
  ambient: ['electronic', 'experimental', 'jazz', 'classical'],
  punk: ['alternative', 'metal', 'rock', 'indie'],
  alternative: ['indie', 'rock', 'punk', 'experimental'],
  experimental: ['ambient', 'electronic', 'jazz', 'alternative'],
  latin: ['pop', 'hip-hop', 'reggae', 'dance'],
  classical: ['ambient', 'jazz', 'experimental'],
  reggae: ['latin', 'hip-hop', 'dance', 'world'],
  blues: ['jazz', 'soul', 'folk', 'rock'],
  soul: ['r&b', 'blues', 'jazz', 'pop'],
  funk: ['dance', 'r&b', 'soul', 'electronic'],
  world: ['reggae', 'folk', 'ambient', 'experimental'],
  dance: ['electronic', 'pop', 'funk', 'latin'],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const genre = params.genre;
  const label = GENRE_LABELS[genre] || genre.charAt(0).toUpperCase() + genre.slice(1);
  try {
    const [{ count }] = await sql`
      SELECT COUNT(DISTINCT da.id)::int FROM discovered_artists da
      JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
      JOIN campaigns c ON c.id = cc.campaign_id
      WHERE c.status IN ('active', 'draft') AND da.genres::text ILIKE ${'%' + genre + '%'}
    `;
    return {
      title: `${label} Artists — Make Videos & Earn Per View | Selah.fm`,
      description: `Browse ${count} ${label.toLowerCase()} artists on Selah.fm. Create videos featuring ${label.toLowerCase()} tracks and earn per verified view. Support your favorite ${label.toLowerCase()} musicians.`,
      openGraph: { title: `${label} Artists on Selah.fm`, description: `Create videos for ${count} ${label.toLowerCase()} artists and earn per view.` },
    };
  } catch {
    return { title: `${label} Artists — Selah.fm`, description: `Browse ${label.toLowerCase()} artists on Selah.fm.` };
  }
}

export default async function GenrePage({ params }: Props) {
  const genre = params.genre;
  const label = GENRE_LABELS[genre] || genre.charAt(0).toUpperCase() + genre.slice(1);
  const emoji = GENRE_EMOJIS[genre] || '🎵';
  const description = GENRE_DESCRIPTIONS[genre] || `Browse ${label.toLowerCase()} artists on Selah.fm. Make videos, earn per view, and support your favorite ${label.toLowerCase()} musicians.`;

  const artists = await sql`
    SELECT da.id, da.artist_name, da.genres, da.monthly_listeners,
           ap.slug, ap.spotify_image_url, ap.total_followers,
           COUNT(DISTINCT c.id)::int as track_count,
           COALESCE(SUM(v.total_verified_views::int), 0)::int as total_views
    FROM discovered_artists da
    LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
    JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
    JOIN campaigns c ON c.id = cc.campaign_id
    LEFT JOIN campaign_stats v ON v.id = c.id
    WHERE c.status IN ('active', 'draft') AND da.genres::text ILIKE ${'%' + genre + '%'}
    GROUP BY da.id, ap.slug, ap.spotify_image_url, ap.total_followers
    ORDER BY track_count DESC, COALESCE(da.monthly_listeners, 0) DESC
    LIMIT 50
  `;

  const totalTracks = artists.reduce((s: number, a: any) => s + (a.track_count || 0), 0);
  const totalViews = artists.reduce((s: number, a: any) => s + (a.total_views || 0), 0);
  const related = (RELATED as Record<string, string[]>)[genre] || [];

  // MusicGenre + Breadcrumb schema
  const genreSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'MusicGenre',
        name: label,
        description: description?.slice(0, 200),
        url: `https://selah.fm/browse/genre/${encodeURIComponent(genre)}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Selah.fm', item: 'https://selah.fm' },
          { '@type': 'ListItem', position: 2, name: 'Browse', item: 'https://selah.fm/browse' },
          { '@type': 'ListItem', position: 3, name: label, item: `https://selah.fm/browse/genre/${encodeURIComponent(genre)}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0F0F23]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(genreSchema) }} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">

        {/* ── HERO ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/[0.06] via-primary/[0.02] to-indigo-500/[0.04] border border-white/[0.06] p-8 md:p-12 mt-6 mb-8">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />

          {/* Breadcrumb */}
          <nav className="relative z-10 flex items-center gap-1.5 text-[11px] text-muted-foreground/40 mb-5">
            <Link href="/" className="hover:text-muted-foreground transition-colors">Selah.fm</Link>
            <span>/</span>
            <Link href="/browse" className="hover:text-muted-foreground transition-colors">Browse</Link>
            <span>/</span>
            <span className="text-muted-foreground/60">{label}</span>
          </nav>

          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              {emoji} {label} Artists
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              {description}
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-4 mt-5 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <span className="text-lg">{emoji}</span>
                <div>
                  <span className="font-bold text-foreground">{artists.length}</span>
                  <span className="text-muted-foreground/60 ml-1">artists</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[10px]">🎵</span>
                <div>
                  <span className="font-bold text-foreground">{totalTracks}</span>
                  <span className="text-muted-foreground/60 ml-1">tracks</span>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <span className="text-[10px]">👁️</span>
                <div>
                  <span className="font-bold text-foreground">{totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews}</span>
                  <span className="text-muted-foreground/60 ml-1">total views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ARTIST GRID ──────────────────────────────────── */}
        {artists.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{emoji}</span>
            </div>
            <p className="text-muted-foreground">No {label.toLowerCase()} artists found yet.</p>
            <p className="text-xs text-muted-foreground/50 mt-2">Check back soon — new artists are added daily.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artists.map((artist: any) => (
              <div key={artist.id} className="[&>*]:h-full">
                <ArtistCardClient artist={artist} />
              </div>
            ))}
          </div>
        )}

        {/* ── RELATED GENRES ───────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-16 pt-8 border-t border-white/[0.06]">
            <h2 className="text-sm font-semibold mb-4">Related genres</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((rg: string) => (
                <Link key={rg} href={`/browse/genre/${rg}`}
                  className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-white/[0.05] transition-all active:scale-95">
                  {GENRE_LABELS[rg] || rg.charAt(0).toUpperCase() + rg.slice(1)}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── SEO CONTENT ──────────────────────────────────── */}
        <section className="mt-12 text-xs text-muted-foreground/40 leading-relaxed space-y-2 max-w-3xl">
          <h2 className="text-sm font-semibold text-foreground/60">How it works</h2>
          <p>Creators make short-form videos (TikTok, Instagram Reels, YouTube Shorts) featuring {label.toLowerCase()} music and earn per verified view. Artists get free promotion through user-generated content. Fans can donate to support their favorite {label.toLowerCase()} artists directly.</p>
          <p>Every artist page on Selah.fm is automatically created. Artists can claim their page to manage tracks, set CPM rates, and withdraw donations. No sign-up required to start supporting or creating.</p>
        </section>
      </main>
    </div>
  );
}
