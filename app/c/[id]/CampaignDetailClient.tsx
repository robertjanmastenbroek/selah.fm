'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import CampaignCover from '@/components/CampaignCover';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import StripePaymentModal from '@/components/StripePaymentModal';
import PaymentSuccess from '@/components/PaymentSuccess';
import SubmissionsFeed from '@/components/SubmissionsFeed';
import { Heart, Users, X, Link2, Play, Camera, Copy, Check, Music2 } from 'lucide-react';

// ── Sacred Gold accent ──────────────────────────────────────
const GOLD = '#C9A84C';

// ── Circle Progress ─────────────────────────────────────────
function CircleProgress({ pct, size = 100 }: { pct: number; size?: number }) {
  const stroke = 6, radius = (size - stroke) / 2, circumference = radius * 2 * Math.PI, offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Share Modal ─────────────────────────────────────────────
function ShareModal({ open, onClose, url, title }: { open: boolean; onClose: () => void; url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const shareText = encodeURIComponent(`Help promote "${title}" on Selah.fm! 🎵`);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const options = [
    { name: 'Copy Link', action: copyLink, icon: copied ? Check : Copy, color: '#5B7FFF', bg: 'bg-primary/10' },
    { name: 'WhatsApp', href: `https://wa.me/?text=${shareText}%20${encodedUrl}`, letter: 'WA', color: '#25D366', bg: 'bg-[#25D366]/10' },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${shareText}%20${encodedUrl}`, letter: '𝕏', color: '#fff', bg: 'bg-white/10' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, letter: 'f', color: '#1877F2', bg: 'bg-[#1877F2]/10' },
    { name: 'Messages', href: `sms:?body=${shareText}%20${encodedUrl}`, letter: 'SMS', color: '#34C759', bg: 'bg-[#34C759]/10' },
    { name: 'Email', href: `mailto:?subject=${encodeURIComponent(`Support "${title}" on Selah.fm`)}&body=${shareText}%20${encodedUrl}`, letter: '@', color: '#5B7FFF', bg: 'bg-primary/10' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#0D0D0D] border border-white/[0.08] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-white/20" /></div>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Share</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06]"><X size={20} className="text-muted-foreground" /></button>
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
                    <Comp key={opt.name} href={isAction ? undefined : opt.href} target={isAction ? undefined : '_blank'} rel={isAction ? undefined : 'noopener noreferrer'} onClick={isAction ? (e: any) => { e.preventDefault(); opt.action!(); } : undefined} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors active:scale-[0.95]">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${opt.bg}`} style={{ color: opt.color }}>{opt.icon ? <opt.icon size={18} /> : opt.letter}</div>
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

  const [paymentModal, setPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [donationAmount, setDonationAmount] = useState(25);
  const [successOpen, setSuccessOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const [showSubmit, setShowSubmit] = useState(false);
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitPlatform, setSubmitPlatform] = useState('tiktok');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialCampaign) return;
    fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => { if (d.error) setCampaign(null); else setCampaign(d); setLoading(false); }).catch(() => setLoading(false));
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

  const handleSubmitVideo = async () => {
    if (!submitUrl) return;
    if (!submitUrl.startsWith('https://')) { addToast('Please paste a valid HTTPS link from TikTok, Instagram, YouTube, or Facebook', 'error'); return; }
    setSubmitting(true);
    try {
      const r = await fetch('/api/submissions', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: id, contentUrl: submitUrl, platform: submitPlatform }) });
      if (r.ok) { addToast('Submitted! The artist will review your video.', 'success'); setShowSubmit(false); setSubmitUrl(''); }
      else { const e = await r.json(); addToast(e.error || 'Failed to submit', 'error'); }
    } catch { addToast('Network error', 'error'); }
    setSubmitting(false);
  };

  const handleDonate = async () => {
    try {
      const r = await fetch(`/api/campaigns/${id}/support`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: donationAmount }) });
      const d = await r.json();
      if (d.clientSecret) { setClientSecret(d.clientSecret); setPaymentModal(true); }
      else addToast(d.error || 'Could not start payment', 'error');
    } catch { addToast('Network error', 'error'); }
  };

  const bg = '#0A0A0A';

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
  const artistName = campaign.artist_name || 'Unknown Artist';

  const stickyBarVisible = scrollY > heroBottom - 80;

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header minimal />
      <main className="max-w-2xl mx-auto pb-24">

        {/* ══════ HERO (GoFundMe-style: artist top-left, title bottom overlay) ══════ */}
        <div ref={heroRef} className="relative">
          <CampaignCover
            src={campaign.cover_art_url}
            title={campaign.track_title}
            className="w-full h-[40vh] sm:h-[45vh] max-h-[500px] rounded-none"
          />
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30 pointer-events-none" />

          {/* Artist name + avatar — top left */}
          <div className="absolute top-3 left-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white border border-white/20 shrink-0">
              {artistName[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-white text-sm font-semibold drop-shadow-sm">{artistName}</span>
          </div>

          {/* Track title — bottom overlay with curved top */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0A0A0A] rounded-t-3xl px-5 pt-5 pb-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">
              {campaign.track_title}
            </h1>
          </div>
        </div>

        {/* ══════ HEADER CARD (progress + CTAs) ══════ */}
        <div className="px-4">
          <div className="bg-[#0A0A0A] px-5 pt-2 pb-5 rounded-b-2xl mb-4">

            {/* Progress + tiny CPM in stats row */}
            <div className="flex items-center gap-4 mb-5">
              <CircleProgress pct={progress} size={72} />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xl font-bold">${spent.toFixed(0)}</span>
                    <span className="text-xs text-muted-foreground ml-1.5">spent of</span>
                    <span className="text-sm font-semibold ml-1">${budget.toFixed(0)} budget</span>
                  </div>
                  <span className="text-xs font-semibold text-primary">{Math.round(progress)}%</span>
                </div>
                <Progress value={Math.min(progress, 100)} className="h-1.5" />
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Users size={10} /> {donations.count} donors</span>
                  <span className="flex items-center gap-1"><Camera size={10} /> {submissions} submissions</span>
                  <span className="flex items-center gap-1"><Play size={10} /> {views >= 1000 ? `${(views/1000).toFixed(1)}K` : views} views</span>
                  <span className="text-muted-foreground/50">${cpm.toFixed(2)}/1K views</span>
                </div>
              </div>
            </div>

            {/* ── CTAs ── */}
            {!showSubmit ? (
              <div className="space-y-2">
                {/* Two equal buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSubmit(true)}
                    className="flex-1 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground active:scale-[0.98] transition-all hover:shadow-[0_0_24px_rgba(91,127,255,0.3)]"
                  >
                    SUBMIT
                  </button>
                  <button
                    onClick={handleDonate}
                    className="flex-1 py-4 text-base font-bold rounded-xl active:scale-[0.98] transition-all"
                    style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD}CC)`, color: '#0A0A0A' }}
                  >
                    DONATE
                  </button>
                </div>
                {/* Share text button */}
                <button
                  onClick={() => setShareOpen(true)}
                  className="w-full py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-white/[0.03] active:scale-[0.98]"
                >
                  Share
                </button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-xl bg-white/[0.04] border border-primary/10 p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2"><Camera size={16} className="text-primary" />Submit your video</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'tiktok' as const, label: 'TikTok', bg: 'bg-[#ff005015]', text: 'text-[#ff0050]', letter: 'T' },
                    { id: 'instagram' as const, label: 'Reels', bg: 'bg-[#E1306C15]', text: 'text-[#E1306C]', letter: 'R' },
                    { id: 'youtube' as const, label: 'Shorts', bg: 'bg-[#FF000015]', text: 'text-[#FF0000]', letter: 'S' },
                  ].map(p => (
                    <button key={p.id} onClick={() => setSubmitPlatform(p.id)} className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${submitPlatform === p.id ? 'border-primary bg-primary/[0.06]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${p.bg}`}><span className={`text-[10px] font-bold ${p.text}`}>{p.letter}</span></div>
                      <span className="text-[10px] font-medium">{p.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={submitUrl} onChange={e => setSubmitUrl(e.target.value)} placeholder="Paste your video link..." className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30" autoFocus />
                  <Button onClick={handleSubmitVideo} disabled={!submitUrl || submitting} className="shrink-0 text-sm">{submitting ? '...' : 'Submit'}</Button>
                </div>
                <button onClick={() => setShowSubmit(false)} className="w-full text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              </motion.div>
            )}
          </div>
        </div>

        <div className="px-4 space-y-6">
          {/* ══════ CAMPAIGN STORY ══════ */}
          {campaign.requirements && (
            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Music2 size={14} className="text-primary/60" />About this campaign</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{campaign.requirements}</p>
                {campaign.recommended_hashtags && <p className="text-xs font-mono text-primary mt-3">{campaign.recommended_hashtags}</p>}
              </div>
            </motion.div>
          )}

          {/* ══════ DONATIONS ══════ */}
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5 mb-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Heart size={14} className="text-primary/60" />Donations</h3>
                <span className="text-xl font-bold text-primary">${totalRaised.toFixed(0)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center"><div className="text-lg font-bold">{donations.count}</div><div className="text-[10px] text-muted-foreground">Donors</div></div>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center"><div className="text-lg font-bold">{submissions}</div><div className="text-[10px] text-muted-foreground">Submissions</div></div>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center"><div className="text-lg font-bold">{views >= 1000 ? `${(views/1000).toFixed(1)}K` : views}</div><div className="text-[10px] text-muted-foreground">Views</div></div>
              </div>
            </div>

            {donations.supporters.length > 0 ? (
              <div className="space-y-0.5">
                {donations.supporters.map((s: any, i: number) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-3 py-3 px-1 border-b border-white/[0.04] last:border-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary shrink-0">{(s.donor_name || 'A')[0].toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold truncate">{s.donor_name || 'Anonymous'}</span><span className="text-sm font-bold text-primary shrink-0">${(s.amount_cents / 100).toFixed(0)}</span></div>
                      {s.message && <p className="text-[10px] text-muted-foreground italic mt-0.5 leading-relaxed">&ldquo;{s.message.slice(0, 80)}{s.message.length > 80 ? '...' : ''}&rdquo;</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{(() => { const d = new Date(s.created_at); const m = Math.floor((Date.now() - d.getTime()) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return d.toLocaleDateString(); })()}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-8 text-center">
                <Heart size={28} className="mx-auto mb-3 text-primary/10" />
                <p className="text-sm text-muted-foreground">No donations yet. Be the first to support!</p>
                <button onClick={handleDonate} className="mt-3 text-sm font-semibold text-primary hover:underline">Donate now</button>
              </div>
            )}
          </motion.div>

          {/* ══════ SUBMISSIONS ══════ */}
          {(submissions > 0 || parseInt(campaign.pending_submissions || '0') > 0) && (
            <SubmissionsFeed campaignId={id} count={submissions + parseInt(campaign.pending_submissions || '0')} />
          )}

          {/* ══════ MORE CAMPAIGNS — Infinite Scroll ══════ */}
          <div ref={moreRef}>
            <h3 className="font-semibold text-sm mb-3">More campaigns</h3>
            <InfiniteCampaigns currentId={id} />
          </div>

          {/* ══════ FOOTER ══════ */}
          <footer className="text-center pb-8 pt-2 space-y-3">
            <div className="flex items-center justify-center gap-4">
              <a href="https://instagram.com/selahfm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://x.com/selah_fm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@selah.fm" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
              </a>
            </div>
            <p className="text-xs text-muted-foreground/40">Selah.fm — The marketplace for music promotion</p>
          </footer>
        </div>
      </main>

      {/* ══════ STICKY BOTTOM BAR ══════ */}
      <AnimatePresence>
        {stickyBarVisible && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-3">
            <div className="max-w-2xl mx-auto flex gap-2">
              <button onClick={() => setShowSubmit(true)} className="flex-1 py-4 text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground active:scale-[0.97] transition-transform">SUBMIT</button>
              <button onClick={handleDonate} className="flex-1 py-4 text-sm font-bold rounded-xl active:scale-[0.97] transition-transform" style={{ background: `linear-gradient(135deg, ${GOLD}, ${GOLD}CC)`, color: '#0A0A0A' }}>DONATE</button>
              <button onClick={() => setShareOpen(true)} className="px-4 py-4 text-xs font-medium text-muted-foreground hover:text-foreground rounded-xl hover:bg-white/[0.04] active:scale-[0.97] transition-all">Share</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={`https://selah.fm/c/${id}`} title={campaign.track_title} />
      <StripePaymentModal open={paymentModal} onClose={() => setPaymentModal(false)} onSuccess={() => { setPaymentModal(false); setSuccessOpen(true); }} clientSecret={clientSecret} title={campaign.track_title} subtitle="Your donation goes directly to the campaign budget" coverArtUrl={campaign.cover_art_url} amount={donationAmount} mode="donation" />
      <PaymentSuccess open={successOpen} mode="donation" amount={donationAmount} campaignTitle={campaign.track_title} campaignId={id} onClose={() => setSuccessOpen(false)} />
    </div>
  );
}

// ── Infinite Scroll Campaigns ───────────────────────────────
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

  // Initial fetch
  useEffect(() => { fetchMore(); }, []);

  // Intersection observer for infinite scroll
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
          <button key={c.id} onClick={() => router.push(`/c/${c.id}`)} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-primary/20 transition-all text-left">
            <div className="aspect-square bg-white/[0.02]">{c.cover_art_url && <img src={c.cover_art_url} alt="" className="w-full h-full object-cover" loading="lazy" />}</div>
            <div className="p-3">
              <p className="text-xs font-semibold truncate">{c.track_title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{c.artist_name || 'Artist'}</p>
            </div>
          </button>
        ))}
      </div>
      <div ref={loaderRef} className="py-4 flex justify-center">
        {loading && hasMore && <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
      </div>
    </>
  );
}
