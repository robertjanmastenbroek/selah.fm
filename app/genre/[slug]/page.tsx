import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import sql from '@/lib/db';
import CampaignCover from '@/components/CampaignCover';
import { PlatformBadge } from '@/components/SocialIcons';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatGenre(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Deterministic color for budget ring — same algorithm as BrowseClient */
function pctColor(pct: number): string {
  const t = Math.min(pct, 100) / 100;
  const r = Math.round(0x43 + (0x22 - 0x43) * t);
  const g = Math.round(0x38 + (0xc5 - 0x38) * t);
  const b = Math.round(0xca + (0x5e - 0xca) * t);
  return `rgb(${r},${g},${b})`;
}

function BudgetRing({ pct }: { pct: number }) {
  const size = 32;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  const color = pctColor(pct);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span className="absolute text-[11px] font-bold">{Math.round(pct)}%</span>
    </div>
  );
}

/** Capitalize display genre — e.g. "hip-hop" → "Hip-Hop", "r&b" → "R&B" */
function displayGenre(slug: string): string {
  // Special case common genre abbreviations
  const special: Record<string, string> = {
    'r&b': 'R&B',
    'r-n-b': 'R&B',
    'rnb': 'R&B',
    'edm': 'EDM',
    'uk-garage': 'UK Garage',
    'k-pop': 'K-Pop',
    'drum-and-bass': 'Drum & Bass',
    'd-n-b': 'Drum & Bass',
    'dnb': 'Drum & Bass',
  };
  const lower = slug.toLowerCase();
  if (special[lower]) return special[lower];
  return formatGenre(slug);
}

// ── Data ─────────────────────────────────────────────────────────────────────

async function getCampaignsByGenre(genreSlug: string) {
  const genre = decodeURIComponent(genreSlug);

  const campaigns = await sql.raw(
    `SELECT c.*,
      COALESCE(c.title, c.track_title) as title,
      COALESCE(v.approved_submissions, '0') as approved_submissions,
      COALESCE(v.pending_submissions, '0') as pending_submissions,
      COALESCE(v.total_verified_views, '0') as total_verified_views,
      COALESCE(da.artist_name, u.display_name) as artist_name,
      c.artist_id,
      u.is_creator as artist_is_creator,
      u.profile_image_url as artist_avatar
    FROM campaigns c
    LEFT JOIN campaign_stats v ON v.id = c.id
    LEFT JOIN users u ON u.id = c.artist_id
    LEFT JOIN campaign_claims cc ON cc.campaign_id = c.id
    LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
    WHERE c.status IN ('active', 'draft')
      AND (da.genre ILIKE '%' || $1 || '%')
    ORDER BY c.created_at DESC
    LIMIT 20`,
    [genre]
  );

  return campaigns;
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const genreDisplay = displayGenre(params.slug);
  const title = `${genreDisplay} Music Promotion | Earn as Creator — Selah.fm`;
  const description = `Discover ${genreDisplay.toLowerCase()} music promotion campaigns. Submit your video and earn per verified view on TikTok, Instagram Reels, and YouTube Shorts. Join free.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://selah.fm/genre/${params.slug}`,
      type: 'website',
      images: [{ url: 'https://selah.fm/images/og-image.jpg', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://selah.fm/images/og-image.jpg'],
    },
    alternates: { canonical: `https://selah.fm/genre/${params.slug}` },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GenrePage({ params }: Props) {
  const campaigns = await getCampaignsByGenre(params.slug);
  const genreDisplay = displayGenre(params.slug);

  if (!campaigns || campaigns.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40">
            <li><Link href="/" className="hover:text-muted-foreground transition-colors">Selah.fm</Link></li>
            <li className="text-muted-foreground/20">/</li>
            <li><Link href="/browse" className="hover:text-muted-foreground transition-colors">Browse</Link></li>
            <li className="text-muted-foreground/20">/</li>
            <li className="text-muted-foreground/60">{genreDisplay}</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
            {genreDisplay} Tracks
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Discover {genreDisplay.toLowerCase()} tracks from independent artists. 
            Submit your short-form video on TikTok, Instagram Reels, or YouTube Shorts 
            and earn per verified view. {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} available.
          </p>
        </div>

        {/* Track grid — same design as browse */}
        <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {campaigns.map((c: any) => {
            const cpm = (c.cpm_rate_cents || 0) / 100;
            const budget = (c.total_budget_cents || 0) / 100;
            const remaining = (c.budget_remaining_cents || 0) / 100;
            const pct = budget > 0 ? ((budget - remaining) / budget) * 100 : 0;

            return (
              <Link
                key={c.id}
                href={`/c/${c.slug || c.id}`}
                className="h-full flex flex-col rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden
                  transition-all duration-200 hover:border-[#4338CA]/15 hover:bg-white/[0.04]"
              >
                {/* Cover image */}
                <CampaignCover src={c.cover_art_url} title={c.track_title} className="h-40 shrink-0" />

                {/* Card body */}
                <div className="flex-1 flex flex-col justify-between p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {c.artist_name && (c.artist_is_creator && c.artist_id ? (
                        <Link
                          href={`/creators/${c.artist_id}`}
                          className="text-[11px] text-muted-foreground hover:text-primary transition-colors line-clamp-1 mb-0.5 block"
                        >
                          {c.artist_name}
                        </Link>
                      ) : (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mb-0.5">{c.artist_name}</p>
                      ))}
                      <h3
                        className="text-sm leading-snug line-clamp-2 font-semibold min-h-[2.5rem]"
                        style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}
                      >
                        {c.track_title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                      {(c.platforms || []).map((p: string) => (
                        <PlatformBadge key={p} platform={p} />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <BudgetRing pct={pct} />
                      <div className="text-[10px] text-muted-foreground leading-tight">
                        <span className="font-semibold text-foreground/70">
                          ${(budget - remaining).toFixed(0)}
                        </span>
                        {budget > 0 && <span> of ${budget.toFixed(0)}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#22C55E] font-semibold">
                      ${(cpm * 1000).toFixed(0)}/1M views
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
