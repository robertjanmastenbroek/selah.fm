'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SubmissionsFeed from '@/components/SubmissionsFeed';
import EarnModal from '@/components/EarnModal';
import {
  Heart, X, Play, Copy, Check, Music2, ChartBar,
  ChevronRight, Sparkles, Share2, TrendingUp, DollarSign,
  Film, ChevronDown, Shield, Eye, Bookmark, ExternalLink
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════
// HOOKS
// ════════════════════════════════════════════════════════════════

/** Tracks scroll position */
function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return scrollY;
}

/** Debounced value */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Animated counter */
function AnimatedCounter({ value, suffix = '', prefix = '', decimals = 0 }: { value: number; suffix?: string; prefix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    const start = display;
    const end = value;
    const duration = 800;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{prefix}{display.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

// ════════════════════════════════════════════════════════════════
// EARNINGS CALCULATOR
// ════════════════════════════════════════════════════════════════

function EarningsCalculator({ cpmCents }: { cpmCents: number }) {
  const cpmDollars = cpmCents / 100;
  const [views, setViews] = useState(10000);
  const earnings = (views / 1000) * cpmDollars * 0.8; // 80% creator share

  const presets = [
    { label: '1K', value: 1000 },
    { label: '10K', value: 10000 },
    { label: '100K', value: 100000 },
    { label: '1M', value: 1000000 },
  ];

  // Closest preset highlight
  const closestPreset = useMemo(() => {
    return presets.reduce((prev, curr) =>
      Math.abs(curr.value - views) < Math.abs(prev.value - views) ? curr : prev
    );
  }, [views]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-indigo-500/[0.03] border border-white/[0.06] p-5">
      <div className="flex items-center gap-2 mb-4">
        <ChartBar size={16} className="text-indigo-400" />
        <h3 className="font-semibold text-sm">How much you could earn</h3>
      </div>

      {/* Slider */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-muted-foreground">Your estimated views</span>
          <span className="text-sm font-bold text-white">
            {views >= 1000000
              ? `${(views / 1000000).toFixed(1)}M`
              : views >= 1000
              ? `${(views / 1000).toFixed(0)}K`
              : views.toLocaleString()} views
          </span>
        </div>
        <input
          type="range"
          min={100}
          max={5000000}
          step={100}
          value={views}
          onChange={(e) => setViews(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-white/[0.08] 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-indigo-500/40
            [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500 
            [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
          style={{
            background: `linear-gradient(to right, rgb(99,102,241) ${(views / 5000000) * 100}%, rgba(255,255,255,0.08) ${(views / 5000000) * 100}%)`,
          }}
        />
        <div className="flex justify-between mt-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setViews(p.value)}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${
                closestPreset.value === p.value
                  ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                  : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Earnings result */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <div>
          <p className="text-xs text-muted-foreground">Your earnings (80%)</p>
          <p className="text-2xl font-bold font-display text-emerald-400">
            ${earnings >= 1 ? earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : earnings.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">At ${cpmDollars.toFixed(2)} CPM</p>
          <p className="text-[10px] text-muted-foreground/50">Platform fee: 20%</p>
        </div>
      </div>

      {/* Quick reference table */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[10000, 100000, 1000000].map((v) => {
          const earn = (v / 1000) * cpmDollars * 0.8;
          return (
            <div key={v} className={`text-center p-2 rounded-lg border transition-all ${
              views >= v * 0.5 && views <= v * 1.5
                ? 'border-indigo-500/30 bg-indigo-500/10'
                : 'border-white/[0.04] bg-white/[0.02]'
            }`}>
              <p className="text-[10px] text-muted-foreground/70">
                {v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : `${(v / 1000).toFixed(0)}K`}
              </p>
              <p className="text-xs font-bold text-emerald-400/90">${earn.toFixed(2)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SUPPORTER GRID
// ════════════════════════════════════════════════════════════════

function SupporterGrid({ supporters, totalCount }: { supporters: any[]; totalCount: number }) {
  if (!supporters || supporters.length === 0) {
    return null; // Don't show 'be first' — campaign may have funding from other sources
  }

  const visible = supporters.slice(0, 8);
  const extra = totalCount - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Avatar stack */}
      <div className="flex -space-x-2">
        {visible.map((s: any, i: number) => (
          <div
            key={i}
            className="w-7 h-7 rounded-full border-2 border-[#0F0F23] bg-gradient-to-br from-indigo-500 to-purple-600 
              flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            title={`${s.donor_name || 'Anonymous'}${s.amount_cents ? ` · $${(s.amount_cents / 100).toFixed(2)}` : ''}`}
          >
            {(s.donor_name || '?')[0].toUpperCase()}
          </div>
        ))}
        {extra > 0 && (
          <div className="w-7 h-7 rounded-full border-2 border-[#0F0F23] bg-white/[0.06] flex items-center justify-center text-[9px] text-muted-foreground shrink-0">
            +{extra}
          </div>
        )}
      </div>

      <span className="text-xs text-muted-foreground">
        <strong className="text-white font-semibold">{totalCount}</strong> supporter{totalCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// FAQ ACCORDION
// ════════════════════════════════════════════════════════════════

const FAQ_DATA = [
  {
    q: 'How do I earn money promoting this track?',
    a: 'Create a short video (15-60 seconds) featuring the track on TikTok, Instagram Reels, or YouTube Shorts. Submit your video to this campaign. If the artist approves it, you earn per verified view — paid automatically via Stripe.',
  },
  {
    q: 'How much will I actually earn?',
    a: 'Use the calculator above. Your earnings depend on the CPM rate the artist set and how many verified views your video gets. You keep 80% of the earnings (platform fee is 20%). Payouts are automatic via Stripe Connect.',
  },
  {
    q: 'Do I need a following to participate?',
    a: 'No. CPM-based promotion pays per view, not per follower. A creator with 500 followers who makes engaging content can earn more than someone with 100K followers posting low-engagement videos.',
  },
  {
    q: 'How do I get paid?',
    a: 'Connect your Stripe account to Selah.fm. When your video is approved and views are verified, earnings are automatically deposited. No invoices. No manual requests.',
  },
  {
    q: 'What platforms are supported?',
    a: 'TikTok, Instagram Reels, and YouTube Shorts. Post wherever your audience is — views count across all platforms as long as they use the official audio.',
  },
  {
    q: 'What if my video isn\'t approved?',
    a: 'Artists review every submission. If rejected, you\'ll get feedback on why. You can fix the issue and resubmit. Unused campaign budget never gets charged.',
  },
];

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {FAQ_DATA.map((faq, i) => (
        <div key={i} className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left text-sm font-medium hover:bg-white/[0.02] transition-colors"
          >
            <span>{faq.q}</span>
            <ChevronDown
              size={16}
              className={`text-muted-foreground shrink-0 ml-3 transition-transform duration-200 ${
                openIndex === i ? 'rotate-180' : ''
              }`}
            />
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SHARE MODAL
// ════════════════════════════════════════════════════════════════

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

  const [copied, setCopied] = useState(false);

  const options = [
    { name: 'Copy Link', action: async () => {
      try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
      catch {}
    }, color: '#6366F1', bg: 'bg-indigo-500/10', icon: copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} /> },
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
                <h3 className="font-semibold text-lg font-display">Share this promotion</h3>
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

// ════════════════════════════════════════════════════════════════
// TRUST BADGES
// ════════════════════════════════════════════════════════════════

function TrustBar() {
  const badges = [
    { icon: <DollarSign size={14} />, text: 'You earn 80%' },
    { icon: <Check size={14} />, text: 'Paid via Stripe' },
    { icon: <Eye size={14} />, text: 'Verified views only' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((b, i) => (
        <span key={i}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] 
            text-[10px] text-muted-foreground/70 font-medium">
          <span className="text-indigo-400/70">{b.icon}</span>
          {b.text}
        </span>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ARTIST CREDIBILITY
// ════════════════════════════════════════════════════════════════

function ArtistCredibility({ campaign, artistSlug }: { campaign: any; artistSlug: string | null }) {
  const artistName = campaign.artist_name || 'Artist';
  const monthlyListeners = campaign.monthly_listeners || null;

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shrink-0">
          {artistName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{artistName}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {monthlyListeners && (
              <span className="flex items-center gap-1">
                <TrendingUp size={11} />
                {monthlyListeners >= 1000000
                  ? `${(monthlyListeners / 1000000).toFixed(1)}M`
                  : monthlyListeners >= 1000
                  ? `${(monthlyListeners / 1000).toFixed(0)}K`
                  : monthlyListeners} monthly listeners
              </span>
            )}
            {campaign.genre && (
              <span className="bg-white/[0.06] px-2 py-0.5 rounded-full text-[10px]">{campaign.genre}</span>
            )}
          </div>
        </div>
        {artistSlug && (
          <Link href={`/artist/${artistSlug}`}
            className="shrink-0 text-[11px] text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            View profile <ChevronRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SOCIAL PROOF HEADER BAR
// ════════════════════════════════════════════════════════════════

/* SocialProofBar removed — stats now in unified stat bar */

// ════════════════════════════════════════════════════════════════
// SUBMISSION GALLERY (visual thumbnails)
// ════════════════════════════════════════════════════════════════

function SubmissionGallery({ submissions }: { submissions: any[] }) {
  if (!submissions || submissions.length === 0) return null;

  const visible = submissions.slice(0, 6);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Film size={14} className="text-primary/60" />
        <h3 className="font-semibold text-sm">Creators making content</h3>
        <span className="text-[11px] text-muted-foreground">({submissions.length})</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {visible.map((s: any, i: number) => (
          <a
            key={s.id}
            href={s.content_url?.startsWith('http') ? s.content_url : `https://${s.content_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-[9/16] rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-white/[0.06] overflow-hidden hover:border-indigo-500/30 transition-all"
          >
            {/* Gradient placeholder for video thumbnail */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/10 group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Play icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play size={18} className="text-white ml-0.5" />
              </div>
            </div>

            {/* Creator name */}
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-[10px] font-medium text-white/90 truncate">{s.creator_name || 'Creator'}</p>
              <p className="text-[9px] text-white/50">
                {s.views_verified >= 1000
                  ? `${(s.views_verified / 1000).toFixed(1)}K views`
                  : `${s.views_verified || 0} views`}
                {s.payout_amount_cents > 0 && ` · $${(s.payout_amount_cents / 100).toFixed(2)}`}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB SECTION
// ════════════════════════════════════════════════════════════════

function CampaignTabs({ campaign, listenLinks, count, submissions }: {
  campaign: any; listenLinks: { platform: string; url: string; icon: string }[];
  count: number; submissions: any[];
}) {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Description', 'Requirements', 'FAQ'];

  return (
    <div className="w-full">
      <div className="flex border-b border-white/[0.06] overflow-x-auto scrollbar-none">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-5 py-3 text-sm font-medium transition-colors relative shrink-0 ${
              activeTab === i ? 'text-white' : 'text-muted-foreground hover:text-white/70'
            }`}>
            {tab}
            {tab === 'Submissions' && count > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">{count}</span>
            )}
            {activeTab === i && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {activeTab === 0 && (
          <div className="space-y-4">
            {/* Description — no redundant heading */}
              {campaign.description && campaign.description.length > 50 && (
                <section className="mb-6">
                  <div className="rounded-2xl bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/[0.06] p-5">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {campaign.description}
                    </p>
                  </div>
                </section>
              )}

              

            {/* Listen links — full-width platform cards */}
            {listenLinks.length > 0 && (
              <div className="pt-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-3">Listen on</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {listenLinks.map((link, i) => {
                    const platform = link.platform.toLowerCase();
                    const brandColor = platform === 'deezer' ? '#A238FF' :
                      platform === 'spotify' ? '#1DB954' :
                      platform === 'youtube' ? '#FF0000' :
                      platform === 'bandcamp' ? '#629AA9' :
                      platform === 'applemusic' ? '#FA2D48' :
                      platform.includes('apple') ? '#FA2D48' :
                      platform === 'soundcloud' ? '#FF7700' :
                      platform === 'tidal' ? '#000000' : '#6B6760';
                    
                    const svgIcon = platform === 'deezer' ?
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.81 4.16v3.33H14.8V4.16h4.01zm-4.64 0v3.33H9.35V4.16h4.82zM9.6 4.16v3.33H5.58V4.16H9.6zM5.34 4.16v3.33H1.33V4.16h4.01zm13.47 4.63v3.33h-4.01V8.79h4.01zm-4.64 0v3.33H9.35V8.79h4.82zM9.6 8.79v3.33H5.58V8.79H9.6zM5.34 8.79v3.33H1.33V8.79h4.01zm13.47 4.63v3.33h-4.01v-3.33h4.01zm-4.64 0v3.33H9.35v-3.33h4.82zM9.6 13.42v3.33H5.58v-3.33H9.6zM5.34 13.42v3.33H1.33v-3.33h4.01z"/></svg>
                    : platform === 'spotify' ?
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                    : platform === 'youtube' ?
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    : platform.includes('apple') ?
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                    : platform === 'soundcloud' ?
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.56 8.87v8.47h10.64c1.1 0 1.99-.96 2.1-2.17.11-1.2-.59-2.18-1.65-2.45.48-.71.75-1.54.75-2.41 0-2.44-1.92-4.42-4.29-4.42-1.2 0-2.29.5-3.08 1.3-.78.8-1.25 1.88-1.25 3.08?M2.27 12.53h.96v4.47h-.96zm-2.27 0h.96v4.47H0zm3.03 0h.96v4.47H3.03zm3.04 0h.96v4.47h-.96zm3.04 0h.96v4.47h-.96z"/></svg>
                    : platform === 'bandcamp' ?
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M0 18.75l7.437-13.5H24l-7.438 13.5H0z"/></svg>
                    : platform === 'tidal' ?
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996 4.004 12l4.004-4.004L12.012 3.992zM16.016 7.996l-4.004-4.004-4.004 4.004-4.004-4.004 4.004-4.004zM8.008 20.008l4.004-4.004 4.004 4.004-4.004 4.004z"/></svg>
                    : null;
                    
                    return (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all active:scale-[0.97] hover:-translate-y-0.5"
                        style={{ borderColor: `${brandColor}20`, background: `${brandColor}08` }}
                        title={`Listen on ${link.platform}`}>
                        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${brandColor}18`, color: brandColor }}>
                          {svgIcon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#F4F1EA' }}>{link.platform}</p>
                          <p className="text-[10px] truncate" style={{ color: '#6B6760' }}>{link.url?.replace(/^https?:\/\//, '').slice(0, 30)}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submission gallery */}
            {submissions.length > 0 && (
              <div className="pt-4">
                <SubmissionGallery submissions={submissions} />
              </div>
            )}
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-4">
            {/* ── Permanent license & tagging requirements ── */}
            <div className="rounded-xl border border-amber-500/15 p-4 space-y-3" style={{ background: 'rgba(214,168,95,0.04)' }}>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#D6A85F' }}>Required for all submissions</p>
              <div className="space-y-2 text-sm leading-relaxed" style={{ color: '#A09B92' }}>
                <p>
                  <strong style={{ color: '#F4F1EA' }}>1. The song must be clearly audible</strong> — the track 
                  must be the main audio in your video. If you sing, rap, or talk over the track, your 
                  submission won't qualify unless it's a remix or cover of the song itself.
                </p>
                <p>
                  <strong style={{ color: '#F4F1EA' }}>2. Tag the artist + #selahfm</strong> — your video must 
                  include <code style={{ color: '#D6A85F', background: 'rgba(214,168,95,0.08)', padding: '1px 4px', borderRadius: 3, fontSize: 11 }}>#selahfm</code> in the caption and tag{' '}
                  <code style={{ color: '#D6A85F', background: 'rgba(214,168,95,0.08)', padding: '1px 4px', borderRadius: 3, fontSize: 11 }}>@{campaign.artist_username || 'the artist'}</code> 
                  in the video description so we can verify it.
                </p>
                <p>
                  <strong style={{ color: '#F4F1EA' }}>3. Max payout: $500 per video</strong> — even if your video gets millions 
                  of views, the payout is capped at $500.00 per submission. No limit on how many 
                  videos you can submit.
                </p>
              </div>
            </div>

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
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{campaign.requirements}</div>
              </div>
            )}

            {!campaign.requirements && (campaign.platforms_needed?.length === 0 || !campaign.platforms_needed) && !campaign.genre && (
              <div className="text-sm text-muted-foreground/50 italic">
                No specific requirements. Create a video featuring this track and submit.
              </div>
            )}

            {/* Earnings calculator in Requirements tab */}
            <div className="pt-2">
              <EarningsCalculator cpmCents={campaign.cpm_rate_cents || 0} />
            </div>
          </div>
        )}

        {/* Submissions tab removed — individual subs hidden */}

        {activeTab === 2 && (
          <FAQAccordion />
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ════════════════════════════════════════════════════════════════

function CampaignSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F0F23]">
      <Header />
      <div className="md:flex md:flex-row md:min-h-[65vh]">
        <div className="md:w-[60%]">
          <Skeleton className="w-full h-[50vh] md:h-full rounded-none bg-white/[0.03]" />
        </div>
        <div className="md:w-[40%] px-5 py-8 space-y-5">
          <Skeleton className="h-8 w-3/4 bg-white/[0.03]" />
          <Skeleton className="h-6 w-1/2 bg-white/[0.03]" />
          <Skeleton className="h-14 w-full rounded-xl bg-white/[0.03]" />
          <Skeleton className="h-20 w-full rounded-xl bg-white/[0.03]" />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════

interface ListenLink { platform: string; url: string; icon: string; }

// ---- ACTIVITY TIMELINE ---------------------------------
function ActivityTimeline({ campaign }: { campaign: any }) {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaign?.id) return;
    fetch("/api/campaigns/" + campaign.id + "/submissions?status=approved&limit=5")
      .then(r => r.json())
      .then(d => {
        const items = (d.submissions || []).map((s: any) => ({
          id: s.id, type: "submission", title: "New submission approved",
          detail: (s.views_verified || 0).toLocaleString() + " views",
          time: s.created_at,
        }));
        setActivities(items);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [campaign?.id]);

  if (loading) return <div className="animate-pulse h-16 bg-white/[0.02] rounded-xl" />;
  if (activities.length === 0) return null;

  return (
    <section className="mt-8">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.map((a: any, i: number) => (
          <div key={a.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-sm">{'\ud83d\udcf9'}</div>
              {i < activities.length - 1 && <div className="w-px flex-1 bg-white/[0.04] mt-1" />}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <p className="text-xs font-medium">{a.title}</p>
              <p className="text-[10px] text-muted-foreground/50">
                {a.detail}
                {a.time && <span className="ml-2">{new Date(a.time).toLocaleDateString()}</span>}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CampaignDetailClient({ id, initialCampaign, listenLinks = [], artistSlug = null, submissions = [] }: {
  id: string; initialCampaign: any; listenLinks?: ListenLink[]; artistSlug?: string | null; submissions?: any[];
}) {
    const [campaign, setCampaign] = useState<any>(initialCampaign);
  const [saved, setSaved] = useState(false);

  // Fetch saved status
  useEffect(() => {
    if (!campaign?.id) return;
    fetch(`/api/campaigns/${campaign.id}/interest`, { credentials: 'include' })
      .then(r => r.json()).then(d => setSaved(d.saved)).catch(() => {});
  }, [campaign?.id]);
  const [loading, setLoading] = useState(!initialCampaign);
  const { addToast } = useToast();
  const router = useRouter();
  const scrollY = useScrollPosition();
  const heroRef = useRef<HTMLDivElement>(null);

  const [shareOpen, setShareOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  // Fetch fresh campiagn data
  useEffect(() => {
    if (!initialCampaign) {
      fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => {
        if (d.error) setCampaign(null); else setCampaign(d); setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => { if (!d.error) setCampaign(d); }).catch(() => {});
    }
  }, [id, initialCampaign]);

  // Live updates via SSE + 30s polling fallback
  useEffect(() => {
    // SSE connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/c/${id}/stream`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'donation' || data.type === 'submission') {
            // Refresh campaign data on live event
            fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => { if (!d.error) setCampaign(d); }).catch(() => {});
          }
        } catch {}
      };
      eventSource.onerror = () => {
        eventSource?.close();
        // Fallback to polling
      };
    } catch {}

    // 30s polling fallback
    const poll = setInterval(() => {
      fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => { if (!d.error) setCampaign(d); }).catch(() => {});
    }, 30000);

    return () => {
      eventSource?.close();
      clearInterval(poll);
    };
  }, [id]);

  if (loading) return <CampaignSkeleton />;

  if (!campaign) return (
    <div className="min-h-screen bg-[#0F0F23]">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold font-display mb-4">Track promotion not found</h1>
        <p className="text-muted-foreground mb-6">This campaign doesn&apos;t exist or has been removed.</p>
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
  const submissionCount = parseInt(campaign.approved_submissions || '0');
  const totalRaised = (campaign.total_budget_cents || donations.totalCents || 0) / 100;
  const supporters = donations.supporters || [];
  const artistName = campaign.artist_name || 'Artist';
  const displayTitle = campaign.title || campaign.track_title || campaign.campaign_title || 'Campaign';
  const trackTitle = campaign.track_title || '';
  const isUnclaimed = campaign.is_unclaimed && !campaign.claimed_by_user_id;
  const claimCode = campaign.claim_code;

  return (
    <div className="min-h-screen bg-[#0F0F23]">
      <Header />

      {/* Breadcrumb removed — JSON-LD still in server component for SEO */}

      {/* ════════════════════════════════════════════════════════ */}
      {/* HERO — Two-column */}
      {/* ════════════════════════════════════════════════════════ */}
      <div ref={heroRef}>
        <div className="md:flex md:flex-row md:min-h-[65vh]">

          {/* LEFT: Cover Art or Video */}
          <div className="relative md:w-[60%] overflow-hidden">
            <div className="relative w-full h-[50vh] md:h-full">
              {campaign.video_url ? (
                /* Video embed — YouTube or Vimeo */
                (() => {
                  const embedUrl = (() => {
                    const yt = campaign.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                    if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=0&rel=0`;
                    const vm = campaign.video_url.match(/vimeo\.com\/(\d+)/);
                    if (vm) return `https://player.vimeo.com/video/${vm[1]}?autoplay=0`;
                    return null;
                  })();

                  return embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      style={{ border: 0 }}
                      title={`Video for ${trackTitle}`}
                    />
                  ) : (
                    /* Invalid URL — fall back to cover art */
                    campaign.cover_art_url && (
                      <img src={campaign.cover_art_url} alt={`Cover art for ${trackTitle}`}
                        className="w-full h-full object-cover" />
                    )
                  );
                })()
              ) : campaign.cover_art_url ? (
                <>
                  <img src={campaign.cover_art_url} alt={`Cover art for ${trackTitle}`}
                    className="w-full h-full object-cover" />
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-deep-navy via-deep-navy/20 to-transparent" />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-green-500/10">
                  <Music2 size={64} className="text-white/10" />
                </div>
              )}

              {/* Floating stat badges */}
              {/* Artist badge — top left, only tag */}
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/[0.1]">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
                    {campaign.artist_avatar
                      ? <img src={campaign.artist_avatar} alt="" className="w-full h-full object-cover" />
                      : artistName[0]?.toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-white">{artistName}</span>
                </div>
              </div>

              {/* Title overlay */}
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-lg font-display"
                >
                  {trackTitle || displayTitle}
                </motion.h1>
                {displayTitle !== trackTitle && trackTitle && (
                  <p className="text-sm text-white/50 mt-1 max-w-md">{displayTitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Stats + CTAs */}
          <div className="md:w-[40%] px-5 py-6 md:py-8 md:flex md:flex-col md:justify-center md:border-l md:border-white/[0.06]">
            <div className="border-t border-white/06 mb-5 md:hidden" />

            {/* Unified stat bar — single source of truth */}
            <div className="flex flex-wrap items-center gap-5 px-1 py-2">
              {submissionCount > 0 && (
                <div>
                  <p className="text-2xl font-bold text-white"><AnimatedCounter value={submissionCount} /></p>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">submissions</p>
                </div>
              )}
              {views > 0 && (
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {views >= 1000000
                      ? `${(views / 1000000).toFixed(1)}M`
                      : views >= 1000
                      ? `${(views / 1000).toFixed(1)}K`
                      : views.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">verified views</p>
                </div>
              )}
              {budget > 0 && (
                <div>
                  <p className="text-2xl font-bold text-amber-400">${budget.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">campaign budget</p>
                </div>
              )}
              {spent > 0 && (
                <div>
                  <p className="text-2xl font-bold text-rose-400">${spent.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-medium">paid to creators</p>
                </div>
              )}
            </div>

            {/* Supporter grid (mobile) */}
            <div className="sm:hidden mt-3">
              {/* SupporterGrid removed */}
            </div>

            {/* Spacer */}
            <div className="flex-1 min-h-4" />

            {/* Earnings calculator */}
            <div className="mt-4">
              <EarningsCalculator cpmCents={campaign.cpm_rate_cents || 0} />
            </div>

            {/* Primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-5"
            >
              <button onClick={() => {
                fetch('/api/analytics/event', {
                  method: 'POST', headers: {'Content-Type':'application/json'},
                  body: JSON.stringify({ event: 'campaign_join_click', path: window.location.pathname, metadata: { campaign_id: id } }),
                }).catch(() => {});
                setJoinOpen(true);
              }}
                className="w-full py-4 text-base font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500
                  active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20">
                Submit Video - Earn ${(cpm * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/1M views
              </button>

              {/* Secondary: Support */}
              <Link href={`/checkout?type=donation&campaignId=${id}`}
                className="mt-3 w-full py-3.5 text-sm font-semibold rounded-xl border border-white/[0.12] bg-white/[0.02] text-muted-foreground
                  hover:text-white hover:bg-white/[0.05] hover:border-[#4338CA]/30 active:scale-[0.98] transition-all
                  flex items-center justify-center gap-2">
                <Heart size={16} className="text-[#4338CA]/60" />
                Support this campaign
              </Link>

              {/* Unclaimed CTA */}
              {isUnclaimed && claimCode && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <Link href={`/claim/${claimCode}`}
                    className="block w-full py-3 rounded-xl text-center font-bold text-sm bg-amber-500 text-black hover:bg-amber-400 transition-all active:scale-[0.98]">
                    Claim this campaign
                  </Link>
                  <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                    {artistName} hasn&apos;t claimed this yet. Submissions still work.
                  </p>
                </div>
              )}

              {/* Activity Timeline */}
              <ActivityTimeline campaign={campaign} />
              {/* Trust bar + actions */}
              <div className="mt-6 space-y-3">
                <TrustBar />
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={() => setShareOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors active:scale-95">
                    <Share2 size={14} /> Share
                  </button>
                  <button onClick={async () => {
                    try {
                      const auth = await fetch('/api/auth/me', { credentials: 'include' });
                      if (!auth.ok) { window.location.href = '/login'; return; }
                      const res = await fetch(`/api/campaigns/${campaign.id}/interest`, { method: 'POST', credentials: 'include' });
                      const d = await res.json();
                      setSaved(d.saved);
                    } catch {}
                  }}
                    className="flex items-center gap-1.5 text-xs transition-colors active:scale-95">
                    <Bookmark size={14} className={saved ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground hover:text-white'} />
                    <span className={saved ? 'text-amber-400' : 'text-muted-foreground hover:text-white'}>{saved ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>

              {/* View track page link */}
              {artistSlug && trackTitle && (
                <div className="mt-3">
                  <Link
                    href={`/artist/${artistSlug}/tracks/${trackTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}`}
                    className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink size={12} className="text-muted-foreground/50" />
                    View track page
                    <ChevronRight size={12} className="ml-auto" />
                  </Link>
                </div>
              )}

              {/* Artist link */}
              {artistSlug && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <ArtistCredibility campaign={campaign} artistSlug={artistSlug} />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* 3-STEP HOW IT WORKS */}
      {/* ════════════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-500/[0.04] to-transparent border border-indigo-500/10 p-5 md:p-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/[0.04] rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 relative z-10">
            <Sparkles size={14} className="text-indigo-400" />
            How to earn promoting this track
          </h3>
          <div className="grid md:grid-cols-3 gap-4 relative z-10">
            {[
              {
                step: 1,
                title: 'Find the audio',
                desc: 'Search for this track on TikTok, Instagram, or YouTube and use the official audio in your video.',
                icon: <Music2 size={20} />,
              },
              {
                step: 2,
                title: 'Create & post',
                desc: 'Record a vertical 15-60 second video. Be creative — engaging content earns more views, which earns more.',
                icon: <Film size={20} />,
              },
              {
                step: 3,
                title: 'Submit & earn',
                desc: `Submit your public video link. If approved, you earn ${(cpm * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} per 1M verified views — paid via Stripe.`,
                icon: <DollarSign size={20} />,
              },
            ].map((s, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                  {s.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Step {s.step}</span>
                  </div>
                  <p className="text-xs font-semibold">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* TABBED CONTENT */}
      {/* ════════════════════════════════════════════════════════ */}
      <main className="max-w-5xl mx-auto px-4 pb-32 md:pb-20 pt-8">
        <CampaignTabs
          campaign={campaign}
          listenLinks={listenLinks}
          count={submissionCount}
          submissions={submissions}
        />
      </main>

      {/* ════════════════════════════════════════════════════════ */}
      {/* FLOATING DESKTOP CTA BAR */}
      {/* ════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: scrollY > 400 ? 0 : 100, opacity: scrollY > 400 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="hidden md:flex fixed bottom-0 inset-x-0 z-40 bg-[#0F0F23]/95 backdrop-blur-lg border-t border-white/[0.06] px-4 py-3 items-center justify-center"
      >
        <button onClick={() => setJoinOpen(true)}
          className="px-6 py-3 text-sm font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20">
          Submit Video - Earn ${(cpm * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/1M views
        </button>
      </motion.div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* STICKY MOBILE BAR */}
      {/* ════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#0F0F23]/95 backdrop-blur-lg border-t border-white/[0.06] px-4 py-3"
      >
        <button onClick={() => setJoinOpen(true)}
          className="w-full py-3.5 text-sm font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20">
          Submit Video - Earn ${(cpm * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}/1M views
        </button>
      </motion.div>

      {/* MODALS */}
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
