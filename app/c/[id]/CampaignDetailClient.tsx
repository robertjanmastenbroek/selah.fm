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
import { Heart, Share2, Send, Users, ChevronRight, ChevronLeft, X, Link2, Play, Camera } from 'lucide-react';
import SubmissionsFeed from '@/components/SubmissionsFeed';

// ── Share Modal ───────────────────────────────────────────────
function ShareModal({ open, onClose, url, title, campaignId }: { open: boolean; onClose: () => void; url: string; title: string; campaignId: string }) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const shareText = `I just submitted a video for "${title}" on Selah.fm! 🎵 Check it out and submit your own:`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(`${shareText} ${url}`);

  const copyLink = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {} };

  const shareOptions = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${encodedText}`, icon: WhatsAppIcon, color: '#25D366' },
    { name: 'Instagram', action: () => { copyLink(); window.open('https://instagram.com', '_blank'); }, icon: InstagramIcon, color: '#E1306C' },
    { name: 'X', href: `https://twitter.com/intent/tweet?text=${encodedText}`, icon: XIcon, color: '#000000' },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: FacebookIcon, color: '#1877F2' },
    { name: 'Messages', href: `sms:?body=${encodedText}`, icon: MessagesIcon, color: '#34C759' },
    { name: 'Email', href: `mailto:?subject=${encodeURIComponent(`Support "${title}" on Selah.fm`)}&body=${encodedText}`, icon: EmailIcon, color: '#5B7FFF' },
    { name: 'Copy Link', action: copyLink, icon: CopyLinkIcon, color: '#8C8C8C' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} className="relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#0D0D0D] border border-white/[0.08] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Share this campaign</h3>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.04]"><X size={20} className="text-muted-foreground" /></button>
              </div>

              {/* URL display + Copy */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <Link2 size={16} className="text-muted-foreground shrink-0" />
                <code className="text-xs text-muted-foreground truncate flex-1 select-all">{url}</code>
                <button onClick={copyLink} className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold active:scale-[0.97]">{copied ? 'Copied!' : 'Copy'}</button>
              </div>

              {/* Share buttons grid */}
              <div className="grid grid-cols-4 gap-3">
                {shareOptions.map(opt => {
                  const IconComponent = opt.icon;
                  return (
                    <a
                      key={opt.name}
                      href={opt.href || '#'}
                      target={opt.href ? '_blank' : undefined}
                      rel={opt.href ? 'noopener noreferrer' : undefined}
                      onClick={opt.action ? (e: any) => { e.preventDefault(); opt.action!(); } : undefined}
                      className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors active:scale-[0.95] no-underline"
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: opt.color + '15' }}>
                        <IconComponent />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{opt.name}</span>
                    </a>
                  );
                })}
              </div>

              {/* Create Video CTA */}
              <button onClick={() => { onClose(); router.push(`/c/${campaignId}`); }} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold active:scale-[0.97] hover:shadow-[0_0_20px_rgba(91,127,255,0.2)]">
                <Camera size={14} className="inline mr-1.5" /> Create a video for this track
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Platform SVG Icons ────────────────────────────────────────
function WhatsAppIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>; }
function InstagramIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>; }
function XIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }
function FacebookIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>; }
function MessagesIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>; }
function EmailIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B7FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>; }
function CopyLinkIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8C8C8C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }

// ── Circle Progress ─────────────────────────────────────────
function CircleProgress({ pct, size = 120 }: { pct: number; size?: number }) {
  const stroke = 8, radius = (size - stroke) / 2, circumference = radius * 2 * Math.PI, offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90"><circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} /><motion.circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#5B7FFF" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }} /></svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-bold">{Math.round(pct)}%</span></div>
    </div>
  );
}

// ── Media Carousel ───────────────────────────────────────────
function MediaCarousel({ coverUrl, videoUrl, trackTitle }: { coverUrl: string; videoUrl?: string; trackTitle: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState({ start: true, end: false, active: 0 });
  const check = () => { const e = scrollRef.current; if (!e) return; setAt({ start: e.scrollLeft < 10, end: e.scrollLeft + e.clientWidth >= e.scrollWidth - 10, active: Math.round(e.scrollLeft / e.clientWidth) }); };
  const scroll = (d: number) => scrollRef.current?.scrollBy({ left: d * 320, behavior: 'smooth' });

  const slides = [
    { t: 'cover', e: <CampaignCover src={coverUrl} title={trackTitle} className="w-full h-full rounded-2xl" /> },
    ...(videoUrl ? [{ t: 'video', e: <div className="w-full h-full rounded-2xl bg-black/40 flex items-center justify-center"><Play size={48} className="text-white/20" /></div> }] : []),
    { t: 'ig', e: <div className="w-full h-full rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-[#E1306C]/[0.06] border-2 border-[#E1306C]/10"><span className="text-3xl mb-2">📱</span><span className="text-sm font-semibold">Share on Instagram</span><span className="text-xs text-muted-foreground mt-1">Post to Stories</span><span className="mt-3 px-3 py-1 rounded-full bg-white/[0.06] text-[10px] font-medium">{trackTitle}</span></div> },
    { t: 'tt', e: <div className="w-full h-full rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-[#ff0050]/[0.06] border-2 border-[#ff0050]/10"><span className="text-3xl mb-2">🎵</span><span className="text-sm font-semibold">Share on TikTok</span><span className="text-xs text-muted-foreground mt-1">Use this sound</span><span className="mt-3 px-3 py-1 rounded-full bg-white/[0.06] text-[10px] font-medium">{trackTitle}</span></div> },
  ];

  return (
    <div className="relative group">
      {!at.start && <button onClick={() => scroll(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white/80 hover:text-white"><ChevronLeft size={18} /></button>}
      {!at.end && <button onClick={() => scroll(1)} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white/80 hover:text-white"><ChevronRight size={18} /></button>}
      <div ref={scrollRef} onScroll={check} className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none rounded-2xl" style={{ scrollSnapType: 'x mandatory' }}>
        {slides.map((s, i) => <div key={i} className="shrink-0 w-full aspect-video snap-center">{s.e}</div>)}
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-3">{slides.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === at.active ? 'bg-primary' : 'bg-white/[0.12]'}`} />)}</div>
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
  const router = useRouter();
  const [paymentModal, setPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [donationAmount, setDonationAmount] = useState(25);
  const [successOpen, setSuccessOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitPlatform, setSubmitPlatform] = useState('tiktok');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (initialCampaign) return; fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => { if (d.error) setCampaign(null); else setCampaign(d); setLoading(false); }).catch(() => setLoading(false)); }, [id, initialCampaign]);
  useEffect(() => { const f = () => { if (heroRef.current) setShowSticky(heroRef.current.getBoundingClientRect().bottom < 0); }; window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);

  const handleSubmit = async () => {
    if (!submitUrl) return;
    
    // Client-side pre-validation
    if (!submitUrl.startsWith('https://')) {
      addToast('Please paste a valid HTTPS link from TikTok, Instagram, YouTube, or Facebook', 'error');
      return;
    }

    setSubmitting(true); try { const r = await fetch('/api/submissions', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: id, contentUrl: submitUrl, platform: submitPlatform }) }); if (r.ok) { addToast('Submitted!', 'success'); setShowSubmit(false); setSubmitUrl(''); } else { const e = await r.json(); addToast(e.error || 'Failed', 'error'); } } catch { addToast('Network error', 'error'); } setSubmitting(false); };

  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';
  if (loading) return (<div className="min-h-screen" style={{ background: bg }}><Header /><main className="max-w-2xl mx-auto px-4 py-16"><Skeleton className="aspect-video rounded-2xl mb-4"/><Skeleton className="h-8 w-1/2"/></main></div>);
  if (!campaign) return (<div className="min-h-screen" style={{ background: bg }}><Header /><main className="max-w-2xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold mb-4">Campaign not found</h1><Link href="/browse"><Button>Browse</Button></Link></main></div>);

  const budget = campaign.total_budget_cents / 100, remaining = campaign.budget_remaining_cents / 100, spent = budget - remaining;
  const cpm = campaign.cpm_rate_cents / 100, progress = budget > 0 ? (spent / budget) * 100 : 0;
  const donations = campaign.donations || { totalCents: 0, count: 0, supporters: [] };
  const views = parseInt(campaign.total_verified_views || '0'), submissions = parseInt(campaign.approved_submissions || '0');

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-4 md:py-8 pb-24">

        {/* ── HERO: Two-column on desktop ──────────────────────── */}
        <div ref={heroRef} className="md:grid md:grid-cols-[1fr_360px] md:gap-8 mb-8">
          
          {/* LEFT: Content */}
          <div className="min-w-0">
            {/* Big title */}
            <div className="mb-5">
              <Badge variant="outline" className="border-primary/20 text-primary text-xs mb-3">{campaign.status === 'active' ? '🟢 Active campaign' : '⏸ Paused'}</Badge>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{campaign.track_title}</h1>
              <p className="text-sm text-muted-foreground">${cpm.toFixed(2)} per 1,000 verified views · Creators earn 80%</p>
            </div>

            {/* Media carousel */}
            <MediaCarousel coverUrl={campaign.cover_art_url} videoUrl={campaign.content_assets_url || campaign.track_url} trackTitle={campaign.track_title} />

            {/* Primary CTA: Submit Video */}
            <div className="mt-6 space-y-3">
              {!showSubmit ? (
                <Button onClick={() => setShowSubmit(true)} className="w-full py-6 text-base font-bold rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-[0_0_30px_rgba(91,127,255,0.25)] active:scale-[0.97]">
                  <Send size={20} className="mr-2" /> Submit Your Video — Earn ${(cpm * 0.8).toFixed(2)}/1K views
                </Button>
              ) : (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-2xl bg-white/[0.04] border border-primary/10 p-5 space-y-4">
                  <p className="text-sm font-semibold flex items-center gap-2"><Camera size={16} className="text-primary" />Submit your video</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ id: 'tiktok', label: 'TikTok', color: '#ff0050' }, { id: 'instagram', label: 'Reels', color: '#E1306C' }, { id: 'youtube', label: 'Shorts', color: '#FF0000' }].map(p => (
                      <button key={p.id} onClick={() => setSubmitPlatform(p.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${submitPlatform === p.id ? 'border-primary bg-primary/[0.06]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: p.color + '15' }}><span style={{ color: p.color, fontSize: 12 }}>{p.label[0]}</span></div>
                        <span className="text-[10px] font-medium">{p.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={submitUrl} onChange={e => setSubmitUrl(e.target.value)} placeholder="Paste your video link..." className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30" autoFocus />
                    <Button onClick={handleSubmit} disabled={!submitUrl || submitting} className="shrink-0">{submitting ? '...' : 'Submit'}</Button>
                  </div>
                  <button onClick={() => setShowSubmit(false)} className="w-full text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                </motion.div>
              )}
              <div className="flex gap-2">
                <Button onClick={() => router.push(`/c/${id}/donate`)} variant="outline" className="flex-1 py-4 text-sm font-semibold rounded-xl active:scale-[0.97]"><Heart size={16} className="mr-1.5" /> Donate</Button>
                <Button onClick={() => setShareOpen(true)} variant="outline" className="flex-1 py-4 text-sm font-semibold rounded-xl active:scale-[0.97]"><Share2 size={16} className="mr-1.5" /> Share</Button>
              </div>
            </div>
          </div>

          {/* RIGHT: Stats sidebar (desktop) */}
          <div className="mt-6 md:mt-0 md:sticky md:top-8 md:self-start space-y-4">
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
              <CircleProgress pct={progress} size={160} />
              <div className="grid grid-cols-2 gap-3 mt-5">
                {[{ value: `$${spent.toFixed(0)}`, label: 'Spent' }, { value: `$${budget.toFixed(0)}`, label: 'Budget' }, { value: donations.count, label: 'Supporters' }, { value: views >= 1000 ? `${(views/1000).toFixed(1)}K` : views, label: 'Views' }].map(s => (
                  <div key={s.label} className="text-center"><div className="text-xl font-bold">{s.value}</div><div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div></div>
                ))}
              </div>
              <Progress value={Math.min(progress, 100)} className="h-1.5 mt-4" />
              <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
                <span>{submissions} submissions</span>
                <button onClick={() => setShareOpen(true)} className="text-primary hover:underline flex items-center gap-1"><Share2 size={10} /> Share</button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5 space-y-3">
              {[
                { icon: <Camera size={14} className="text-primary/60" />, text: 'Every submission reviewed by the artist' },
                { icon: <Send size={14} className="text-primary/60" />, text: 'Only verified views count toward earnings' },
                { icon: <Users size={14} className="text-primary/60" />, text: '80% of CPM goes to creators' },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">{item.icon}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Requirements */}
        {campaign.requirements && (
          <motion.div className="mb-8" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
              <h3 className="font-semibold text-sm mb-3">What the artist wants</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{campaign.requirements}</p>
              {campaign.recommended_hashtags && <p className="text-xs font-mono text-primary mt-3">{campaign.recommended_hashtags}</p>}
            </div>
          </motion.div>
        )}

        {/* Recent support */}
        {donations.supporters.length > 0 && (
          <motion.div className="mb-10" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
              <Users size={14} className="text-primary/60" />Recent support ({donations.count})
            </h3>
            <div className="space-y-2">
              {donations.supporters.slice(0, 5).map((s: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{(s.donor_name || 'A')[0].toUpperCase()}</div>
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2"><span className="text-xs font-semibold truncate">{s.donor_name || 'Anonymous'}</span><span className="text-xs font-bold text-primary shrink-0">${(s.amount_cents / 100).toFixed(0)}</span></div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Submissions Feed — social proof */}
        {(submissions > 0 || parseInt(campaign.pending_submissions || '0') > 0) && (
          <SubmissionsFeed campaignId={id} count={submissions + parseInt(campaign.pending_submissions || '0')} />
        )}

        {/* Trust Footer — three-column security */}
        <motion.div className="mb-10" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
            <h3 className="font-semibold text-sm mb-5 text-center">Why creators love Selah.fm</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: <Camera size={20} className="text-primary/70" />, title: 'Create & Earn', desc: 'Pick a track, make a video, submit the link. Done in 30 seconds.' },
                { icon: <Send size={20} className="text-primary/70" />, title: 'Transparent', desc: 'Artists review every submission before paying. Only verified views count.' },
                { icon: <Users size={20} className="text-primary/70" />, title: 'Protected', desc: 'Built on Stripe. 80% of CPM goes to you. No hidden fees.' },
              ].map((item) => (
                <div key={item.title} className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary/[0.08] flex items-center justify-center mx-auto">{item.icon}</div>
                  <h4 className="text-sm font-semibold">{item.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* More campaigns */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-sm">More campaigns</h3><Link href="/browse" className="text-xs text-primary hover:underline flex items-center gap-1">See all <ChevronRight size={12} /></Link></div>
          <RelatedCampaigns currentId={id} />
        </motion.div>
      </main>

      {/* Sticky CTA */}
      <AnimatePresence>
        {showSticky && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-white/[0.08] p-3">
            <div className="max-w-5xl mx-auto flex items-center gap-3">
              {/* Campaign status text */}
              <p className="text-xs text-muted-foreground hidden sm:block shrink-0">
                {submissions} videos · ${spent.toFixed(0)} raised{progress > 0 ? ` · ${Math.round(progress)}%` : ''}
              </p>
              <div className="flex gap-2 flex-1">
                <Button onClick={() => setShowSubmit(true)} className="flex-1 py-4 text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 active:scale-[0.97]"><Send size={16} className="mr-1.5" />Submit Video</Button>
                <Button onClick={() => router.push(`/c/${id}/donate`)} variant="outline" className="flex-[0.5] py-4 text-sm font-semibold rounded-xl active:scale-[0.97]"><Heart size={16} /></Button>
                <Button onClick={() => setShareOpen(true)} variant="outline" className="flex-[0.5] py-4 text-sm font-semibold rounded-xl active:scale-[0.97]"><Share2 size={16} /></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={`https://selah.fm/c/${id}`} title={campaign.track_title} campaignId={id} />
      <StripePaymentModal open={paymentModal} onClose={() => setPaymentModal(false)} onSuccess={() => { setPaymentModal(false); setSuccessOpen(true); }} clientSecret={clientSecret} title={campaign.track_title} subtitle="Your donation goes directly to the campaign budget" coverArtUrl={campaign.cover_art_url} amount={donationAmount} mode="donation" />
      <PaymentSuccess open={successOpen} mode="donation" amount={donationAmount} campaignTitle={campaign.track_title} campaignId={id} onClose={() => setSuccessOpen(false)} />
    </div>
  );
}

function RelatedCampaigns({ currentId }: { currentId: string }) {
  const [campaigns, setCampaigns] = useState<any[]>([]); const router = useRouter();
  useEffect(() => { fetch('/api/campaigns?limit=6').then(r => r.json()).then(d => { if (d.campaigns) setCampaigns(d.campaigns.filter((c: any) => c.id !== currentId)); }).catch(() => {}); }, [currentId]);
  if (campaigns.length === 0) return null;
  return (<div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">{campaigns.map((c: any) => (<button key={c.id} onClick={() => router.push(`/c/${c.id}`)} className="shrink-0 w-36 rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-primary/20 transition-all text-left"><div className="aspect-square bg-white/[0.02]">{c.cover_art_url && <img src={c.cover_art_url} alt="" className="w-full h-full object-cover" loading="lazy" />}</div><div className="p-3"><p className="text-xs font-semibold truncate">{c.track_title}</p><p className="text-[10px] text-muted-foreground">${(c.cpm_rate_cents/100).toFixed(0)} CPM</p></div></button>))}</div>);
}
