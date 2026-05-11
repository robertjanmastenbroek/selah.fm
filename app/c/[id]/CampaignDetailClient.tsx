'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import CampaignCover from '@/components/CampaignCover';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import StripePaymentModal from '@/components/StripePaymentModal';
import PaymentSuccess from '@/components/PaymentSuccess';
import SubmissionsFeed from '@/components/SubmissionsFeed';
import { Heart, Share2, Send, Users, ChevronRight, ChevronLeft, X, Link2, Play, Camera, Lock, Shield } from 'lucide-react';

// ── Circle Progress ─────────────────────────────────────────
function CircleProgress({ pct, size = 100 }: { pct: number; size?: number }) {
  const stroke = 6, radius = (size - stroke) / 2, circumference = radius * 2 * Math.PI, offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#5B7FFF" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Share Modal ───────────────────────────────────────────────
function ShareModal({ open, onClose, url, title, campaignId }: { open: boolean; onClose: () => void; url: string; title: string; campaignId: string }) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const shareText = `I just submitted a video for "${title}" on Selah.fm! 🎵 Check it out and submit your own:`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${shareText} ${url}`);
  const copyLink = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };

  const options = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodedText}`, icon: 'WA', color: '#25D366' },
    { name: 'Instagram', action: () => { copyLink(); window.open('https://instagram.com', '_blank'); }, icon: 'IG', color: '#E1306C' },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${encodedText}`, icon: 'X', color: '#fff' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: 'FB', color: '#1877F2' },
    { name: 'Messages', href: `sms:?body=${encodedText}`, icon: 'SMS', color: '#34C759' },
    { name: 'Email', href: `mailto:?subject=${encodeURIComponent(`Support "${title}" on Selah.fm`)}&body=${encodedText}`, icon: '@', color: '#5B7FFF' },
    { name: 'Copy Link', action: copyLink, icon: '🔗', color: '#8C8C8C' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#0D0D0D] border border-white/[0.08] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-lg">Share this campaign</h3><button onClick={onClose}><X size={20} className="text-muted-foreground" /></button></div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Link2 size={16} className="text-muted-foreground shrink-0" />
                <code className="text-xs text-muted-foreground truncate flex-1 select-all">{url}</code>
                <button onClick={copyLink} className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold active:scale-[0.97]">{copied ? 'Copied!' : 'Copy'}</button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {options.map(opt => (
                  <a key={opt.name} href={opt.href || '#'} target={opt.href ? '_blank' : undefined} rel={opt.href ? 'noopener noreferrer' : undefined}
                    onClick={opt.action ? (e: any) => { e.preventDefault(); opt.action!(); } : undefined}
                    className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors active:scale-[0.95] no-underline">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: opt.color + '20', color: opt.color }}>{opt.icon}</div>
                    <span className="text-[10px] text-muted-foreground">{opt.name}</span>
                  </a>
                ))}
              </div>
              <button onClick={() => { onClose(); router.push(`/c/${campaignId}`); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold active:scale-[0.97]">
                <Camera size={14} className="inline mr-1.5" /> Create a video for this track
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function CampaignDetailClient({ id, initialCampaign }: { id: string; initialCampaign: any }) {
  const [campaign, setCampaign] = useState<any>(initialCampaign);
  const [loading, setLoading] = useState(!initialCampaign);
  const { addToast } = useToast();
  const router = useRouter();

  // Scroll tracking
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const donationsRef = useRef<HTMLDivElement>(null);
  const [heroHeight, setHeroHeight] = useState(0);

  // Payment
  const [paymentModal, setPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [donationAmount, setDonationAmount] = useState(25);
  const [successOpen, setSuccessOpen] = useState(false);

  // Share
  const [shareOpen, setShareOpen] = useState(false);

  // Submit
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
    if (heroRef.current) setHeroHeight(heroRef.current.offsetHeight);
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

  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';

  if (loading) return (<div className="min-h-screen" style={{ background: bg }}><Header /><main className="max-w-2xl mx-auto px-4 py-16"><Skeleton className="aspect-video rounded-2xl mb-4"/><Skeleton className="h-8 w-1/2"/></main></div>);
  if (!campaign) return (<div className="min-h-screen" style={{ background: bg }}><Header /><main className="max-w-2xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold mb-4">Campaign not found</h1><Link href="/browse"><Button>Browse</Button></Link></main></div>);

  const budget = campaign.total_budget_cents / 100, remaining = campaign.budget_remaining_cents / 100, spent = budget - remaining;
  const cpm = campaign.cpm_rate_cents / 100, progress = budget > 0 ? (spent / budget) * 100 : 0;
  const donations = campaign.donations || { totalCents: 0, count: 0, supporters: [] };
  const views = parseInt(campaign.total_verified_views || '0'), submissions = parseInt(campaign.approved_submissions || '0');
  const totalRaised = donations.totalCents / 100;

  // Show sticky bar only AFTER hero is scrolled past, and hide BEFORE donations section
  const showStickyBar = scrollY > heroHeight - 60 && scrollY < (donationsRef.current ? donationsRef.current.offsetTop - 100 : Infinity);
  // Show bottom sticky CTA only when scrolled past donations
  const showBottomCTA = scrollY > (donationsRef.current ? donationsRef.current.offsetTop + 200 : Infinity);

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-4 pb-24">

        {/* ── HERO: Above the fold ─────────────────────────────── */}
        <div ref={heroRef} className="mb-6">
          {/* Campaign title */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1">{campaign.track_title}</h1>
            <p className="text-sm text-muted-foreground">${cpm.toFixed(2)} per 1,000 verified views</p>
          </div>

          {/* Cover image */}
          <CampaignCover src={campaign.cover_art_url} title={campaign.track_title} className="aspect-video rounded-2xl mb-6" />

          {/* Circle progress + Raised/Goal */}
          <div className="flex items-center gap-5 mb-5">
            <CircleProgress pct={progress} size={80} />
            <div className="flex-1 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xl font-bold">${spent.toFixed(0)}</span>
                  <span className="text-xs text-muted-foreground ml-1">raised of</span>
                  <span className="text-sm font-semibold ml-1">${budget.toFixed(0)}</span>
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-1.5" />
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Users size={10} /> {donations.count} donors</span>
                <span className="flex items-center gap-1"><Camera size={10} /> {submissions} submissions</span>
                <span className="flex items-center gap-1"><Play size={10} /> {views >= 1000 ? `${(views/1000).toFixed(1)}K` : views} views</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons — Submit Video + Donate */}
          <div className="space-y-2 mb-4">
            {!showSubmit ? (
              <Button onClick={() => setShowSubmit(true)} className="w-full py-5 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-[0_0_24px_rgba(91,127,255,0.25)] active:scale-[0.97]">
                <Send size={18} className="mr-2" /> Submit Video — Earn ${(cpm * 0.8).toFixed(2)}/1K views
              </Button>
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
            <div className="flex gap-2">
              <Button onClick={handleDonate} variant="outline" className="flex-1 py-4 text-sm font-semibold rounded-xl active:scale-[0.97]">
                <Heart size={16} className="mr-1.5" /> Donate
              </Button>
              <Button onClick={() => setShareOpen(true)} variant="outline" className="py-4 px-4 text-sm font-semibold rounded-xl active:scale-[0.97]">
                <Share2 size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* ── CAMPAIGN STORY / REQUIREMENTS ─────────────────────── */}
        {campaign.requirements && (
          <motion.div className="mb-6" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
              <h3 className="font-semibold text-sm mb-3">About this campaign</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{campaign.requirements}</p>
              {campaign.recommended_hashtags && <p className="text-xs font-mono text-primary mt-3">{campaign.recommended_hashtags}</p>}
            </div>
          </motion.div>
        )}

        {/* ── DONATIONS SECTION ─────────────────────────────────── */}
        <div ref={donationsRef} className="mb-6">
          {/* Donation stats */}
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Users size={14} className="text-primary/60" />Donations</h3>
              <span className="text-xl font-bold text-primary">${totalRaised.toFixed(0)}</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center">
                <div className="text-lg font-bold">{donations.count}</div>
                <div className="text-[10px] text-muted-foreground">Donors</div>
              </div>
              <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center">
                <div className="text-lg font-bold">{submissions}</div>
                <div className="text-[10px] text-muted-foreground">Submissions</div>
              </div>
              <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center">
                <div className="text-lg font-bold">{views >= 1000 ? `${(views/1000).toFixed(1)}K` : views}</div>
                <div className="text-[10px] text-muted-foreground">Views</div>
              </div>
            </div>
          </div>

          {/* Donors list */}
          {donations.supporters.length > 0 ? (
            <div className="space-y-1">
              {donations.supporters.map((s: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 py-3 px-1 border-b border-white/[0.04] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                    {(s.donor_name || 'A')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold truncate">{s.donor_name || 'Anonymous'}</span>
                      <span className="text-sm font-bold text-primary shrink-0">${(s.amount_cents / 100).toFixed(0)}</span>
                    </div>
                    {s.message && <p className="text-[10px] text-muted-foreground italic mt-0.5">&ldquo;{s.message.slice(0, 80)}{s.message.length > 80 ? '...' : ''}&rdquo;</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {(() => { const d = new Date(s.created_at); const m = Math.floor((Date.now() - d.getTime()) / 60000); if (m < 1) return 'just now'; if (m < 60) return `${m}m ago`; const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`; return d.toLocaleDateString(); })()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6 text-center">
              <Heart size={24} className="mx-auto mb-2 text-primary/20" />
              <p className="text-sm text-muted-foreground">No donations yet. Be the first!</p>
            </div>
          )}
        </div>

        {/* ── SUBMISSIONS FEED ──────────────────────────────────── */}
        {(submissions > 0 || parseInt(campaign.pending_submissions || '0') > 0) && (
          <SubmissionsFeed campaignId={id} count={submissions + parseInt(campaign.pending_submissions || '0')} />
        )}

        {/* ── More campaigns ────────────────────────────────────── */}
        <motion.div className="mb-6" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">More campaigns</h3>
            <Link href="/browse" className="text-xs text-primary hover:underline flex items-center gap-1">See all <ChevronRight size={12} /></Link>
          </div>
          <RelatedCampaigns currentId={id} />
        </motion.div>

      </main>

      {/* ── STICKY BAR (hero scrolled past, before donations) ───── */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div initial={{ y: -80 }} animate={{ y: 0 }} exit={{ y: -80 }} className="fixed top-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-white/[0.08]">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
              <CircleProgress pct={progress} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1 text-sm">
                  <span className="font-bold">${spent.toFixed(0)}</span>
                  <span className="text-muted-foreground text-xs">of ${budget.toFixed(0)}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">{donations.count} donors · {submissions} submissions</div>
              </div>
              <Button onClick={() => setShowSubmit(true)} size="sm" className="shrink-0">
                <Send size={14} className="mr-1" /> Submit
              </Button>
              <Button onClick={handleDonate} variant="outline" size="sm" className="shrink-0">
                <Heart size={14} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM STICKY CTA (scrolled past donations) ─────────── */}
      <AnimatePresence>
        {showBottomCTA && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-white/[0.08] p-3">
            <div className="max-w-2xl mx-auto flex gap-2">
              <p className="text-xs text-muted-foreground hidden sm:flex items-center shrink-0">{submissions} videos · ${spent.toFixed(0)} raised</p>
              <Button onClick={() => setShowSubmit(true)} className="flex-1 py-4 text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 active:scale-[0.97]">
                <Send size={16} className="mr-1.5" /> Submit Video
              </Button>
              <Button onClick={handleDonate} variant="outline" className="flex-[0.5] py-4 text-sm font-semibold rounded-xl active:scale-[0.97]">
                <Heart size={16} />
              </Button>
              <Button onClick={() => setShareOpen(true)} variant="outline" className="flex-[0.5] py-4 text-sm font-semibold rounded-xl active:scale-[0.97]">
                <Share2 size={16} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODALS ──────────────────────────────────────────────── */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={`https://selah.fm/c/${id}`} title={campaign.track_title} campaignId={id} />
      <StripePaymentModal open={paymentModal} onClose={() => setPaymentModal(false)} onSuccess={() => { setPaymentModal(false); setSuccessOpen(true); }} clientSecret={clientSecret} title={campaign.track_title} subtitle="Your donation goes directly to the campaign budget" coverArtUrl={campaign.cover_art_url} amount={donationAmount} mode="donation" />
      <PaymentSuccess open={successOpen} mode="donation" amount={donationAmount} campaignTitle={campaign.track_title} campaignId={id} onClose={() => setSuccessOpen(false)} />
    </div>
  );
}

// ── Related Campaigns ─────────────────────────────────────────
function RelatedCampaigns({ currentId }: { currentId: string }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const router = useRouter();
  useEffect(() => { fetch('/api/campaigns?limit=6').then(r => r.json()).then(d => { if (d.campaigns) setCampaigns(d.campaigns.filter((c: any) => c.id !== currentId)); }).catch(() => {}); }, [currentId]);
  if (campaigns.length === 0) return null;
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
      {campaigns.map((c: any) => (
        <button key={c.id} onClick={() => router.push(`/c/${c.id}`)} className="shrink-0 w-36 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-primary/20 transition-all text-left">
          <div className="aspect-square bg-white/[0.02]">{c.cover_art_url && <img src={c.cover_art_url} alt="" className="w-full h-full object-cover" loading="lazy" />}</div>
          <div className="p-3"><p className="text-xs font-semibold truncate">{c.track_title}</p><p className="text-[10px] text-muted-foreground">${(c.cpm_rate_cents/100).toFixed(0)} CPM</p></div>
        </button>
      ))}
    </div>
  );
}
