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
import { Heart, Share2, Send, CheckCircle, Users, Eye, DollarSign, ChevronRight, X, Copy, Link2 } from 'lucide-react';

// ── Share Modal ───────────────────────────────────────────────
function ShareModal({ open, onClose, url, title }: { open: boolean; onClose: () => void; url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Support "${title}" on Selah.fm 🎵`;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  const nativeShare = async () => {
    if (navigator.share) { try { await navigator.share({ title, text, url }); return; } catch {} }
    copyLink();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#0D0D0D] border border-white/[0.08] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-lg">Share this campaign</h3><button onClick={onClose}><X size={20} className="text-muted-foreground" /></button></div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Link2 size={16} className="text-muted-foreground shrink-0" />
                <code className="text-xs text-muted-foreground truncate flex-1 select-all">{url}</code>
                <button onClick={copyLink} className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold active:scale-[0.97]">{copied ? 'Copied!' : 'Copy'}</button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { name: 'Messages', color: '#34C759', icon: '💬' },
                  { name: 'WhatsApp', color: '#25D366', icon: '📱' },
                  { name: 'Instagram', color: '#E1306C', icon: '📷' },
                  { name: 'X', color: '#000', icon: '𝕏' },
                  { name: 'Facebook', color: '#1877F2', icon: '📘' },
                  { name: 'Email', color: '#5B7FFF', icon: '✉️' },
                  { name: 'Copy Link', color: '#8C8C8C', icon: '🔗' },
                  { name: 'More', color: '#8C8C8C', icon: '⋯' },
                ].map(item => (
                  <button key={item.name} onClick={item.name === 'Copy Link' ? copyLink : nativeShare}
                    className="flex flex-col items-center gap-1.5 py-2 rounded-xl hover:bg-white/[0.04] transition-colors active:scale-[0.95]">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-[10px] text-muted-foreground">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Circular Progress ─────────────────────────────────────────
function CircleProgress({ pct, size = 120 }: { pct: number; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#5B7FFF" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function CampaignDetailClient({ id, initialCampaign }: { id: string; initialCampaign: any }) {
  const [campaign, setCampaign] = useState<any>(initialCampaign);
  const [loading, setLoading] = useState(!initialCampaign);
  const { addToast } = useToast();
  const [showSticky, setShowSticky] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Payment
  const [paymentModal, setPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [donationAmount, setDonationAmount] = useState(10);
  const [successOpen, setSuccessOpen] = useState(false);

  // Share
  const [shareOpen, setShareOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (initialCampaign) return;
    fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => {
      if (d.error) setCampaign(null); else setCampaign(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, initialCampaign]);

  useEffect(() => {
    const onScroll = () => { if (heroRef.current) setShowSticky(heroRef.current.getBoundingClientRect().bottom < 0); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleQuickDonate = async (amt: number) => {
    setDonationAmount(amt);
    try {
      const res = await fetch(`/api/campaigns/${id}/support`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amt }) });
      const data = await res.json();
      if (data.clientSecret) { setClientSecret(data.clientSecret); setPaymentModal(true); }
      else addToast(data.error || 'Could not start payment', 'error');
    } catch { addToast('Network error', 'error'); }
  };

  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';

  if (loading) return (<div className="min-h-screen" style={{ background: bg }}><Header /><main className="max-w-2xl mx-auto px-4 py-16"><Skeleton className="aspect-video rounded-2xl mb-4"/><Skeleton className="h-8 w-1/2 mb-2"/><Skeleton className="h-4 w-2/3"/></main></div>);
  if (!campaign) return (<div className="min-h-screen" style={{ background: bg }}><Header /><main className="max-w-2xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold mb-4">Campaign not found</h1><Link href="/browse"><Button>Browse</Button></Link></main></div>);

  const budget = campaign.total_budget_cents / 100;
  const remaining = campaign.budget_remaining_cents / 100;
  const spent = budget - remaining;
  const cpm = campaign.cpm_rate_cents / 100;
  const progress = budget > 0 ? (spent / budget) * 100 : 0;
  const donations = campaign.donations || { totalCents: 0, count: 0, supporters: [] };
  const totalRaised = donations.totalCents / 100;
  const views = parseInt(campaign.total_verified_views || '0');

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-4 md:py-8 pb-24">

        {/* ── HERO ───────────────────────────────────────────── */}
        <div ref={heroRef}>
          <CampaignCover src={campaign.cover_art_url} title={campaign.track_title} className="aspect-video rounded-2xl mb-6" />

          {/* Title + badges */}
          <div className="mb-6">
            <Badge variant="outline" className="border-primary/20 text-primary text-xs mb-2">{campaign.status === 'active' ? '🟢 Active' : '⏸ Paused'}</Badge>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{campaign.track_title}</h1>
            <p className="text-sm text-muted-foreground">${cpm.toFixed(2)} CPM · Creators earn per 1,000 verified views</p>
          </div>

          {/* Two primary CTA buttons */}
          <div className="flex gap-3 mb-8">
            <Button onClick={() => router.push(`/c/${id}/donate`)} className="flex-1 py-5 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-[0_0_24px_rgba(91,127,255,0.25)] active:scale-[0.97]">
              <Heart size={18} className="mr-2" /> Donate
            </Button>
            <Button onClick={() => setShareOpen(true)} variant="outline" className="flex-1 py-5 text-base font-semibold rounded-2xl active:scale-[0.97]">
              <Share2 size={18} className="mr-2" /> Share
            </Button>
          </div>

          {/* Quick donate amounts */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-1 -mx-4 px-4">
            {[10, 25, 50, 100, 250].map(amt => (
              <button key={amt} onClick={() => handleQuickDonate(amt)} className="shrink-0 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium hover:border-primary/30 hover:bg-primary/[0.04] transition-all active:scale-[0.95]">
                ${amt}
              </button>
            ))}
          </div>

          {/* Progress circle + stats */}
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <CircleProgress pct={progress} size={140} />
              <div className="flex-1 grid grid-cols-2 gap-4 text-center sm:text-left">
                {[
                  { value: `$${spent.toFixed(0)}`, label: 'Raised' },
                  { value: `$${budget.toFixed(0)}`, label: 'Goal' },
                  { value: donations.count, label: 'Supporters' },
                  { value: views >= 1000 ? `${(views/1000).toFixed(1)}K` : views, label: 'Views' },
                ].map(s => (
                  <div key={s.label}><div className="text-xl font-bold">{s.value}</div><div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div></div>
                ))}
              </div>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-1.5 mt-4" />
          </div>
        </div>

        {/* ── SUPPORTERS ─────────────────────────────────────── */}
        {donations.supporters.length > 0 && (
          <motion.div className="mb-8" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Users size={14} className="text-primary/60" />Supporters ({donations.count})</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {donations.supporters.map((s: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }}
                  className="shrink-0 w-44 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-4 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs font-bold text-primary">{s.donor_name?.[0]?.toUpperCase() || 'A'}</div>
                  <div><p className="text-sm font-semibold truncate">{s.donor_name || 'Anonymous'}</p><p className="text-lg font-bold text-primary">${(s.amount_cents/100).toFixed(0)}</p></div>
                  {s.message && <p className="text-[10px] text-muted-foreground italic line-clamp-2">&ldquo;{s.message}&rdquo;</p>}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── ABOUT / REQUIREMENTS ────────────────────────────── */}
        {campaign.requirements && (
          <motion.div className="mb-8" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
              <h3 className="font-semibold text-sm mb-3">Requirements</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{campaign.requirements}</p>
              {campaign.recommended_hashtags && (
                <p className="text-xs font-mono text-primary mt-3">{campaign.recommended_hashtags}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── ENDLESS SCROLL: More campaigns ─────────────────── */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">More campaigns</h3>
            <Link href="/browse" className="text-xs text-primary hover:underline flex items-center gap-1">See all <ChevronRight size={12} /></Link>
          </div>
          <RelatedCampaigns currentId={id} />
        </motion.div>
      </main>

      {/* ── STICKY CTA ────────────────────────────────────────── */}
      <AnimatePresence>
        {showSticky && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-white/[0.08] p-3">
            <div className="max-w-2xl mx-auto flex gap-3">
              <Button onClick={() => router.push(`/c/${id}/donate`)} className="flex-1 py-5 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 active:scale-[0.97]">
                <Heart size={16} className="mr-1.5" /> Donate
              </Button>
              <Button onClick={() => setShareOpen(true)} variant="outline" className="flex-[0.6] py-5 text-base font-semibold rounded-xl active:scale-[0.97]">
                <Share2 size={16} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SHARE MODAL ───────────────────────────────────────── */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={`https://selah.fm/c/${id}`} title={campaign.track_title} />

      {/* ── PAYMENT MODAL + CELEBRATION ───────────────────────── */}
      <StripePaymentModal open={paymentModal} onClose={() => setPaymentModal(false)} onSuccess={() => { setPaymentModal(false); setSuccessOpen(true); }} clientSecret={clientSecret} title={campaign.track_title} subtitle="Your donation goes directly to the campaign budget" coverArtUrl={campaign.cover_art_url} amount={donationAmount} mode="donation" />
      <PaymentSuccess open={successOpen} mode="donation" amount={donationAmount} campaignTitle={campaign.track_title} campaignId={id} onClose={() => setSuccessOpen(false)} />
    </div>
  );
}

// ── Related Campaigns ─────────────────────────────────────────
function RelatedCampaigns({ currentId }: { currentId: string }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/campaigns?limit=6').then(r => r.json()).then(d => {
      if (d.campaigns) setCampaigns(d.campaigns.filter((c: any) => c.id !== currentId));
    }).catch(() => {});
  }, [currentId]);

  if (campaigns.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
      {campaigns.map((c: any) => (
        <button key={c.id} onClick={() => router.push(`/c/${c.id}`)} className="shrink-0 w-36 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-primary/20 transition-all text-left">
          <div className="aspect-square bg-white/[0.02]">
            {c.cover_art_url && <img src={c.cover_art_url} alt="" className="w-full h-full object-cover" loading="lazy" />}
          </div>
          <div className="p-3">
            <p className="text-xs font-semibold truncate">{c.track_title}</p>
            <p className="text-[10px] text-muted-foreground">${(c.cpm_rate_cents/100).toFixed(0)} CPM</p>
          </div>
        </button>
      ))}
    </div>
  );
}
