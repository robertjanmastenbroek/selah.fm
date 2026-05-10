'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import CampaignCover from '@/components/CampaignCover';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformBadge, Spotify } from '@/components/SocialIcons';
import { Eye, DollarSign, Users, ArrowRight, ArrowLeft, Shield, Zap, CheckCircle, Clock, Star, Send, Music, TrendingUp } from 'lucide-react';
import { trackSubmitContent } from '@/lib/analytics';

export default function CampaignDetailClient({ id }: { id: string }) {
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitPlatform, setSubmitPlatform] = useState('tiktok');
  const [viewEstimate, setViewEstimate] = useState(10000);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => {
      if (d.error) { setCampaign(null); } else { setCampaign(d); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // Sticky CTA detection
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setShowStickyCTA(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = async () => {
    if (!submitUrl) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id, contentUrl: submitUrl, platform: submitPlatform }),
      });
      if (res.ok) {
        trackSubmitContent(submitPlatform);
        addToast('Submitted! The artist will review your video.', 'success');
        setJoined(true);
        setSubmitUrl('');
      } else {
        const err = await res.json();
        addToast(err.error || "Couldn't submit. Try again.", 'error');
      }
    } catch { addToast('Network error — try again', 'error'); }
    setSubmitting(false);
  };

  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';

  if (loading) return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-16 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="aspect-video rounded-2xl" />
          <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-20 w-full" /><Skeleton className="h-12 w-full" /></div>
        </div>
      </main>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
        <p className="text-muted-foreground text-sm mb-6">This campaign may have been removed or the link is incorrect.</p>
        <Link href="/browse"><Button>Browse campaigns</Button></Link>
      </main>
    </div>
  );

  const budget = campaign.total_budget_cents / 100;
  const remaining = campaign.budget_remaining_cents / 100;
  const spent = budget - remaining;
  const cpm = campaign.cpm_rate_cents / 100;
  const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const submissions = parseInt(campaign.approved_submissions || '0');
  const views = parseInt(campaign.total_verified_views || '0');
  const estimatedEarnings = ((viewEstimate / 1000) * cpm * 0.8).toFixed(2);

  // Extract Spotify track ID for embed
  const spotifyId = campaign.track_url?.match(/track\/([a-zA-Z0-9]+)/)?.[1];

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {/* ── HERO SECTION (Above the Fold) ────────────────────── */}
        <div ref={heroRef}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8"
          >
            {/* Left: Cover + Track Preview */}
            <div className="space-y-4">
              <CampaignCover src={campaign.cover_art_url} title={campaign.track_title} className="aspect-video rounded-2xl" />

              {/* Spotify embed */}
              {spotifyId && (
                <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
                  <iframe
                    src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=selah.fm`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media"
                    loading="lazy"
                    title={`Listen to ${campaign.track_title}`}
                    className="block"
                  />
                </div>
              )}

              {/* Platform badges */}
              {campaign.platforms?.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">Accepted on:</span>
                  {(campaign.platforms || []).map((p: string) => <PlatformBadge key={p} platform={p} />)}
                </div>
              )}
            </div>

            {/* Right: The Offer + CTA */}
            <div className="flex flex-col justify-center space-y-5">
              <div>
                <Badge variant="outline" className="border-primary/20 text-primary text-xs mb-3">{campaign.status === 'active' ? '🟢 Active campaign' : campaign.status}</Badge>
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-2">{campaign.track_title}</h1>
                <a href={campaign.track_url} target="_blank" rel="noopener" className="text-primary hover:underline text-sm inline-flex items-center gap-1">
                  <Spotify size={14} /> Listen on Spotify
                </a>
              </div>

              {/* Earnings Card */}
              <div className="rounded-2xl bg-primary/[0.06] backdrop-blur-xl border border-primary/10 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-primary" />
                  <span className="text-lg font-bold">${cpm.toFixed(2)} CPM</span>
                  <span className="text-xs text-muted-foreground">per 1,000 verified views</span>
                </div>

                {/* Earnings calculator */}
                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground">Estimate your earnings:</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={viewEstimate}
                      onChange={e => setViewEstimate(parseInt(e.target.value) || 0)}
                      min={1000}
                      step={1000}
                      className="w-32 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">views</span>
                    <span className="text-xs text-muted-foreground">→</span>
                    <span className="text-lg font-bold text-primary">${estimatedEarnings}</span>
                    <span className="text-xs text-muted-foreground">earned (80%)</span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground/60">You keep 80% of the CPM after the 20% platform fee.</p>
              </div>

              {/* Submit flow */}
              {!joined ? (
                <Button
                  onClick={() => setJoined(true)}
                  className="w-full py-6 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90 transition-all hover:shadow-[0_0_30px_rgba(91,127,255,0.3)] active:scale-[0.97]"
                >
                  <Send size={18} className="mr-2" />
                  Submit Your Video — Earn ${(cpm * 0.8).toFixed(2)}/1K views
                </Button>
              ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                  <p className="text-sm font-semibold">Paste your video link</p>
                  <div className="flex gap-2">
                    <select value={submitPlatform} onChange={e => setSubmitPlatform(e.target.value)}
                      className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 text-sm text-foreground" style={{ colorScheme: 'dark' }}>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Reels</option>
                      <option value="youtube">Shorts</option>
                    </select>
                    <Input
                      value={submitUrl}
                      onChange={e => setSubmitUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Button onClick={handleSubmit} disabled={!submitUrl || submitting} className="shrink-0">
                      {submitting ? '...' : 'Submit'}
                    </Button>
                  </div>
                  <button onClick={() => setJoined(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                </motion.div>
              )}

              {/* Social proof */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Users size={12} /> {submissions} creators submitted</span>
                <span className="flex items-center gap-1"><Eye size={12} /> {views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views} views</span>
                <span className="flex items-center gap-1"><DollarSign size={12} /> ${spent.toFixed(0)} paid out</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── BUDGET BAR ──────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mb-8">
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Campaign budget</span>
              <span className="text-sm font-medium">${spent.toFixed(0)} of ${budget.toFixed(0)} spent</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-[10px] text-muted-foreground/60 mt-2">Budget is used to pay creators. The more submissions, the faster it goes!</p>
          </div>
        </motion.div>

        {/* ── TRUST + REQUIREMENTS ────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Trust signals */}
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Shield size={16} className="text-primary/60" /> Why creators trust Selah.fm</h3>
            <div className="space-y-3">
              {[
                { icon: CheckCircle, text: 'Verified views only — no bots, no fake counts' },
                { icon: Zap, text: 'Instant payout via Stripe after approval' },
                { icon: Shield, text: 'You own 100% of your video content' },
                { icon: Star, text: 'Top creators earn $50–500+ per campaign' },
              ].map((item, i) => {
                const I = item.icon;
                return (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <I size={14} className="text-primary/60 mt-0.5 shrink-0" />
                    <span>{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requirements */}
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Clock size={16} className="text-primary/60" /> Requirements</h3>
            <div className="space-y-2">
              {(campaign as any)?.min_video_length_seconds > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={14} /> Minimum {(campaign as any).min_video_length_seconds}s video
                </div>
              )}
              {(campaign as any)?.require_ftc && (
                <div className="text-sm text-muted-foreground">• FTC disclosure required (#ad, #paidpartner)</div>
              )}
              {campaign.requirements && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.requirements}</p>
              )}
              {!campaign.requirements && !(campaign as any)?.min_video_length_seconds && (
                <p className="text-sm text-muted-foreground">Be creative! No strict requirements.</p>
              )}
            </div>
            {campaign.recommended_hashtags && (
              <div className="pt-2">
                <p className="text-[10px] text-muted-foreground mb-1">Suggested hashtags:</p>
                <p className="text-sm font-mono text-primary">{campaign.recommended_hashtags}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
            <h3 className="font-semibold text-sm mb-4">Frequently asked questions</h3>
            <div className="space-y-3">
              {[
                { q: 'How do I get paid?', a: `After the artist approves your video, you earn $${cpm.toFixed(2)} per 1,000 verified views (minus 20% platform fee). Payouts are processed via Stripe Connect — connect your bank account in the Earnings page.` },
                { q: 'Who owns my video?', a: 'You do. 100%. Selah.fm never claims ownership of your content. The artist gets promotion; you keep full rights to your video.' },
                { q: 'What kind of content should I make?', a: campaign.requirements || 'Anything creative! Dance challenges, lip-syncs, storytelling, duets — as long as it features the track, you\'re good. Check the requirements above for specifics.' },
                { q: 'How long does approval take?', a: 'Artists typically review submissions within 24–48 hours. You\'ll get a notification when they decide.' },
              ].map((faq, i) => (
                <details key={i} className="group">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-1">
                    {faq.q}
                  </summary>
                  <p className="text-sm text-muted-foreground mt-1 pl-1">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── STICKY CTA BAR ──────────────────────────────────── */}
        <AnimatePresence>
          {showStickyCTA && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-white/[0.08] p-3 md:hidden"
            >
              {!joined ? (
                <Button
                  onClick={() => { setJoined(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="w-full py-5 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 active:scale-[0.97]"
                >
                  <Send size={16} className="mr-2" /> Submit Video — Earn ${(cpm * 0.8).toFixed(2)}/1K views
                </Button>
              ) : (
                <div className="flex gap-2">
                  <select value={submitPlatform} onChange={e => setSubmitPlatform(e.target.value)}
                    className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-3 text-sm text-foreground" style={{ colorScheme: 'dark' }}>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Reels</option>
                    <option value="youtube">Shorts</option>
                  </select>
                  <Input value={submitUrl} onChange={e => setSubmitUrl(e.target.value)} placeholder="Paste link..." className="flex-1" />
                  <Button onClick={handleSubmit} disabled={!submitUrl || submitting} className="shrink-0">{submitting ? '...' : 'Submit'}</Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back link */}
        <div className="text-center py-8 pb-24 md:pb-8">
          <Link href="/browse">
            <Button variant="outline" size="lg">
              <ArrowLeft size={16} className="mr-1" /> Back to browse
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
