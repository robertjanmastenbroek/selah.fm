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
import { Heart, X, Link2, Play, Camera, Copy, Check, Music2, BarChart3 } from 'lucide-react';

// ── Brand accent (deep indigo-purple) ──────────────────────
const ACCENT = '#4338CA'; // Indigo primary

// ── Circle Progress (light-blue → dark-blue gradient) ──────
function lerpColor(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}
function pctColor(pct: number) {
  const t = Math.min(pct, 100) / 100;
  // Indigo-to-green gradient
  const r = lerpColor(0x43, 0x22, t);
  const g = lerpColor(0x38, 0xC5, t);
  const b_ = lerpColor(0xCA, 0x5E, t);
  return `rgb(${r},${g},${b_})`;
}

function CircleProgress({ pct, size = 100 }: { pct: number; size?: number }) {
  const stroke = 6, radius = (size - stroke) / 2, circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  const color = pctColor(pct);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Share Modal (campaign-specific metadata, native share API) ──
function ShareModal({ open, onClose, url, title, imageUrl, artistName, cpmDollars, trackTitle }: { open: boolean; onClose: () => void; url: string; title: string; imageUrl?: string; artistName?: string; cpmDollars?: number; trackTitle?: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const artistLine = artistName ? `${artistName} — ` : '';
  const shareTitle = `${artistLine}"${trackTitle || title}" on Selah.fm 🎵`;
  const shareBody = cpmDollars
    ? `Join to earn $${cpmDollars.toFixed(2)} per 1K verified views by creating content — or donate to support this track. Selah.fm is where music meets creators. 🎵`
    : 'Join a campaign, create content and earn per verified view, or donate to support this track on Selah.fm 🎵';
  const fullShareText = `${shareTitle}\n\n${shareBody}\n\n${url}`;
  const encodedShare = encodeURIComponent(fullShareText);

  const copyLink = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };

  const options = [
    { name: 'Instagram Story', action: async () => {
      try { await navigator.share({ title: shareTitle, text: `${shareBody}\n\n${url}`, url }); } catch {
        await navigator.clipboard.writeText(fullShareText); window.open('instagram://story-camera', '_blank');
        setTimeout(() => window.open('https://www.instagram.com/', '_blank'), 500);
      }
    }, color: '#E1306C', bg: 'bg-[#E1306C]/10', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/></svg>, note: '(story & post)' },
    { name: 'TikTok', action: async () => {
      try { await navigator.share({ title: shareTitle, text: `${shareBody}\n\n${url}`, url }); } catch {
        await navigator.clipboard.writeText(fullShareText); window.open('https://www.tiktok.com/', '_blank');
      }
    }, color: '#ff0050', bg: 'bg-[#ff0050]/10', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>, note: '(story & post)' },
    { name: 'WhatsApp', action: async () => {
      try { await navigator.share({ title: shareTitle, text: `${shareBody}\n\n${url}`, url }); } catch {
        window.open(`https://wa.me/?text=${encodedShare}`, '_blank');
      }
    }, color: '#25D366', bg: 'bg-[#25D366]/10', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>, note: '(status & chat)' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(fullShareText)}`, color: '#1877F2', bg: 'bg-[#1877F2]/10', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareTitle}\n\n${url}`)}`, color: '#fff', bg: 'bg-white/10', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { name: 'Copy Link', action: copyLink, color: '#4338CA', bg: 'bg-primary/10', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> },
    { name: 'Email', href: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(fullShareText)}`, color: '#4338CA', bg: 'bg-primary/10', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} className="relative z-10 w-full sm:max-w-md max-h-[90vh] sm:rounded-3xl rounded-t-3xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Share this campaign</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06]"><X size={20} className="text-muted-foreground" /></button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-white/[0.04]">
                  {imageUrl ? <img src={imageUrl} alt={title} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><Music2 size={20} className="text-muted-foreground/30" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{title}</p>
                  {artistName && <p className="text-[10px] text-muted-foreground truncate">{artistName}</p>}
                  <p className="text-[9px] text-muted-foreground/50 mt-0.5">selah.fm</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Link2 size={16} className="text-muted-foreground shrink-0" />
                <code className="text-xs text-muted-foreground truncate flex-1 select-all">{url}</code>
                <button onClick={copyLink} className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold active:scale-[0.97]">{copied ? 'Copied!' : 'Copy'}</button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {options.map(opt => {
                  const isAction = !!opt.action;
                  const Comp = isAction ? 'button' : 'a';
                  return (
                    <Comp key={opt.name} href={isAction ? undefined : opt.href} target={isAction ? undefined : '_blank'} rel={isAction ? undefined : 'noopener noreferrer'} onClick={isAction ? (e: any) => { e.preventDefault(); opt.action!(); } : undefined} className="flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-white/[0.04] transition-colors active:scale-[0.95]">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${opt.bg}`} style={{ color: opt.color }}>{opt.icon}</div>
                      <span className="text-[10px] text-muted-foreground text-center leading-tight">{opt.name}</span>
                      {opt.note && <span className="text-[8px] text-muted-foreground/40 -mt-1">{opt.note}</span>}
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

// ── Audience-specific share message generator ────────────────
function getShareMessages(artistName: string, displayTitle: string, campaignId: string, trackTitle: string) {
  const url = `https://selah.fm/c/${campaignId}`;
  const cleanTitle = trackTitle || displayTitle;

  return {
    // Artist sharing with their fans
    artist: {
      title: `Someone built a promotion campaign for my track "${cleanTitle}" 🎵`,
      body: `If you make TikToks or Reels, you can earn money featuring my song. Even $5 helps fund the campaign. Check it out:\n\n${url}`,
    },
    // Friends & family sharing to support
    friend: {
      title: `I just supported ${artistName}'s music on Selah.fm 🎵`,
      body: `Someone made a promotion campaign for "${cleanTitle}". Anyone can chip in a few bucks or make a video to help boost the track. Check it out:\n\n${url}`,
    },
    // Creators sharing their submission
    creator: {
      title: `I'm earning on Selah.fm making content with "${cleanTitle}" 🎵`,
      body: `Join this campaign for ${artistName}'s "${cleanTitle}" and earn per verified view on TikTok, Reels, or Shorts. No minimum followers:\n\n${url}`,
    },
    // Generic — pre-written DM template for the artist
    dm: {
      title: `${artistName} — "${cleanTitle}" campaign on Selah.fm`,
      body: `Someone built a promotion campaign for your track "${cleanTitle}" on Selah.fm. Creators can make TikToks/Reels with your music and you only pay per verified view — no upfront cost. Friends and family can chip in to fund it. Claim it whenever you want (takes 30 seconds):\n\n${url}`,
    },
  };
}

// ── Main Component ──────────────────────────────────────────
export default function CampaignDetailClient({ id, initialCampaign }: { id: string; initialCampaign: any }) {
  const [campaign, setCampaign] = useState<any>(initialCampaign);
  const [loading, setLoading] = useState(!initialCampaign);
  const { addToast } = useToast();
  const router = useRouter();

  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [heroBottom, setHeroBottom] = useState(0);

  const [shareOpen, setShareOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    if (!initialCampaign) {
      fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => { if (d.error) setCampaign(null); else setCampaign(d); setLoading(false); }).catch(() => setLoading(false));
    } else {
      // Always fetch fresh data after mount — server cache may be stale
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

  const bg = '#0F0F23';

  if (loading) return (<div className="min-h-screen" style={{ background: bg }}><Header /><main className="max-w-2xl mx-auto px-4 py-16"><Skeleton className="aspect-[4/3] rounded-none mb-4"/><Skeleton className="h-8 w-1/2"/></main></div>);
  if (!campaign) return (<div className="min-h-screen" style={{ background: bg }}><Header /><main className="max-w-2xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold mb-4">Campaign not found</h1><Link href="/browse"><Button>Browse</Button></Link></main></div>);

  const budget = campaign.total_budget_cents / 100;
  const remaining = campaign.budget_remaining_cents / 100;
  const spent = budget - remaining;
  const cpm = campaign.cpm_rate_cents / 100;
  const progress = budget > 0 ? (spent / budget) * 100 : 0;
  const donations = campaign.donations || { totalCents: 0, count: 0, supporters: [] };
  const views = parseInt(campaign.total_verified_views || '0');
  const submissions = parseInt(campaign.approved_submissions || '0');
  const totalRaised = donations.totalCents / 100;
  const artistName = campaign.artist_name || '';
  const displayTitle = campaign.title || campaign.track_title;
  const trackTitle = campaign.track_title || '';

  // Build carousel items from gallery_images + youtube_video_url
  const carouselItems: any[] = [];
  if (campaign.gallery_images) {
    const gallery = typeof campaign.gallery_images === 'string'
      ? JSON.parse(campaign.gallery_images)
      : campaign.gallery_images;
    if (Array.isArray(gallery)) {
      // Support both legacy string array and new GalleryItem[] format
      gallery.forEach((item: any) => {
        if (typeof item === 'string') {
          // Legacy: plain URL
          const isYoutube = item.includes('youtube.com') || item.includes('youtu.be');
          carouselItems.push({ type: isYoutube ? 'video' : 'image', url: item });
        } else if (item && typeof item === 'object' && item.url) {
          // New GalleryItem format
          carouselItems.push({ type: item.type || 'image', url: item.url });
        }
      });
    }
  }
  // Add YouTube video URL as a carousel item if not already in gallery
  if (campaign.youtube_video_url) {
    const alreadyIncluded = carouselItems.some(
      (item: any) => item.type === 'video' && item.url === campaign.youtube_video_url
    );
    if (!alreadyIncluded) {
      carouselItems.push({ type: 'video', url: campaign.youtube_video_url });
    }
  }

  const isUnclaimed = campaign.is_unclaimed && !campaign.claimed_by_user_id;
  const claimCode = campaign.claim_code;
  const claimUrl = claimCode ? `https://selah.fm/claim/${claimCode}` : '';

  const stickyBarVisible = scrollY > heroBottom - 80;

  // ── Unclaimed campaign: premium gift UX with glassmorphism ──
  if (isUnclaimed) {
    return (
      <div className="min-h-screen" style={{ background: bg }}>
        <Header />

        {/* ── Hero: Animated gradient orb + glassmorphism ── */}
        <div ref={heroRef} className="relative overflow-hidden" style={{ minHeight: '60vh' }}>
          {/* Animated orbs */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.07]" animate={{ scale: [1, 1.05, 1], x: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.5) 0%, transparent 70%)' }} />
            <motion.div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full opacity-[0.05]" animate={{ scale: [1.05, 1, 1.05], x: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%)' }} />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto px-4 py-16 md:py-24 text-center">
            {/* Gift icon — Lucide, not emoji */}
            <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="mb-8">
              <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(67,56,202,0.12), rgba(67,56,202,0.04))', border: '1px solid rgba(67,56,202,0.15)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/80"><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-3xl md:text-5xl font-heading tracking-tight mb-4">
              A campaign for{' '}
              <span className="bg-gradient-to-r from-primary via-primary to-[#22C55E] bg-clip-text text-transparent">{artistName}</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
              Someone built a promotion page for <strong className="text-foreground">"{trackTitle}"</strong>. Creators can make TikToks and Reels with this track and earn per verified view. The artist only pays when views happen.
            </motion.p>

            {/* Album art with glow */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="relative inline-block mb-8">
              <div className="absolute -inset-4 rounded-3xl opacity-20 blur-xl" style={{ background: 'linear-gradient(135deg, rgba(67,56,202,0.3), rgba(34,197,94,0.2))' }} />
              <div className="relative w-52 h-52 md:w-72 md:h-72 rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl" style={{ boxShadow: '0 0 80px rgba(67,56,202,0.15)' }}>
                {campaign.cover_art_url ? (
                  <img src={campaign.cover_art_url} alt={displayTitle} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/[0.02] flex items-center justify-center">
                    <Music2 size={56} className="text-muted-foreground/15" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Listen link */}
            {campaign.track_url && (
              <motion.a initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} href={campaign.track_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-all mb-8">
                <Play size={14} className="text-primary" />
                Listen to "{trackTitle}"
              </motion.a>
            )}

            {/* Unclaimed badge */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/[0.06] border border-amber-500/10 text-amber-400/70 text-xs mb-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Unclaimed
            </motion.div>
            <p className="text-[11px] text-muted-foreground/50 max-w-sm mx-auto">
              {artistName} hasn't claimed this page yet. Donations and submissions still work.
            </p>
          </div>
        </div>

        {/* ── Stats strip ── */}
        {(submissions > 0 || views > 0 || totalRaised > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto px-4 -mt-8 mb-12">
            <div className="rounded-2xl border border-white/[0.06] p-5 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Creators', value: submissions },
                  { label: 'Views', value: views >= 1000 ? `${(views/1000).toFixed(1)}K` : views },
                  { label: 'Earned', value: `$${spent.toFixed(0)}` },
                  { label: 'Remaining', value: `$${remaining.toFixed(0)}` },
                ].map(s => (
                  <div key={s.label} className="text-center">
                    <div className="text-lg md:text-xl font-bold text-foreground">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Two cards: Support + Create ── */}
        <div className="max-w-2xl mx-auto px-4 mb-10">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Support card */}
            <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-2xl border border-primary/10 p-6 backdrop-blur-sm" style={{ background: 'linear-gradient(180deg, rgba(67,56,202,0.04) 0%, rgba(67,56,202,0.01) 100%)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(67,56,202,0.15), rgba(67,56,202,0.05))' }}>
                  <Heart size={18} className="text-primary" />
                </div>
                <h2 className="font-heading text-lg">Support</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Chip in any amount to fund the promotion campaign.</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[5, 10, 25, null].map((amount) => {
                  const href = amount ? `/checkout?type=donation&campaignId=${id}&amount=${amount * 100}` : `/checkout?type=donation&campaignId=${id}`;
                  return (
                    <Link key={amount || 'custom'} href={href} className="py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-center text-sm font-semibold hover:border-primary/20 hover:bg-primary/[0.04] transition-all active:scale-[0.97]">
                      {amount ? `$${amount}` : '···'}
                    </Link>
                  );
                })}
              </div>
              {donations.count > 0 ? (
                <p className="text-xs text-muted-foreground text-center">
                  <strong className="text-foreground">{donations.count}</strong> {donations.count === 1 ? 'person donated' : 'people donated'} <strong className="text-primary">${totalRaised.toFixed(0)}</strong>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/50 text-center">Be the first to support</p>
              )}
            </motion.div>

            {/* Create card */}
            <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-2xl border border-[#22C55E]/10 p-6 backdrop-blur-sm" style={{ background: 'linear-gradient(180deg, rgba(34,197,94,0.04) 0%, rgba(34,197,94,0.01) 100%)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))' }}>
                  <Camera size={18} className="text-[#22C55E]" />
                </div>
                <h2 className="font-heading text-lg">Create</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Make a TikTok or Reel with this track and earn per verified view.</p>
              <button onClick={() => setJoinOpen(true)} className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] hover:shadow-[0_0_30px_rgba(34,197,94,0.2)]" style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}>
                Submit a video
              </button>
              <p className="text-[10px] text-muted-foreground/50 text-center mt-3">No minimum followers · Phone only</p>
            </motion.div>
          </div>
        </div>

        {/* ── Claim CTA ── */}
        {claimCode && (
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-xl mx-auto px-4 mb-12">
            <div className="rounded-2xl border border-amber-500/10 p-6 text-center backdrop-blur-sm" style={{ background: 'linear-gradient(180deg, rgba(245,158,11,0.04) 0%, transparent 100%)' }}>
              <h3 className="font-heading text-lg mb-2">This yours?</h3>
              <p className="text-sm text-muted-foreground mb-5">Claim this campaign to manage submissions and withdraw funds.</p>
              <Link href={`/claim/${claimCode}`} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-amber-500 text-black font-bold text-sm hover:bg-amber-400 transition-all active:scale-[0.97]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                Claim campaign
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── Share + Browse ── */}
        <div className="max-w-xl mx-auto px-4 mb-16">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShareOpen(true)} className="py-4 rounded-xl bg-white/[0.03] border border-white/[0.06] font-semibold text-sm hover:border-white/[0.12] hover:bg-white/[0.05] transition-all active:scale-[0.97] flex items-center justify-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
              Share
            </button>
            <Link href="/browse" className="py-4 rounded-xl text-center font-semibold text-sm active:scale-[0.97] transition-all flex items-center justify-center gap-2" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}CC)`, color: '#FFFFFF' }}>
              Browse campaigns
            </Link>
          </div>
        </div>

        {/* ── More campaigns + footer ── */}
        <div className="px-4 max-w-2xl mx-auto">
          <h3 className="font-heading text-sm mb-4 text-muted-foreground">More campaigns</h3>
          <InfiniteCampaigns currentId={id} />
          <footer className="text-center pb-10 pt-6 space-y-3">
            <div className="flex items-center justify-center gap-4">
              <a href="https://instagram.com/selahfm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
              <a href="https://x.com/selah_fm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
              <a href="https://www.tiktok.com/@selah.fm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/25 hover:text-muted-foreground/50 transition-colors"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>
            </div>
            <p className="text-[11px] text-muted-foreground/30">Selah.fm — The marketplace for music promotion</p>
          </footer>
        </div>

        <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={`https://selah.fm/c/${id}`} title={displayTitle} imageUrl={campaign.cover_art_url} artistName={artistName} cpmDollars={cpm} trackTitle={trackTitle} />
        <EarnModal open={joinOpen} onClose={() => setJoinOpen(false)} campaignId={id} trackTitle={displayTitle} cpmCents={campaign.cpm_rate_cents} coverArtUrl={campaign.cover_art_url} contentAssetsUrl={campaign.content_assets_url} />
      </div>
    );
  }

  // ── Claimed campaign: professional creator marketplace UX ──
  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />

      <div ref={heroRef}>
        <div className="md:flex md:flex-row md:min-h-[65vh]">
          {/* ── LEFT: Campaign image + title ── */}
          <div className="relative md:w-[60%]">
            <CampaignCover
              src={campaign.cover_art_url}
              title={campaign.track_title}
              className="w-full h-[50vh] md:h-full rounded-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20 pointer-events-none" />
            <div className="absolute top-3 left-4 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white border border-white/20 shrink-0 overflow-hidden">
                {campaign.artist_avatar ? <img src={campaign.artist_avatar} alt={artistName} className="w-full h-full object-cover" /> : artistName[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-white text-sm font-semibold drop-shadow-sm">{artistName}</span>
            </div>
            <div className="absolute bottom-10 left-0 right-0 flex justify-center px-6 pointer-events-none">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-center drop-shadow-lg leading-tight">{displayTitle}</h1>
            </div>
          </div>

          {/* ── RIGHT: CTA section ── */}
          <div className="md:w-[40%] bg-[#0F0F23] px-5 py-5 md:py-8 md:flex md:flex-col md:justify-center md:border-l md:border-white/[0.06]">
            <div className="border-t border-white/10 mb-5 md:hidden" />
            <div className="relative flex items-center gap-4 mb-5 pr-12">
              <CircleProgress pct={progress} size={64} />
              <div className="flex-1 min-w-0 space-y-1.5">
                <div>
                  <span className="text-lg font-bold">${spent.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground ml-1.5">spent of</span>
                  <span className="text-sm font-semibold ml-1">${budget.toFixed(0)} budget</span>
                </div>
                <LiveTicker campaignId={id} />
              </div>
              <button onClick={() => setShareOpen(true)} className="absolute top-0 right-0 flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.05] transition-colors active:scale-[0.95]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>
                <span className="text-[9px] font-medium text-muted-foreground">Share</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setJoinOpen(true)} className="flex-1 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground active:scale-[0.98] transition-all hover:shadow-[0_0_24px_rgba(67,56,202,0.35)]">JOIN</button>
              <Link href={`/checkout?type=donation&campaignId=${id}`} className="flex-1 py-4 text-base font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}CC)`, color: '#FFFFFF' }}>DONATE</Link>
            </div>

            <div className="hidden md:block mt-6 space-y-4">
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Heart size={13} className="text-primary/50" />Donations</h4>
                  <span className="text-lg font-bold text-primary">${totalRaised.toFixed(0)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5 text-center">
                    <div className="text-sm font-bold">{donations.count}</div>
                    <div className="text-[9px] text-muted-foreground">Donors</div>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5 text-center">
                    <div className="text-sm font-bold">{submissions}</div>
                    <div className="text-[9px] text-muted-foreground">Videos</div>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5 text-center">
                    <div className="text-sm font-bold">{views >= 1000 ? `${(views/1000).toFixed(1)}K` : views}</div>
                    <div className="text-[9px] text-muted-foreground">Views</div>
                  </div>
                </div>
                {donations.supporters.length > 0 && (
                  <div className="space-y-1.5">
                    {donations.supporters.slice(0, 3).map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 py-2 px-1 text-xs">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{(s.donor_name || 'A')[0].toUpperCase()}</div>
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <span className="text-muted-foreground truncate">{s.donor_name || 'Anonymous'}</span>
                          <span className="font-semibold text-primary shrink-0">${(s.amount_cents / 100).toFixed(0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {donations.supporters.length === 0 && (
                  <div className="text-center py-3">
                    <p className="text-[11px] text-muted-foreground">No donations yet</p>
                  </div>
                )}
              </div>
              {(submissions > 0 || parseInt(campaign.pending_submissions || '0') > 0) && <SubmissionsFeed campaignId={id} count={submissions + parseInt(campaign.pending_submissions || '0')} />}
            </div>
          </div>
        </div>
      </div>

      <main className="pb-32 md:pb-20">
        <div className="px-4 space-y-6">
          {/* ── Media Carousel (gallery images + YouTube video) ── */}
          {carouselItems.length > 0 && (
            <MediaCarousel items={carouselItems} />
          )}

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Camera size={14} className="text-primary/60" />How to participate</h3>
              <div className="grid md:grid-cols-3 gap-3 text-[11px] text-muted-foreground">
                {[
                  { step: '1', title: 'Find the audio', desc: `Search "${campaign.track_title}" on TikTok, Instagram, YouTube, or Facebook. Use the official audio.` },
                  { step: '2', title: 'Create your video', desc: 'Record a video using the official audio. Be creative — dance, react, duet.' },
                  { step: '3', title: 'Join campaign', desc: `Post publicly, copy the link, paste it here. Earn $${(cpm * 0.8).toFixed(2)} per 1K verified views.` },
                ].map(s => (
                  <div key={s.step} className="space-y-1"><span className="font-semibold text-foreground/70">{s.title}</span><p className="leading-relaxed break-words">{s.desc}</p></div>
                ))}
              </div>
            </div>
          </motion.div>

          {campaign.content_assets_url ? (
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <a href={campaign.content_assets_url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl bg-gradient-to-r from-primary/[0.08] to-primary/[0.02] border-2 border-primary/20 p-5 hover:border-primary/30 transition-all group active:scale-[0.99]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-primary group-hover:underline">📦 Download official audio & assets</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Master track (.wav + .mp3), cover art, reference videos — everything you need to create winning content for this campaign.</p>
                    <span className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold mt-3 group-hover:gap-2 transition-all">Open Google Drive <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
                  </div>
                </div>
              </a>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl bg-amber-500/[0.04] border border-amber-500/10 p-5 flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/60 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                <p className="text-xs font-semibold text-amber-400/80">No resource pack provided</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">The artist hasn&apos;t shared a Google Drive with audio files yet. Creators can still find the official audio by searching &quot;{campaign.track_title}&quot; on their platform.</p>
              </div>
            </motion.div>
          )}

          {campaign.requirements && (
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Music2 size={14} className="text-primary/60" />Campaign requirements</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{campaign.requirements}</p>
                {campaign.recommended_hashtags && <p className="text-xs font-mono text-primary mt-3">{campaign.recommended_hashtags}</p>}
              </div>
            </motion.div>
          )}

          <div className="md:hidden">
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-3">
              <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Heart size={13} className="text-primary/50" />Donations</h3>
                  <span className="text-xl font-bold text-primary">${totalRaised.toFixed(0)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5 text-center">
                    <div className="text-sm font-bold">{donations.count}</div>
                    <div className="text-[9px] text-muted-foreground">Donors</div>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5 text-center">
                    <div className="text-sm font-bold">{submissions}</div>
                    <div className="text-[9px] text-muted-foreground">Videos</div>
                  </div>
                  <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5 text-center">
                    <div className="text-sm font-bold">{views >= 1000 ? `${(views/1000).toFixed(1)}K` : views}</div>
                    <div className="text-[9px] text-muted-foreground">Views</div>
                  </div>
                </div>
                {donations.supporters.length > 0 ? (
                  <div className="space-y-1">
                    {donations.supporters.map((s: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 py-2.5 px-1">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{(s.donor_name || 'A')[0].toUpperCase()}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium truncate">{s.donor_name || 'Anonymous'}</span><span className="text-sm font-bold text-primary shrink-0">${(s.amount_cents / 100).toFixed(0)}</span></div>
                          {s.message && <p className="text-[11px] text-muted-foreground italic mt-0.5 leading-relaxed break-words">&ldquo;{s.message.slice(0, 80)}{s.message.length > 80 ? '...' : ''}&rdquo;</p>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-[11px] text-muted-foreground">No donations yet</p>
                    <Link href={`/checkout?type=donation&campaignId=${id}`} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Be the first to donate</Link>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="md:hidden">{(submissions > 0 || parseInt(campaign.pending_submissions || '0') > 0) && <SubmissionsFeed campaignId={id} count={submissions + parseInt(campaign.pending_submissions || '0')} />}</div>

          <div ref={moreRef}><h3 className="font-semibold text-sm mb-3">More campaigns</h3><InfiniteCampaigns currentId={id} /></div>

          <footer className="text-center pb-8 pt-2 space-y-3">
            <div className="flex items-center justify-center gap-4">
              <a href="https://instagram.com/selahfm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
              <a href="https://x.com/selah_fm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
              <a href="https://www.tiktok.com/@selah.fm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/30 hover:text-muted-foreground transition-colors"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>
            </div>
            <p className="text-xs text-muted-foreground/40">Selah.fm — The marketplace for music promotion</p>
          </footer>
        </div>
      </main>

      <AnimatePresence>
        {stickyBarVisible && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.25, ease: 'easeOut' }} className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F0F23]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3">
            <div className="space-y-3">
              <div className="relative flex items-center gap-3 pr-12">
                <CircleProgress pct={progress} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs"><span className="font-bold text-sm">${spent.toFixed(0)}</span><span className="text-muted-foreground ml-1">of ${budget.toFixed(0)}</span></div>
                  <div className="mt-0.5"><LiveTicker campaignId={id} /></div>
                </div>
                <button onClick={() => setShareOpen(true)} className="absolute top-0 right-0 flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg hover:bg-white/[0.04] transition-colors active:scale-[0.95]"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg><span className="text-[8px] font-medium text-muted-foreground">Share</span></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setJoinOpen(true)} className="flex-1 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground active:scale-[0.97] transition-transform">JOIN</button>
                <Link href={`/checkout?type=donation&campaignId=${id}`} className="flex-1 py-4 text-base font-bold rounded-xl active:scale-[0.97] transition-transform flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}CC)`, color: '#FFFFFF' }}>DONATE</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={`https://selah.fm/c/${id}`} title={displayTitle} imageUrl={campaign.cover_art_url} artistName={artistName} cpmDollars={cpm} trackTitle={campaign.track_title} />
      <EarnModal open={joinOpen} onClose={() => setJoinOpen(false)} campaignId={id} trackTitle={displayTitle} cpmCents={campaign.cpm_rate_cents} coverArtUrl={campaign.cover_art_url} contentAssetsUrl={campaign.content_assets_url} />
    </div>
  );
}

function InfiniteCampaigns({ currentId }: { currentId: string }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const offset = page * 12;
      const res = await fetch(`/api/campaigns?limit=12&offset=${offset}&sort=popular`);
      const data = await res.json();
      const fresh = (data.campaigns || []).filter((c: any) => c.id !== currentId);
      if (fresh.length === 0) { setHasMore(false); }
      else { setCampaigns(prev => [...prev, ...fresh]); setPage(p => p + 1); }
    } catch { setHasMore(false); }
    setLoading(false);
  }, [page, loading, hasMore, currentId]);

  useEffect(() => { fetchMore(); }, []);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) fetchMore(); }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchMore]);

  if (campaigns.length === 0 && loading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
            <div className="aspect-square bg-white/[0.02] animate-pulse" />
            <div className="p-3 space-y-1.5"><div className="h-3 bg-white/[0.04] rounded w-3/4 animate-pulse" /><div className="h-2 bg-white/[0.02] rounded w-1/2 animate-pulse" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0 && !loading) return <p className="text-xs text-muted-foreground text-center py-4">No more campaigns</p>;

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {campaigns.map((c: any) => (
          <button key={c.id} onClick={() => router.push(`/c/${c.slug || c.id}`)} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-primary/20 transition-all text-left">
            <div className="aspect-square bg-white/[0.02]">{c.cover_art_url && <img src={c.cover_art_url} alt="" className="w-full h-full object-cover" loading="lazy" />}</div>
            <div className="p-3">
              <p className="text-xs font-semibold truncate">{c.title || c.track_title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{c.artist_name || 'Artist'}</p>
            </div>
          </button>
        ))}
      </div>
      <div ref={loaderRef} className="py-4 flex justify-center">{loading && hasMore && <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}</div>
    </>
  );
}