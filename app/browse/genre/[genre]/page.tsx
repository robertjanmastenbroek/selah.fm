import { Metadata } from 'next';
import sql from '@/lib/db';
import ArtistCardClient from '@/components/ArtistCard';

export const dynamic = 'force-dynamic';

interface Props { params: { genre: string } }

const GENRE_LABELS: Record<string, string> = {
  'electronic': 'Electronic Music',
  'hip-hop': 'Hip Hop',
  'pop': 'Pop',
  'rock': 'Rock',
  'indie': 'Indie',
  'r&b': 'R&B / Soul',
  'jazz': 'Jazz',
  'metal': 'Metal',
  'folk': 'Folk',
  'country': 'Country',
  'ambient': 'Ambient',
  'punk': 'Punk',
  'alternative': 'Alternative',
  'experimental': 'Experimental',
  'latin': 'Latin',
};

const GENRE_DESCRIPTIONS: Record<string, string> = {
  'electronic': `Browse ${GENRE_LABELS.electronic || 'Electronic'} artists on Selah.fm. Create short-form videos featuring electronic tracks and earn per verified view. Whether you make house, techno, ambient, or experimental electronic music, fans can support you and creators can promote your tracks.`,
  'hip-hop': `Browse ${GENRE_LABELS['hip-hop'] || 'Hip Hop'} artists on Selah.fm. Make TikToks, Reels, and Shorts featuring hip hop tracks and earn per view. Independent rappers and producers can get their music promoted through creator-generated content.`,
  'pop': `Browse ${GENRE_LABELS.pop || 'Pop'} artists on Selah.fm. Create content featuring pop music and earn per verified view. Pop artists can grow their reach through fan-funded promotion and creator submissions.`,
  'rock': `Browse ${GENRE_LABELS.rock || 'Rock'} artists on Selah.fm. Make videos featuring rock, indie rock, and alternative tracks. Earn per view while helping rock artists reach new audiences through creator content.`,
  'indie': `Browse ${GENRE_LABELS.indie || 'Indie'} artists on Selah.fm. Independent musicians can get discovered through creator-made content. Earn per view making videos for indie tracks you love.`,
  'r&b': `Browse ${GENRE_LABELS['r&b'] || 'R&B'} and Soul artists on Selah.fm. Create content featuring R&B tracks and earn per verified view. Support soulful artists by making videos with their music.`,
  'jazz': `Browse ${GENRE_LABELS.jazz || 'Jazz'} artists on Selah.fm. Make videos featuring jazz, fusion, and contemporary jazz tracks. Earn per view while helping jazz musicians reach new listeners.`,
  'metal': `Browse ${GENRE_LABELS.metal || 'Metal'} artists on Selah.fm. Create content featuring metal, hardcore, and heavy music. Earn per verified view promoting metal artists through your videos.`,
  'folk': `Browse ${GENRE_LABELS.folk || 'Folk'} artists on Selah.fm. Make videos featuring folk, singer-songwriter, and acoustic tracks. Earn per view supporting independent folk musicians.`,
  'country': `Browse ${GENRE_LABELS.country || 'Country'} artists on Selah.fm. Create content featuring country, alt-country, and Americana tracks. Earn per verified view helping country artists grow.`,
  'ambient': `Browse ${GENRE_LABELS.ambient || 'Ambient'} artists on Selah.fm. Make videos featuring ambient, drone, and soundscape tracks. Earn per view while promoting ambient musicians.`,
  'punk': `Browse ${GENRE_LABELS.punk || 'Punk'} artists on Selah.fm. Create content featuring punk, hardcore, and DIY music. Earn per verified view supporting independent punk artists.`,
  'alternative': `Browse ${GENRE_LABELS.alternative || 'Alternative'} artists on Selah.fm. Make videos featuring alternative, grunge, and post-punk tracks. Earn per view promoting alternative musicians.`,
  'experimental': `Browse ${GENRE_LABELS.experimental || 'Experimental'} artists on Selah.fm. Create content featuring experimental, avant-garde, and boundary-pushing music. Earn per verified view.`,
  'latin': `Browse ${GENRE_LABELS.latin || 'Latin'} artists on Selah.fm. Make videos featuring Latin, reggaeton, bachata, and salsa tracks. Earn per view supporting Latin musicians.`,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const genre = params.genre.toLowerCase();
  const label = GENRE_LABELS[genre] || genre.charAt(0).toUpperCase() + genre.slice(1);
  const [{ count }] = await sql`
    SELECT COUNT(DISTINCT da.id)::int FROM discovered_artists da
    JOIN campaign_claims cc ON cc.discovered_artist_id = da.id
    JOIN campaigns c ON c.id = cc.campaign_id
    WHERE c.status IN ('active', 'draft') AND da.genres::text ILIKE ${'%' + genre + '%'}
  `;

  return {
    title: `${label} Artists — Make Videos & Earn Per View | Selah.fm`,
    description: `Browse ${count} ${label.toLowerCase()} artists on Selah.fm. Create videos featuring ${label.toLowerCase()} tracks and earn per verified view. Support your favorite ${label.toLowerCase()} musicians.`,
    openGraph: {
      title: `${label} Artists on Selah.fm`,
      description: `Create videos for ${count} ${label.toLowerCase()} artists and earn per view.`,
    },
  };
}

export default async function GenrePage({ params }: Props) {
  const genre = params.genre.toLowerCase();
  const label = GENRE_LABELS[genre] || genre.charAt(0).toUpperCase() + genre.slice(1);
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

  const relatedGenres = {
    'electronic': ['ambient', 'pop', 'experimental'],
    'hip-hop': ['pop', 'r&b', 'latin'],
    'pop': ['electronic', 'hip-hop', 'rock'],
    'rock': ['alternative', 'indie', 'metal', 'punk'],
    'indie': ['alternative', 'folk', 'rock'],
    'r&b': ['hip-hop', 'pop', 'jazz'],
    'jazz': ['ambient', 'r&b', 'experimental'],
    'metal': ['punk', 'rock', 'experimental'],
    'folk': ['indie', 'country', 'ambient'],
    'country': ['folk', 'rock', 'indie'],
    'ambient': ['electronic', 'experimental', 'jazz'],
    'punk': ['alternative', 'metal', 'rock'],
    'alternative': ['indie', 'rock', 'punk'],
    'experimental': ['ambient', 'electronic', 'jazz'],
    'latin': ['pop', 'hip-hop', 'reggae'],
  };

  const related = (relatedGenres as Record<string, string[]>)[genre] || [];

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb + heading */}
        <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 mb-6">
          <a href="/" className="hover:text-muted-foreground transition-colors">Selah.fm</a>
          <span>/</span>
          <a href="/browse" className="hover:text-muted-foreground transition-colors">Browse</a>
          <span>/</span>
          <span className="text-muted-foreground/60">{label}</span>
        </nav>

        <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
          {label} Artists
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-8">
          {description}
        </p>

        <div className="flex items-center gap-4 mb-8 text-sm text-muted-foreground">
          <span>{artists.length} artists</span>
          <span>·</span>
          <span>{artists.reduce((s: number, a: any) => s + (a.track_count || 0), 0)} tracks available</span>
        </div>

        {artists.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No {label.toLowerCase()} artists found yet.</p>
            <p className="text-xs text-muted-foreground/50 mt-2">Check back soon — new artists are added daily.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {artists.map((artist: any, i: number) => (
              <ArtistCardClient key={artist.id} artist={artist} />
            ))}
          </div>
        )}

        {/* Related genres */}
        {related.length > 0 && (
          <section className="mt-16 pt-8 border-t border-white/[0.06]">
            <h2 className="text-sm font-semibold mb-4">Related genres</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((rg: string) => (
                <a
                  key={rg}
                  href={`/browse/genre/${rg}`}
                  className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all"
                >
                  {GENRE_LABELS[rg] || rg.charAt(0).toUpperCase() + rg.slice(1)}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* SEO content */}
        <section className="mt-12 text-xs text-muted-foreground/40 leading-relaxed space-y-2">
          <h2 className="text-sm font-semibold text-foreground/60">How it works</h2>
          <p>Creators make short-form videos (TikTok, Instagram Reels, YouTube Shorts) featuring {label.toLowerCase()} music and earn per verified view. Artists get free promotion through user-generated content. Fans can donate to support their favorite {label.toLowerCase()} artists directly.</p>
          <p>Every artist page on Selah.fm is automatically created. Artists can claim their page to manage tracks, set CPM rates, and withdraw donations. No sign-up required to start supporting or creating.</p>
        </section>
      </main>
    </div>
  );
}
