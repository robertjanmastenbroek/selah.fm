import type { Metadata } from 'next';
import sql from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props { params: { code: string } }

async function getClaimData(code: string) {
  const [claim] = await sql`
    SELECT cc.*, c.title, c.track_title, c.slug, c.cpm_rate_cents, c.cover_art_url,
           da.artist_name, da.id as da_id,
           ap.slug as artist_slug
    FROM campaign_claims cc
    JOIN campaigns c ON c.id = cc.campaign_id
    LEFT JOIN discovered_artists da ON da.id = cc.discovered_artist_id
    LEFT JOIN artist_profiles ap ON ap.artist_id = da.id
    WHERE cc.claim_code = ${code}
  `;
  if (!claim) return null;

  // Social proof: count submissions and donations
  const [subs] = await sql`SELECT COUNT(*)::int FROM submissions WHERE campaign_id = ${claim.campaign_id}`;
  const [dons] = await sql`SELECT COUNT(*)::int, COALESCE(SUM(amount_cents), 0)::int as total FROM campaign_donations WHERE campaign_id = ${claim.campaign_id}`;

  return { ...claim, submissionCount: subs.count, donationCount: dons.count, donationTotal: (dons.total / 100).toFixed(0) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getClaimData(params.code);
  return {
    title: data ? `Claim "${data.track_title}" — Selah.fm` : 'Claim Campaign — Selah.fm',
    robots: { index: false },
  };
}

export default async function ClaimPage({ params }: Props) {
  const data = await getClaimData(params.code);
  if (!data) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Campaign not found.</div>;

  const cpm = (data.cpm_rate_cents / 100).toFixed(2);
  const hasActivity = data.submissionCount > 0 || data.donationCount > 0;

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23' }}>
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-2">{data.track_title}</h1>
        <p className="text-muted-foreground mb-8">by {data.artist_name}</p>

        {/* Social Proof */}
        {hasActivity && (
          <div className="inline-flex items-center gap-4 mb-12 px-6 py-3 rounded-2xl bg-[#22C55E]/5 border border-[#22C55E]/10">
            {data.submissionCount > 0 && <span className="text-sm">{data.submissionCount} {data.submissionCount === 1 ? 'creator has' : 'creators have'} submitted videos</span>}
            {data.submissionCount > 0 && data.donationCount > 0 && <span className="text-muted-foreground">·</span>}
            {data.donationCount > 0 && <span className="text-sm">{data.donationCount} {data.donationCount === 1 ? 'person has' : 'people have'} donated ${data.donationTotal}</span>}
          </div>
        )}

        {/* What this is */}
        <div className="space-y-6 text-left bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-bold">A page was built for your music</h2>
          <p className="text-muted-foreground">
            Someone discovered your track and created this campaign page on Selah.fm. Creators make TikToks and Reels with your song — you only pay for verified views (${cpm} per 1,000 views).
          </p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl bg-white/[0.02]">
              <div className="text-lg font-bold">${cpm}</div>
              <div className="text-[10px] text-muted-foreground">per 1K views</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02]">
              <div className="text-lg font-bold">$0</div>
              <div className="text-[10px] text-muted-foreground">upfront cost</div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02]">
              <div className="text-lg font-bold">You</div>
              <div className="text-[10px] text-muted-foreground">approve & pay</div>
            </div>
          </div>
        </div>

        {/* Artist profile link */}
        {data.artist_slug && (
          <div className="mb-6">
            <a href={`/artist/${data.artist_slug}`}
              className="inline-flex items-center gap-2 text-sm text-primary/80 hover:text-primary transition-colors">
              View your full artist profile →
            </a>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Your artist page is already live with all your tracks. Claim it to manage CPM rates, approve videos, and withdraw donations.
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3">
          <a href={`/artist/${data.artist_slug}`} className="block w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity">
            View your artist profile →
          </a>
          <a href={`/c/${data.slug}`} className="block w-full py-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm hover:bg-white/[0.08] transition-colors">
            View this campaign page
          </a>
          <a href="/login" className="block w-full py-4 rounded-xl bg-white/[0.06] border border-white/[0.06] text-sm hover:bg-white/[0.08] transition-colors">
            Create account to claim & manage
          </a>
        </div>

        {/* Embed widget */}
        {data.artist_slug && (
          <div className="mt-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 text-left">
            <h3 className="text-sm font-semibold mb-2">📎 Embed on your site</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Add this widget to your website or Linktree so fans can find and support you on Selah.fm.
            </p>
            <pre className="text-[10px] font-mono bg-black/30 rounded-xl p-4 overflow-x-auto text-muted-foreground/80 leading-relaxed select-all">
{`<iframe 
  src="https://selah.fm/artist/${data.artist_slug}/embed" 
  width="300" 
  height="400" 
  style="border:none;border-radius:12px;max-width:100%"
  title="Fund ${data.artist_name} on Selah.fm">
</iframe>`}
            </pre>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-6">
          No commitment. The page stays live whether you claim it or not. You only pay when you approve videos.
        </p>
      </main>
    </div>
  );
}
