import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import ClaimButton from './ClaimButton';

export const dynamic = 'force-dynamic';

interface Props {
  params: { code: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export const metadata: Metadata = {
  title: 'Claim Your Campaign — Selah.fm',
  description: 'Someone created a promotion campaign for your music. Claim it now.',
};

export default async function ClaimPage({ params }: Props) {
  const code = params.code;

  let claim: any = null;
  try {
    const result = await sql`
      SELECT cc.*, c.slug, c.title, c.track_title, c.cover_art_url, c.status as campaign_status,
             c.is_unclaimed, da.artist_name, da.spotify_id, da.latest_track_name,
             da.followers, da.genres
      FROM campaign_claims cc
      JOIN campaigns c ON c.id = cc.campaign_id
      LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
      WHERE cc.claim_code = ${code}
    `;
    claim = result[0] || null;
  } catch {}

  if (!claim) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.15) 0%, #0A0A0A 60%), #0A0A0A' }}>
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="text-5xl">🔗</div>
          <h1 className="text-2xl font-bold">Invalid claim link</h1>
          <p className="text-muted-foreground">
            This claim code doesn't exist or has already been used.
          </p>
          <a href="/" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold">
            Go to Selah.fm
          </a>
        </div>
      </div>
    );
  }

  if (claim.claimed_at) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.15) 0%, #0A0A0A 60%), #0A0A0A' }}>
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold">Already claimed</h1>
          <p className="text-muted-foreground">
            This campaign has already been claimed by the artist.
          </p>
          <a href={`/c/${claim.slug}`} className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold">
            View campaign
          </a>
        </div>
      </div>
    );
  }

  const coverArt = claim.cover_art_url?.startsWith('/')
    ? `https://selah.fm${claim.cover_art_url}`
    : claim.cover_art_url || 'https://selah.fm/images/og-image.jpg';

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.15) 0%, #0A0A0A 60%), #0A0A0A' }}>
      <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        
        {/* Gift unwrapping feel */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎁</div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            A campaign was created for {claim.artist_name || 'you'}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Someone who loves your music set up a promotion campaign so creators on TikTok and Reels can feature your track.
          </p>
        </div>

        {/* Campaign preview card */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden mb-8">
          <div className="aspect-video bg-white/[0.02] flex items-center justify-center overflow-hidden">
            <img
              src={coverArt}
              alt={claim.title || claim.track_title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 space-y-3">
            <div>
              <h2 className="text-xl font-bold">{claim.title || `${claim.artist_name} — ${claim.latest_track_name || claim.track_title}`}</h2>
              {claim.latest_track_name && <p className="text-sm text-muted-foreground mt-1">🎵 {claim.latest_track_name}</p>}
            </div>

            {/* Stats if available */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06]">
              {claim.followers > 0 && (
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <div className="text-lg font-bold">{claim.followers?.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">Spotify followers</div>
                </div>
              )}
              {claim.genres?.length > 0 && (
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <div className="text-lg font-bold">{claim.genres.length}</div>
                  <div className="text-[10px] text-muted-foreground">Genres</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 mb-8 space-y-3">
          <h3 className="font-semibold">How it works</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>📱 Creators on TikTok, Reels, and Shorts make videos featuring your track</p>
            <p>✅ You review and approve submissions that match your style</p>
            <p>💰 You only pay per verified view — no upfront cost</p>
            <p>👥 Friends and family can chip in to fund the campaign</p>
          </div>
        </div>

        {/* Claim button */}
        <ClaimButton
          claimCode={code}
          artistName={claim.artist_name || 'the artist'}
          campaignSlug={claim.slug}
        />

        {/* Report link */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Not {claim.artist_name || 'the artist'}?{' '}
            <a href={`mailto:support@selah.fm?subject=Claim%20dispute%20-%20${code}`} className="hover:text-foreground underline">
              Let us know
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
