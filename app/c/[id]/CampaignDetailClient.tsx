'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import CampaignCover from '@/components/CampaignCover';
import LiveTicker from '@/components/LiveTicker';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SubmissionsFeed from '@/components/SubmissionsFeed';
import EarnModal from '@/components/EarnModal';
import MediaCarousel from '@/components/MediaCarousel';
import { Heart, X, Link2, Play, Camera, Copy, Check, Music2, BarChart3, Gift, ChevronRight, Sparkles, Share2 } from 'lucide-react';

// ── Circle Progress ───────────────────────────────────────────────
function lerpColor(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
function pctColor(pct: number) {
  const t = Math.min(pct, 100) / 100;
  return `rgb(${lerpColor(0x43, 0x22, t)},${lerpColor(0x38, 0xC5, t)},${lerpColor(0xCA, 0x5E, t)})`;
}
function CircleProgress({ pct, size = 72 }: { pct: number; size?: number }) {
  const stroke = 7, radius = (size - stroke) / 2, circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={pctColor(pct)} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold font-display">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Share Modal ───────────────────────────────────────────────────
function ShareModal({ open, onClose, url, title, artistName, cpmDollars, trackTitle }: {
  open: boolean; onClose: () => void; url: string; title: string;
  artistName?: string; cpmDollars?: number; trackTitle?: string;
}) {
  const encodedUrl = encodeURIComponent(url);
  const artistLine = artistName ? `${artistName} — ` : '';
  const shareTitle = `${artistLine}"${trackTitle || title}" on Selah.fm`;
  const shareBody = cpmDollars
    ? `Join to earn $${(cpmDollars * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} per 1M verified views. Selah.fm — music meets creators.`
    : 'Join a campaign, create content, and earn per verified view on Selah.fm';
  const fullShareText = `${shareTitle}\n\n${shareBody}\n\n${url}`;
  const encodedShare = encodeURIComponent(fullShareText);

  const options = [
    { name: 'Copy Link', action: async () => { try { await navigator.clipboard.writeText(url); } catch {} }, color: '#6366F1', bg: 'bg-indigo-500/10', icon: <Copy size={20} /> },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareTitle}\n\n${url}`)}`, color: '#fff', bg: 'bg-white/10',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodedShare}`, color: '#25D366', bg: 'bg-green-500/10',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg> },
    { name: 'Telegram', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareTitle)}`, color: '#0088cc', bg: 'bg-blue-500/10',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="relative z-10 w-full sm:max-w-md max-h-[85vh] sm:rounded-3xl rounded-t-3xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg font-display">Share</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"><X size={20} className="text-muted-foreground" /></button>
              </div>
              <p className="text-sm text-muted-foreground/60 truncate">{fullShareText}</p>
              <div className="grid grid-cols-4 gap-3">
                {options.map(opt => {
                  const isAction = !!opt.action;
                  const Comp: any = isAction ? 'button' : 'a';
                  return (
                    <Comp key={opt.name} href={isAction ? undefined : opt.href} target={isAction ? undefined : '_blank'}
                      rel={isAction ? undefined : 'noopener noreferrer'}
                      onClick={isAction ? (e: any) => { e.preventDefault(); opt.action!(); } : undefined}
                      className="flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-white/[0.04] transition-colors active:scale-[0.95]">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${opt.bg}`} style={{ color: opt.color }}>{opt.icon}</div>
                      <span className="text-[10px] text-muted-foreground">{opt.name}</span>
                    </Comp>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Tab Section ───────────────────────────────────────────────────
function CampaignTabs({ campaign, listenLinks, count }: { campaign: any; listenLinks: { platform: string; url: string; icon: string }[]; count: number }) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['About', 'Requirements', 'Submissions'];

  return (
    <div className="w-full">
      <div className="flex border-b border-white/[0.06]">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === i ? 'text-white' : 'text-muted-foreground hover:text-white/70'
            }`}>
            {tab}
            {activeTab === i && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {activeTab === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {campaign.description || 'No description provided.'}
            </p>
            {listenLinks.length > 0 && (
              <div className="pt-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-2">Listen on</p>
                <div className="flex flex-wrap gap-1.5">
                  {listenLinks.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] 
                               text-[11px] text-muted-foreground hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12] 
                               transition-all active:scale-[0.96]">
                      <span className="text-xs">{link.icon}</span>
                      {link.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {campaign.platforms_needed?.length > 0 && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-2">Platforms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(campaign.platforms_needed || []).map((p: string) => (
                      <span key={p} className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[11px] text-white/80">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {campaign.genre && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-2">Genre</p>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[11px] text-white/80">{campaign.genre}</span>
                </div>
              )}
            </div>
            {campaign.requirements && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-2">Creative Requirements</p>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{campaign.requirements}</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 2 && (
          <SubmissionsFeed campaignId={campaign.id} count={count} />
        )}
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────
function CampaignSkeleton() {
  return (
    <div className="min-h-screen bg-deep-navy">
      <Header />
      <div className="md:flex md:flex-row md:min-h-[65vh]">
        <div className="md:w-[60%]">
          <Skeleton className="w-full h-[50vh] md:h-full rounded-none bg-white/[0.03]" />
        </div>
        <div className="md:w-[40%] px-5 py-8 space-y-5">
          <Skeleton className="h-20 w-20 rounded-full bg-white/[0.03]" />
          <Skeleton className="h-8 w-3/4 bg-white/[0.03]" />
          <Skeleton className="h-6 w-1/2 bg-white/[0.03]" />
          <Skeleton className="h-14 w-full rounded-xl bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
interface ListenLink { platform: string; url: string; icon: string; }

export default function CampaignDetailClient({ id, initialCampaign, listenLinks = [], artistSlug = null }: { id: string; initialCampaign: any; listenLinks?: ListenLink[]; artistSlug?: string | null }) {
  const [campaign, setCampaign] = useState<any>(initialCampaign);
  const [loading, setLoading] = useState(!initialCampaign);
  const { addToast } = useToast();
  const router = useRouter();

  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroBottom, setHeroBottom] = useState(0);

  const [shareOpen, setShareOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    if (!initialCampaign) {
      fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => {
        if (d.error) setCampaign(null); else setCampaign(d); setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => { if (!d.error) setCampaign(d); }).catch(() => {});
    }
  }, [id, initialCampaign]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const calc = () => { if (heroRef.current) setHeroBottom(heroRef.current.offsetTop + heroRef.current.offsetHeight); };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [campaign, loading]);

  if (loading) return <CampaignSkeleton />;

  if (!campaign) return (
    <div className="min-h-screen bg-deep-navy">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold font-display mb-4">Campaign not found</h1>
        <Link href="/browse"><Button>Browse campaigns</Button></Link>
      </main>
    </div>
  );

  const budget = (campaign.total_budget_cents || 0) / 100;
  const remaining = (campaign.budget_remaining_cents || 0) / 100;
  const spent = budget - remaining;
  const cpm = (campaign.cpm_rate_cents || 0) / 100;
  const progress = budget > 0 ? (spent / budget) * 100 : 0;
  const donations = campaign.donations || { totalCents: 0, count: 0, supporters: [] };
  const views = parseInt(campaign.total_verified_views || '0');
  const submissions = parseInt(campaign.approved_submissions || '0');
  const totalRaised = (donations.totalCents || 0) / 100;
  const artistName = campaign.artist_name || 'Artist';
  const displayTitle = campaign.title || campaign.track_title;
  const trackTitle = campaign.track_title || '';

  const isUnclaimed = campaign.is_unclaimed && !campaign.claimed_by_user_id;
  const claimCode = campaign.claim_code;

  // Whether hero has scrolled past viewport for sticky bar
  const stickyBarVisible = true;

  return (
    <div className="min-h-screen bg-deep-navy">
      <Header />

      {/* ════════════════════════════════════════════════ */}
      {/* HERO — Two-column: cover art left | stats + CTA right */}
      {/* ════════════════════════════════════════════════ */}
      <div ref={heroRef}>
        <div className="md:flex md:flex-row md:min-h-[65vh]">

          {/* ── LEFT COLUMN: Cover Art ── */}
          <div className="relative md:w-[60%] overflow-hidden">
            <div className="relative w-full h-[50vh] md:h-full">
              {campaign.cover_art_url ? (
                <img src={campaign.cover_art_url} alt={`Cover art for ${trackTitle}`}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-green-500/10">
                  <Music2 size={64} className="text-white/10" />
                </div>
              )}
              <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(67,56,202,0.15)] pointer-events-none" />

              {/* Artist badge */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {isUnclaimed && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 backdrop-blur-sm border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Unclaimed
                  </span>
                )}
                <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-[10px] font-bold text-white border border-white/15 overflow-hidden">
                  {campaign.artist_avatar
                    ? <img src={campaign.artist_avatar} alt="" className="w-full h-full object-cover" />
                    : artistName[0]?.toUpperCase()}
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-md">{artistName}</span>
              </div>

              {/* Title overlay */}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-lg font-display">
                  {trackTitle || displayTitle}
                </h1>
                {displayTitle !== trackTitle && trackTitle && (
                  <p className="text-sm text-white/50 mt-1 max-w-md">{displayTitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Stats + Primary CTA ── */}
          <div className="md:w-[40%] px-5 py-6 md:py-8 md:flex md:flex-col md:justify-center md:border-l md:border-white/[0.06]">
            <div className="border-t border-white/06 mb-5 md:hidden" />

            {/* Progress ring + key stats */}
            <div className="flex items-center gap-4 mb-6">
              <CircleProgress pct={progress} size={72} />
              <div className="flex-1 min-w-0 space-y-1">
                <div>
                  <span className="text-lg font-bold">${spent.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">spent</span>
                  {budget > 0 && <span className="text-xs text-muted-foreground ml-1">of ${budget.toFixed(0)}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <LiveTicker campaignId={id} />
                  <span className="flex items-center gap-1 text-primary/60">📈 Live campaign</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{submissions} submissions</span>
                  <span>·</span>
                  <span>{views.toLocaleString()} views</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-emerald-400">✅ Verified views</span>
                </div>
              </div>
            </div>

            {/* ── Primary: Join campaign (creator CTA) ── */}
            <button onClick={() => {
              fetch('/api/analytics/event', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ event: 'campaign_join_click', path: window.location.pathname, metadata: { campaign_id: id } }) }).catch(()=>{});
              setJoinOpen(true);
            }}
              className="w-full py-4 text-base font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white
                active:scale-[0.98] transition-all hover:shadow-[0_0_24px_rgba(67,56,202,0.4)] shadow-lg shadow-indigo-500/20">
              Join campaign — earn ${(cpm * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/1M views
            </button>

            {/* ── Secondary: Support this campaign (fan CTA) ── */}
            <Link href={`/checkout?type=donation&campaignId=${id}`}
              className="mt-3 w-full py-3.5 text-sm font-semibold rounded-xl border border-white/[0.12] bg-white/[0.02] text-muted-foreground
                hover:text-white hover:bg-white/[0.05] hover:border-[#4338CA]/30 active:scale-[0.98] transition-all
                flex items-center justify-center gap-2">
              <Heart size={16} className="text-[#4338CA]/60" />
              Support this campaign
            </Link>

            {/* Secondary: Share (icon only, not competing) */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-[11px] text-muted-foreground/60">
                No upfront cost · Free to start · You earn 80% · Platform fee 20%
              </p>
              <button onClick={() => setShareOpen(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors">
                <Share2 size={14} /> Share
              </button>
            </div>

            {/* Unclaimed CTA */}
            {isUnclaimed && claimCode && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <Link href={`/claim/${claimCode}`}
                  className="block w-full py-3 rounded-xl text-center font-bold text-sm bg-amber-500 text-black hover:bg-amber-400 transition-all active:scale-[0.98]">
                  Claim this campaign
                </Link>
                <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                  {artistName} hasn&apos;t claimed this yet. Submissions still work.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════ */}
      {/* BELOW HERO — Tabbed content */}
      {/* ════════════════════════════════════════════════ */}
      <main className="max-w-5xl mx-auto px-4 pb-32 md:pb-20 pt-8">
        <CampaignTabs campaign={campaign} listenLinks={listenLinks} count={submissions} />
      </main>

      {/* ════════════════════════════════════════════════ */}
      {/* STICKY MOBILE BAR (always visible after scroll) */}
      {/* ════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 inset-x-0 z-layer-sticky-bar md:hidden bg-deep-navy/95 backdrop-blur-lg border-t border-white/[0.06] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-xs font-semibold truncate font-display">{displayTitle}</p>
                <p className="text-[10px] text-muted-foreground">${(cpm * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/1M views · {artistName}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/checkout?type=donation&campaignId=${id}`}
                  className="shrink-0 px-4 py-2.5 text-xs font-semibold rounded-xl border border-white/[0.12] bg-white/[0.02] text-muted-foreground
                    hover:text-white hover:bg-white/[0.05] hover:border-[#4338CA]/30 active:scale-[0.98] transition-all
                    flex items-center gap-1.5">
                  <Heart size={13} className="text-[#4338CA]/60" />
                  Support
                </Link>
                <button onClick={() => setJoinOpen(true)}
                  className="shrink-0 px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white
                    active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20">
                  Join
                </button>
              </div>
            </div>
          </div>

      {/* ═══ MODALS ═══ */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        title={displayTitle}
        artistName={artistName}
        cpmDollars={cpm}
        trackTitle={trackTitle} />

      <EarnModal
          open={joinOpen}
          campaignId={id}
          onClose={() => setJoinOpen(false)}
          trackTitle={trackTitle}
          cpmCents={campaign.cpm_rate_cents || 0}
        />
    </div>
  );
}
