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
import VideoEmbed from '@/components/VideoEmbed';
import { Eye, DollarSign, Users, ArrowRight, ArrowLeft, Shield, Zap, CheckCircle, Clock, Star, Send, Music, TrendingUp, Heart, Share2, Copy } from 'lucide-react';
import { trackSubmitContent } from '@/lib/analytics';

export default function CampaignDetailClient({ id, initialCampaign }: { id: string; initialCampaign: any }) {
  const [campaign, setCampaign] = useState<any>(initialCampaign);
  const [loading, setLoading] = useState(!initialCampaign);
  const [joined, setJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitPlatform, setSubmitPlatform] = useState('tiktok');
  const [viewEstimate, setViewEstimate] = useState(10000);
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  // Support/donation state
  const [showSupport, setShowSupport] = useState(false);
  const [donationAmount, setDonationAmount] = useState(10);
  const [donorName, setDonorName] = useState('');
  const [donorMessage, setDonorMessage] = useState('');
  const [donating, setDonating] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialCampaign) return; // Already have data from server
    fetch(`/api/campaigns/${id}`).then(r => r.json()).then(d => {
      if (d.error) { setCampaign(null); } else { setCampaign(d); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, initialCampaign]);

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
  const donations = campaign.donations || { totalCents: 0, count: 0, supporters: [] };
  const totalRaised = donations.totalCents / 100;

  const handleDonate = async () => {
    if (donationAmount < 1) return;
    setDonating(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: donationAmount,
          donorName: donorName || undefined,
          message: donorMessage || undefined,
          anonymous: !donorName,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        addToast(data.error || 'Could not start donation', 'error');
        setDonating(false);
      }
    } catch {
      addToast('Network error — try again', 'error');
      setDonating(false);
    }
  };

  const shareUrl = `https://selah.fm/c/${id}`;

  const handleShare = async () => {
    const shareData = {
      title: campaign.track_title,
      text: `Support "${campaign.track_title}" on Selah.fm — help this artist get more views on TikTok, Reels & Shorts.`,
      url: shareUrl,
    };

    // Web Share API — opens native share sheet on mobile (WhatsApp, Instagram, Messages, etc.)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        addToast('Shared!', 'success');
        return;
      } catch {
        // User cancelled — fall through to clipboard
      }
    }

    // Desktop fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      addToast('Campaign link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Could not copy link', 'error');
    }
  };

  // Fetch Spotify stats (monthly listeners) — lightweight alternative to iframe embed
  const [spotifyData, setSpotifyData] = useState<{ monthlyListeners: number | null; artistName: string | null } | null>(null);
  useEffect(() => {
    fetch(`/api/campaigns/${id}/spotify`)
      .then(r => r.json())
      .then(d => setSpotifyData(d))
      .catch(() => {});
  }, [id]);

  function formatListeners(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  return (
    <div className="min-h-screen" style={{ background: bg }}>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {/* Donation success banner */}
        {donationSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 text-center"
          >
            <CheckCircle size={28} className="mx-auto mb-2 text-emerald-400" />
            <h3 className="font-bold text-lg mb-1">Thank you for your support!</h3>
            <p className="text-sm text-muted-foreground">
              Your donation has been added to this campaign&apos;s budget. The artist has been notified and will see your message.
            </p>
            <button
              onClick={() => setDonationSuccess(false)}
              className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* ── HERO SECTION (Above the Fold) ────────────────────── */}
        <div ref={heroRef}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-6 md:gap-8 mb-8"
          >
            {/* Left: Cover + Video */}
            <div className="space-y-4">
              <CampaignCover src={campaign.cover_art_url} title={campaign.track_title} className="aspect-video rounded-2xl" />

              {/* Video embed if track or content URL is a video */}
              {(campaign.track_url || campaign.content_assets_url) && (
                <VideoEmbed url={campaign.content_assets_url || campaign.track_url} className="aspect-video" />
              )}

              {/* Spotify: monthly listeners + link — no heavy iframe */}
              {spotifyData?.monthlyListeners ? (
                <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                  <span className="text-[#1DB954]"><Spotify size={18} /></span>
                  <div>
                    <p className="text-sm font-semibold">{formatListeners(spotifyData.monthlyListeners)}</p>
                    <p className="text-[10px] text-muted-foreground">monthly listeners{spotifyData.artistName ? ` · ${spotifyData.artistName}` : ''}</p>
                  </div>
                  <a href={campaign.track_url} target="_blank" rel="noopener" className="ml-auto text-xs text-primary hover:underline shrink-0">
                    Listen →
                  </a>
                </div>
              ) : campaign.track_url ? (
                <a href={campaign.track_url} target="_blank" rel="noopener" className="flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <span className="text-[#1DB954]"><Spotify size={16} /></span>
                  Listen on Spotify →
                </a>
              ) : null}

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
                <Badge variant="outline" className="border-primary/20 text-primary text-xs mb-3">{campaign.status === 'active' ? '🟢 Active campaign' : campaign.status === 'paused' ? '⏸ Paused — creators have 7 days grace period' : campaign.status}</Badge>
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
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  className="rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] overflow-hidden"
                >
                  {/* Platform selector — large clickable cards */}
                  <div className="p-5 space-y-4">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Send size={16} className="text-primary" />
                      Submit your video
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { platform: 'tiktok', label: 'TikTok', color: '#ff0050', desc: 'Short video' },
                        { platform: 'instagram', label: 'Reels', color: '#E1306C', desc: 'Instagram' },
                        { platform: 'youtube', label: 'Shorts', color: '#FF0000', desc: 'YouTube' },
                      ].map(p => (
                        <button
                          key={p.platform}
                          onClick={() => setSubmitPlatform(p.platform)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                            submitPlatform === p.platform
                              ? 'border-primary bg-primary/[0.06]'
                              : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: p.color + '15' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill={p.color}>
                              {p.platform === 'tiktok' && <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>}
                              {p.platform === 'instagram' && <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke={p.color} strokeWidth="2"/><circle cx="12" cy="12" r="5" fill="none" stroke={p.color} strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill={p.color}/></>}
                              {p.platform === 'youtube' && <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29.94 29.94 0 0 0 1 12a29.94 29.94 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29.94 29.94 0 0 0 23 12a29.94 29.94 0 0 0-.46-5.58z" fill="none" stroke={p.color} strokeWidth="2"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill={p.color}/></>}
                            </svg>
                          </div>
                          <span className="text-xs font-medium">{p.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* URL input */}
                    <div className="flex gap-2">
                      <Input
                        value={submitUrl}
                        onChange={e => setSubmitUrl(e.target.value)}
                        placeholder="Paste your video link..."
                        className="flex-1 text-sm"
                        autoFocus
                      />
                      <Button
                        onClick={handleSubmit}
                        disabled={!submitUrl || submitting}
                        className="shrink-0 px-5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary transition-all hover:shadow-[0_0_20px_rgba(91,127,255,0.25)]"
                      >
                        {submitting ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Submit'
                        )}
                      </Button>
                    </div>

                    {/* Earnings preview */}
                    {submitUrl && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 flex items-center gap-3"
                      >
                        <DollarSign size={16} className="text-emerald-400" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-400">${(cpm * 0.8).toFixed(2)} per 1K views</p>
                          <p className="text-[10px] text-emerald-400/70">You keep 80% · Paid after approval</p>
                        </div>
                      </motion.div>
                    )}

                    <button onClick={() => setJoined(false)} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
                      Cancel
                    </button>
                  </div>
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

        {/* ── CROWDFUNDING: Support + Share ──────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mb-8">
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Heart size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Support this campaign</h3>
                  <p className="text-xs text-muted-foreground">
                    {totalRaised > 0
                      ? `$${totalRaised.toFixed(2)} raised from ${donations.count} supporter${donations.count !== 1 ? 's' : ''}`
                      : 'Be the first to support this artist'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-medium hover:bg-white/[0.08] transition-colors active:scale-[0.97]"
                >
                  {copied ? <CheckCircle size={14} className="text-success" /> : <Share2 size={14} />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
                {!showSupport ? (
                  <button
                    onClick={() => setShowSupport(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity active:scale-[0.97]"
                  >
                    <Heart size={14} /> Support
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSupport(false)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Donation form */}
            <AnimatePresence>
              {showSupport && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-white/[0.06] space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Your donation goes directly to this campaign&apos;s budget — helping the artist reach more listeners through creator content.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[5, 10, 25, 50, 100].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setDonationAmount(amt)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            donationAmount === amt
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-white/[0.04] border border-white/[0.06] hover:border-primary/20'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          value={donationAmount}
                          onChange={e => setDonationAmount(parseInt(e.target.value) || 0)}
                          min={1}
                          className="w-20 text-sm"
                          placeholder="Custom"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={donorName}
                        onChange={e => setDonorName(e.target.value)}
                        placeholder="Your name (optional)"
                        className="text-sm"
                      />
                      <Input
                        value={donorMessage}
                        onChange={e => setDonorMessage(e.target.value)}
                        placeholder="Message to the artist (optional)"
                        className="text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleDonate}
                      disabled={donationAmount < 1 || donating}
                      className="w-full py-3 font-semibold"
                    >
                      {donating ? 'Redirecting to Stripe...' : `Support with $${donationAmount}`}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recent supporters */}
            {donations.supporters.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.06]">
                <p className="text-[10px] text-muted-foreground mb-3">Recent supporters</p>
                <div className="space-y-2">
                  {donations.supporters.slice(0, 5).map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {(s.donor_name || 'A')[0].toUpperCase()}
                        </div>
                        <span className="truncate">{s.anonymous ? 'Anonymous' : s.donor_name}</span>
                        {s.message && (
                          <span className="text-xs text-muted-foreground truncate hidden sm:inline">— &quot;{s.message.slice(0, 60)}{s.message.length > 60 ? '...' : ''}&quot;</span>
                        )}
                      </div>
                      <span className="font-semibold text-primary shrink-0 ml-2">${(s.amount_cents / 100).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
