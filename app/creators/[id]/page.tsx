import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import sql from '@/lib/db';
import CreatorAvatar from '@/components/CreatorAvatar';
import Header from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TikTok, Instagram, YouTube, Facebook } from '@/components/SocialIcons';
import { DollarSign, FileText, CircleCheck, Music4, ExternalLink, Camera } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

// ── Data fetching ──────────────────────────────────────────────────────────

async function getCreator(id: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) return null;

  const rows = await sql`
    SELECT id, display_name, bio, genres, preferred_cpm_cents,
           tiktok_handle, instagram_handle, youtube_handle, facebook_handle,
           profile_image_url, is_creator
    FROM users
    WHERE id = ${id}::uuid AND is_creator = true
  `;
  return rows[0] || null;
}

async function getSubmissions(creatorId: string) {
  const rows = await sql`
    SELECT s.id, s.campaign_id, s.content_url, s.platform,
           s.review_status, s.views_verified, s.payout_amount_cents,
           s.payout_status, s.submitted_at,
           c.track_title, c.cover_art_url
    FROM submissions s
    JOIN campaigns c ON c.id = s.campaign_id
    WHERE s.creator_id = ${creatorId}::uuid
    ORDER BY s.submitted_at DESC
  `;
  return rows;
}

// ── SEO Metadata ───────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const creator = await getCreator(params.id);
  if (!creator) {
    return {
      title: 'Creator not found — Selah.fm',
      robots: { index: false, follow: true },
    };
  }

  const displayName = creator.display_name || 'Creator';
  const title = `${displayName} — Creator on Selah.fm`;
  const desc = creator.bio
    ? `${displayName} is a content creator on Selah.fm. ${creator.bio.slice(0, 120)}`
    : `${displayName} is a content creator on Selah.fm. See their portfolio, earnings, and social handles.`;

  return {
    title,
    description: desc.slice(0, 160),
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description: desc.slice(0, 160),
      type: 'profile',
      images: creator.profile_image_url ? [{ url: creator.profile_image_url }] : [],
      siteName: 'Selah.fm',
    },
    twitter: {
      card: 'summary',
      title,
      description: desc.slice(0, 160),
    },
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function platformUrl(platform: string, handle: string): string {
  const clean = handle.replace(/^@/, '');
  switch (platform) {
    case 'tiktok': return `https://tiktok.com/@${clean}`;
    case 'instagram': return `https://instagram.com/${clean}`;
    case 'youtube': return `https://youtube.com/@${clean}`;
    case 'facebook': return `https://facebook.com/${clean}`;
    default: return '#';
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Approved</Badge>;
    case 'rejected':
      return <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">Rejected</Badge>;
    case 'pending':
    default:
      return <Badge className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20">Pending</Badge>;
  }
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function CreatorProfilePage({ params }: Props) {
  const creator = await getCreator(params.id);
  if (!creator) notFound();

  const submissions = await getSubmissions(creator.id);

  // Compute stats
  const totalSubmissions = submissions.length;
  const approvedCount = submissions.filter((s: any) => s.review_status === 'approved').length;
  const totalEarningsCents = submissions
    .filter((s: any) => s.payout_status === 'paid' || s.payout_status === 'processing')
    .reduce((sum: number, s: any) => sum + (s.payout_amount_cents || 0), 0);
  const totalEarnings = totalEarningsCents / 100;

  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23';

  // Platform handles to display
  const handles: { platform: string; handle: string; icon: React.ReactNode; color: string }[] = [];
  if (creator.tiktok_handle) handles.push({ platform: 'tiktok', handle: creator.tiktok_handle, icon: <TikTok size={16} />, color: '#ff0050' });
  if (creator.instagram_handle) handles.push({ platform: 'instagram', handle: creator.instagram_handle, icon: <Instagram size={16} />, color: '#E1306C' });
  if (creator.youtube_handle) handles.push({ platform: 'youtube', handle: creator.youtube_handle, icon: <YouTube size={16} />, color: '#FF0000' });
  if (creator.facebook_handle) handles.push({ platform: 'facebook', handle: creator.facebook_handle, icon: <Facebook size={16} />, color: '#1877F2' });

  return (
    <div className="min-h-screen pb-20" style={{ background: bg }}>
      <Header />

      <main className="page-container max-w-2xl">
        {/* ── Profile header ── */}
        <div className="mb-8">
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
            {/* Banner gradient */}
            <div className="h-32 bg-gradient-to-r from-primary/25 via-primary/8 to-transparent" />

            <div className="p-6 -mt-14 relative">
              {/* Avatar */}
              <div className="mb-4">
                <CreatorAvatar
                  src={creator.profile_image_url}
                  name={creator.display_name || 'Creator'}
                  size="xl"
                />
              </div>

              {/* Name + handles */}
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}
                >
                  {creator.display_name || 'Creator'}
                </h1>
                <div className="flex items-center gap-1.5">
                  {handles.map((h) => (
                    <a
                      key={h.platform}
                      href={platformUrl(h.platform, h.handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ backgroundColor: `${h.color}15`, color: h.color }}
                      title={`${h.platform}: ${h.handle}`}
                    >
                      {h.icon}
                    </a>
                  ))}
                </div>
              </div>

              {/* Handle badges */}
              {handles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {handles.map((h) => (
                    <a
                      key={h.platform}
                      href={platformUrl(h.platform, h.handle)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border transition-colors hover:opacity-80"
                      style={{ borderColor: `${h.color}30`, color: h.color, backgroundColor: `${h.color}08` }}
                    >
                      {h.icon}
                      <span>{h.handle.startsWith('@') ? h.handle : `@${h.handle}`}</span>
                      <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              )}

              {/* Bio */}
              {creator.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {creator.bio}
                </p>
              )}

              {/* Genres */}
              {creator.genres && (
                <div className="flex gap-1 flex-wrap mt-3">
                  {creator.genres.split(',').map((g: string) => (
                    <Badge key={g.trim()} variant="secondary" className="text-[10px]">
                      {g.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats cards ── */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            {
              icon: <DollarSign size={18} strokeWidth={1.5} />,
              value: `$${totalEarnings.toFixed(0)}`,
              label: 'Total earned',
            },
            {
              icon: <FileText size={18} strokeWidth={1.5} />,
              value: String(totalSubmissions),
              label: 'Submissions',
            },
            {
              icon: <CircleCheck size={18} strokeWidth={1.5} />,
              value: String(approvedCount),
              label: 'Approved',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-4 text-center"
            >
              <div className="mx-auto mb-2 text-primary/50">{stat.icon}</div>
              <div
                className="text-xl font-bold text-primary"
                style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── CPM card ── */}
        {creator.preferred_cpm_cents ? (
          <div className="mb-8">
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold mb-1">CPM Rate</h3>
                <div className="text-[10px] text-muted-foreground">Earn per 1M verified views</div>
              </div>
              <div
                className="text-2xl font-bold text-[#22C55E]"
                style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}
              >
                ${((creator.preferred_cpm_cents / 100) * 1000).toFixed(0)}
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Submissions grid ── */}
        <div className="mb-8">
          <h2
            className="text-lg font-bold mb-4"
            style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}
          >
            Portfolio
          </h2>

          {submissions.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-10 text-center">
              <Camera size={40} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/20" />
              <h3 className="font-semibold mb-1">No submissions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This creator hasn&apos;t submitted any videos yet.
              </p>
              <Link href="/browse">
                <Button size="sm" variant="outline" className="text-xs rounded-xl">
                  Browse campaigns
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {submissions.map((sub: any) => {
                const amount = (sub.payout_amount_cents || 0) / 100;
                const views = sub.views_verified || 0;

                return (
                  <div
                    key={sub.id}
                    className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden flex items-stretch"
                  >
                    {/* Cover art thumbnail */}
                    <div className="w-20 h-20 shrink-0 bg-white/[0.03] flex items-center justify-center overflow-hidden">
                      {sub.cover_art_url ? (
                        <img
                          src={sub.cover_art_url}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Music4 size={20} className="text-white/10" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/c/${sub.campaign_id}`}
                            className="text-sm font-semibold truncate hover:text-primary transition-colors"
                          >
                            {sub.track_title || 'Untitled'}
                          </Link>
                          {statusBadge(sub.review_status)}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span className="capitalize">{sub.platform}</span>
                          <span>·</span>
                          <span>{formatViews(views)} views</span>
                          {amount > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-[#22C55E] font-semibold">
                                ${amount.toFixed(2)} earned
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Link to campaign */}
                    <Link
                      href={`/c/${sub.campaign_id}`}
                      className="shrink-0 w-12 flex items-center justify-center text-muted-foreground/30 hover:text-primary transition-colors"
                    >
                      <ExternalLink size={16} />
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Browse CTA ── */}
        <div className="mb-6">
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-primary/10 p-6 text-center space-y-3">
            <Music4 size={28} strokeWidth={1} className="mx-auto text-primary/40" />
            <div>
              <h3 className="font-semibold">Want creators like this for your music?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Create a campaign and hire creators to promote your tracks.
              </p>
            </div>
            <Link href="/dashboard">
              <Button size="sm" className="text-xs rounded-xl">
                Start a campaign
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
