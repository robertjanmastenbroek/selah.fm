'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
import { Heart, X, Link2, Play, Camera, Copy, Check, Music2, BarChart3, Gift, ChevronRight, Sparkles } from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────
const PRIMARY = '#4338CA';
const ACCENT_GREEN = '#22C55E';
const DEEP_NAVY = '#0F0F23';

// ── Circle Progress ───────────────────────────────────────────────
function lerpColor(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}
function pctColor(pct: number) {
  const t = Math.min(pct, 100) / 100;
  const r = lerpColor(0x43, 0x22, t);
  const g = lerpColor(0x38, 0xC5, t);
  const b = lerpColor(0xCA, 0x5E, t);
  return `rgb(${r},${g},${b})`;
}

function CircleProgress({ pct, size = 72 }: { pct: number; size?: number }) {
  const stroke = 7, radius = (size - stroke) / 2, circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  const color = pctColor(pct);
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Share Modal (unchanged — comprehensive) ──────────────────────
function ShareModal({ open, onClose, url, title, imageUrl, artistName, cpmDollars, trackTitle }: {
  open: boolean; onClose: () => void; url: string; title: string; imageUrl?: string;
  artistName?: string; cpmDollars?: number; trackTitle?: string;
}) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const artistLine = artistName ? `${artistName} — ` : '';
  const shareTitle = `${artistLine}"${trackTitle || title}" on Selah.fm`;
  const shareBody = cpmDollars
    ? `Join to earn $${(cpmDollars * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} per 1M verified views. Selah.fm — music meets creators.`
    : 'Join a campaign, create content, and earn per verified view on Selah.fm';
  const fullShareText = `${shareTitle}\n\n${shareBody}\n\n${url}`;
  const encodedShare = encodeURIComponent(fullShareText);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const options = [
    { name: 'Copy Link', action: copyLink, color: PRIMARY, bg: `bg-[${PRIMARY}]/10`, icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
    { name: 'Instagram', action: async () => {
      try { await navigator.share({ title: shareTitle, text: `${shareBody}\n\n${url}`, url }); } catch {
        await navigator.clipboard.writeText(fullShareText); window.open('instagram://story-camera', '_blank');
      }
    }, color: '#E1306C', bg: 'bg-[#E1306C]/10', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/></svg> },
    { name: 'TikTok', action: async () => {
      try { await navigator.share({ title: shareTitle, text: `${shareBody}\n\n${url}`, url }); } catch {
        await navigator.clipboard.writeText(fullShareText); window.open('https://www.tiktok.com/', '_blank');
      }
    }, color: '#ff0050', bg: 'bg-[#ff0050]/10', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg> },
    { name: 'WhatsApp', action: async () => { window.open(`https://wa.me/?text=${encodedShare}`, '_blank'); }, color: '#25D366', bg: 'bg-[#25D366]/10', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg> },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareTitle}\n\n${url}`)}`, color: '#fff', bg: 'bg-white/10', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
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
                <h3 className="font-semibold text-lg" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>Share</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"><X size={20} className="text-muted-foreground" /></button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {options.map(opt => {
                  const isAction = !!opt.action;
                  const Comp = isAction ? 'button' : 'a';
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

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
interface ListenLink { platform: string; url: string; icon: string; }

export default function CampaignDetailClient({ id, initialCampaign, listenLinks = [] }: { id: string; initialCampaign: any; listenLinks?: ListenLink[] }) {
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

  if (loading) return (
    <div className="min-h-screen" style={{ background: DEEP_NAVY }}>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-16">
        <Skeleton className="aspect-[4/3] rounded-2xl mb-4 bg-white/[0.03]" />
        <Skeleton className="h-8 w-1/2 bg-white/[0.03]" />
      </main>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen" style={{ background: DEEP_NAVY }}>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>Campaign not found</h1>
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
  const stickyBarVisible = scrollY > heroBottom - 80;

  return (
    <div className="min-h-screen" style={{ background: DEEP_NAVY }}>
      <Header />

      {/* ═══ HERO SECTION ═══ */}
      <div ref={heroRef}>
        <div className="md:flex md:flex-row md:min-h-[65vh]">
          {/* ── LEFT: Album cover ── */}
          <div className="relative md:w-[60%] overflow-hidden">
            <div className="relative w-full h-[50vh] md:h-full">
              {campaign.cover_art_url ? (
                <img
                  src={campaign.cover_art_url}
                  alt={`Cover art for ${trackTitle}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4338CA]/20 to-[#22C55E]/10">
                  <Music2 size={64} className="text-white/10" />
                </div>
              )}
              {/* Glow effect */}
              <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(67,56,202,0.15)] pointer-events-none" />

              {/* Top badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                {isUnclaimed && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 backdrop-blur-sm border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Unclaimed
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
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-lg"
                  style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
                  {displayTitle}
                </h1>
                {trackTitle && trackTitle !== displayTitle && (
                  <p className="text-sm text-white/70 mt-1">{trackTitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Stats + CTA ── */}
          <div className="md:w-[40%] px-5 py-6 md:py-8 md:flex md:flex-col md:justify-center md:border-l md:border-white/[0.06]">
            <div className="border-t border-white/06 mb-5 md:hidden" />

            {/* Progress ring + stats */}
            <div className="relative flex items-center gap-4 mb-5 pr-12">
              <CircleProgress pct={progress} size={72} />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <span className="text-lg font-bold">${spent.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">spent</span>
                  {budget > 0 && <span className="text-xs text-muted-foreground ml-1">of ${budget.toFixed(0)}</span>}
                </div>
                <LiveTicker campaignId={id} />
              </div>
              <button onClick={() => setShareOpen(true)}
                className="absolute top-0 right-0 flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.05] transition-colors active:scale-[0.95]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                <span className="text-[8px] font-medium text-muted-foreground">Share</span>
              </button>
            </div>

            {/* ── Listen on ── */}
            {listenLinks.length > 0 && (
              <div className="mb-4">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40 mb-2">Listen on</p>
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

            {/* CTA — single dominant creator action */}
            <button onClick={() => setJoinOpen(true)}
              className="w-full py-4 text-base font-bold rounded-xl bg-gradient-to-r from-[#4338CA] to-[#6366F1] text-white
                active:scale-[0.98] transition-all hover:shadow-[0_0_24px_rgba(67,56,202,0.4)]">
              Join campaign — earn ${(cpm * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/1M views
            </button>
            <Link href={`/checkout?type=donation&campaignId=${id}`}
              className="block text-center mt-2 text-[11px] text-muted-foreground hover:text-[#22C55E] transition-colors">
              Or donate to support this track
            </Link>

            {/* Unclaimed claim CTA */}
            {isUnclaimed && claimCode && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <Link href={`/claim/${claimCode}`}
                  className="block w-full py-3 rounded-xl text-center font-bold text-sm bg-amber-500 text-black hover:bg-amber-400 transition-all active:scale-[0.98]">
                  Claim this campaign
                </Link>
                <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                  {artistName} hasn&apos;t claimed this yet. Donations &amp; submissions still work.
                </p>
              </div>
            )}


          </div>
        </div>
      </div>

      {/* ═══ BELOW HERO ═══ */}
      <main className="pb-32 md:pb-20">
        <div className="px-4 space-y-8 pt-8">
          {/* ── Media carousel ── */}
          <MediaCarousel items={[]} />

          {/* ── Side-by-side: Support + Create ── */}
          <div className="grid md:grid-cols-2 gap-5">
            {/* SUPPORT card */}
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Link href={`/checkout?type=donation&campaignId=${id}`}
                className="block rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:border-[#22C55E]/20 hover:bg-white/[0.04] transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#22C55E]/10 flex items-center justify-center shrink-0 group-hover:bg-[#22C55E]/15 transition-colors">
                    <Heart size={22} className="text-[#22C55E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>Support this track</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">Chip in any amount to fund creator payouts. 100% goes to verified content.</p>
                    <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#22C55E] group-hover:gap-2 transition-all">
                      Donate <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* CREATE card */}
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <button onClick={() => setJoinOpen(true)}
                className="w-full text-left rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:border-[#4338CA]/20 hover:bg-white/[0.04] transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#4338CA]/10 flex items-center justify-center shrink-0 group-hover:bg-[#4338CA]/15 transition-colors">
                    <Camera size={22} className="text-[#4338CA]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>Create & earn</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">Make a TikTok, Reel, or Short with this track. Earn per 1,000 verified views.</p>
                    <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#4338CA] group-hover:gap-2 transition-all">
                      Join campaign <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </button>
            </motion.div>
          </div>

          {/* ── Google Drive assets (moved up — primary instruction) ── */}
          {campaign.content_assets_url && (
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <a href={campaign.content_assets_url} target="_blank" rel="noopener noreferrer"
                className="block rounded-2xl bg-[#4338CA]/[0.04] border border-[#4338CA]/15 p-5 hover:border-[#4338CA]/25 transition-all group active:scale-[0.99]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#4338CA]/10 flex items-center justify-center shrink-0 group-hover:bg-[#4338CA]/15 transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#4338CA]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-[#4338CA] group-hover:underline">📦 Download official audio & assets</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Master track (.wav + .mp3), cover art, reference videos — everything you need to create winning content.</p>
                    <span className="inline-flex items-center gap-1.5 text-sm text-[#4338CA] font-semibold mt-3 group-hover:gap-2 transition-all">Open Google Drive <ChevronRight size={14} /></span>
                  </div>
                </div>
              </a>
            </motion.div>
          )}

          {/* ── How to participate (with Essentials block) ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-6">
              <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
                <Camera size={15} className="text-[#4338CA]/60" />How to participate
              </h3>

              {/* Essentials — scannable key info */}
              <div className="rounded-xl bg-[#4338CA]/[0.03] border border-[#4338CA]/10 p-4 mb-5">
                <p className="text-[10px] font-semibold text-[#4338CA]/60 uppercase tracking-wider mb-3">⚡ Essentials</p>
                <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
                  {[
                    `Earn $${(cpm * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} per 1M verified views`,
                    'Use the official audio — no screen recordings',
                    'Vertical 9:16 video, 15–60 seconds',
                    'Public account (private videos cannot be verified)',
                    campaign.recommended_hashtags ? `Required hashtags: ${campaign.recommended_hashtags}` : null,
                    campaign.min_video_length_seconds ? `Minimum length: ${campaign.min_video_length_seconds}s` : null,
                  ].filter(Boolean).map((item, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-[#22C55E]/60 mt-0.5 shrink-0">✓</span>
                      <span className="text-muted-foreground leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Three steps */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { step: '1', title: campaign.content_assets_url ? 'Download the audio' : 'Find the audio', desc: campaign.content_assets_url ? `Get the master track from the Google Drive above (you can also search "${trackTitle}" on TikTok, IG, or YouTube).` : `Search "${trackTitle}" on TikTok, Instagram, or YouTube. Use the official audio.` },
                  { step: '2', title: 'Create your video', desc: 'Record a video using the official audio. Dance, react, duet — be creative. Make it public so views count.' },
                  { step: '3', title: 'Submit & earn', desc: `Post publicly, paste the link here. Earn the full $${(cpm * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} per 1M verified views — nothing deducted.` },
                ].map(s => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#4338CA]/10 flex items-center justify-center text-[11px] font-bold text-[#4338CA] shrink-0">{s.step}</div>
                    <div>
                      <p className="text-xs font-semibold mb-0.5">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Requirements (collapsible) ── */}
          {campaign.requirements && (
            <RequirementsBlock requirements={campaign.requirements} />
          )}

          {/* ── Donations (below creator flow — secondary) ── */}
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl bg-white/[0.01] border border-white/[0.03] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1">
                  <Heart size={11} className="text-muted-foreground/30" />Support
                </h3>
                <span className="text-sm font-bold text-muted-foreground">${totalRaised.toFixed(0)} donated</span>
              </div>
              {donations.supporters.length > 0 ? (
                <div className="space-y-1">{donations.supporters.slice(0, 5).map((s: any, i: number) => (
                  <div key={i} className="flex items-center gap-2.5 py-1.5 px-1 text-[11px]">
                    <div className="w-6 h-6 rounded-md bg-[#4338CA]/5 flex items-center justify-center text-[9px] font-bold text-[#4338CA]/50 shrink-0">{(s.donor_name || 'A')[0].toUpperCase()}</div>
                    <span className="flex-1 text-muted-foreground/40 truncate">{s.donor_name || 'Anonymous'}</span>
                    <span className="font-semibold text-muted-foreground/50 shrink-0">${(s.amount_cents / 100).toFixed(0)}</span>
                  </div>
                ))}</div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-[11px] text-muted-foreground/30">No donations yet</p>
                  <Link href={`/checkout?type=donation&campaignId=${id}`} className="mt-1.5 inline-block text-[10px] text-[#22C55E]/40 hover:text-[#22C55E]/60 transition-colors">
                    Be the first to support
                  </Link>
                </div>
              )}
              <p className="text-[9px] text-muted-foreground/20 text-center mt-3">100% goes to verified content payouts</p>
            </div>
          </motion.div>

          {/* ── Claim CTA (mobile) ── */}
          {isUnclaimed && claimCode && (
            <div className="md:hidden">
              <Link href={`/claim/${claimCode}`} className="block w-full py-4 rounded-xl text-center font-bold text-base bg-amber-500 text-black hover:bg-amber-400 transition-all active:scale-[0.98]">
                Claim this campaign
              </Link>
            </div>
          )}

          {/* ── More campaigns ── */}
          <section>
            <h3 className="font-bold text-sm mb-4" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>More campaigns</h3>
            <MoreCampaigns currentId={id} />
          </section>
        </div>
      </main>

      {/* ═══ STICKY BAR ═══ */}
      <AnimatePresence>
        {stickyBarVisible && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F0F23]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3">
            <div className="space-y-3">
              <div className="relative flex items-center gap-3 pr-12">
                <CircleProgress pct={progress} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs"><span className="font-bold text-sm">${spent.toFixed(0)}</span><span className="text-muted-foreground ml-1">of ${budget.toFixed(0)}</span></div>
                  <div className="mt-0.5"><LiveTicker campaignId={id} /></div>
                </div>
                <button onClick={() => setShareOpen(true)} className="absolute top-0 right-0 flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors active:scale-[0.95]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                  <span className="text-[8px] font-medium text-muted-foreground">Share</span>
                </button>
              </div>
              <button onClick={() => setJoinOpen(true)} className="w-full py-3.5 text-sm font-bold rounded-xl bg-gradient-to-r from-[#4338CA] to-[#6366F1] text-white active:scale-[0.97]">
                Join campaign — earn ${(cpm * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/1M views
              </button>
              {isUnclaimed && claimCode && (
                <Link href={`/claim/${claimCode}`} className="block w-full py-3 rounded-xl text-center font-bold text-sm bg-amber-500 text-black hover:bg-amber-400 transition-all active:scale-[0.98]">
                  Claim this campaign
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={`https://selah.fm/c/${id}`}
        title={displayTitle} imageUrl={campaign.cover_art_url} artistName={artistName} cpmDollars={cpm} trackTitle={trackTitle} />
      <EarnModal open={joinOpen} onClose={() => setJoinOpen(false)} campaignId={id} trackTitle={displayTitle}
        cpmCents={campaign.cpm_rate_cents} coverArtUrl={campaign.cover_art_url} contentAssetsUrl={campaign.content_assets_url} />
    </div>
  );
}

// ── Collapsible Requirements block ────────────────────────────────
function RequirementsBlock({ requirements }: { requirements: string }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
        >
          <h3 className="font-bold text-sm flex items-center gap-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
            <Music2 size={15} className="text-[#4338CA]/60" />Full guidelines &amp; tips
          </h3>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-muted-foreground">
            <ChevronRight size={16} />
          </motion.span>
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-0 border-t border-white/[0.04]">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mt-4">{requirements}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── More campaigns (simplified grid) ──────────────────────────────
function MoreCampaigns({ currentId }: { currentId: string }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/campaigns?limit=50', { credentials: 'omit' })
      .then(r => r.json())
      .then(data => {
        const all = (data.campaigns || [])
          .filter((c: any) => c.slug !== currentId && c.id !== currentId)
          .slice(0, 15);
        setCampaigns(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentId]);

  if (loading) return (
    <div className="grid grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
          <div className="aspect-square bg-white/[0.02] animate-pulse" />
          <div className="p-3 space-y-1.5"><div className="h-3 bg-white/[0.04] rounded w-3/4 animate-pulse" /><div className="h-2 bg-white/[0.02] rounded w-1/2 animate-pulse" /></div>
        </div>
      ))}
    </div>
  );

  if (campaigns.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {campaigns.map((c: any) => (
        <button key={c.id} onClick={() => router.push(`/c/${c.slug || c.id}`)}
          className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-[#4338CA]/15 transition-all text-left">
          <div className="aspect-square bg-white/[0.02]">
            {c.cover_art_url ? (
              <img src={c.cover_art_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center"><Music2 size={20} className="text-white/5" /></div>
            )}
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold truncate">{c.title || c.track_title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{c.artist_name || 'Artist'}</p>
          </div>
        </button>
      ))}
    </div>
  );
}