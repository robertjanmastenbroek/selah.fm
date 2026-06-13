'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/Toast';
import { trackSubmitContent } from '@/lib/analytics';
import { Camera, DollarSign, ArrowLeft, Check, Shield, Music4, Download, Film, Banknote, Eye } from 'lucide-react';
import LoginModal from '@/components/LoginModal';

interface EarnModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  trackTitle: string;
  cpmCents: number;
  coverArtUrl?: string;
  contentAssetsUrl?: string;
  tiktokSoundUrl?: string;
  requiredHashtags?: string;
  artistHandle?: string;
}

// ── Platform config ──
const PLATFORMS = [
  { id: 'tiktok' as const, label: 'TikTok', color: '#ff0050', bgClass: 'bg-[#ff0050]/10', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>) },
  // Instagram and YouTube removed — TikTok only
  // Facebook removed — focusing on 3 platforms
];

function platformName(id: string) { return PLATFORMS.find(p => p.id === id)?.label || id; }

export default function EarnModal({ open, onClose, campaignId, trackTitle, cpmCents, coverArtUrl, contentAssetsUrl, tiktokSoundUrl, requiredHashtags, artistHandle }: EarnModalProps) {
  const [platform, setPlatform] = useState('tiktok');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [captionCheck, setCaptionCheck] = useState<{ ok: boolean; missing: string[] } | null>(null);
  const startTracked = useRef(false);
  const { addToast } = useToast();
  const router = useRouter();

  // Auth state
  const [authChecked, setAuthChecked] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!open) return;
    setAuthChecked(false);
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setSession(d.user || null); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, [open]);

  useEffect(() => {
    if (open) { setPlatform('tiktok'); setUrl(''); setSubmitting(false); setSubmitted(false); startTracked.current = false; }
  }, [open]);

  const cpmDollars = cpmCents / 100;
  const creatorEarnings = cpmDollars.toFixed(2); // Full CPM — platform fee is on artist side

  const handleSubmit = async () => {
    if (!url || !session) return;
    if (!url.startsWith('https://')) { addToast('Paste a valid HTTPS link', 'error'); return; }
    setSubmitting(true);

    // Real-time TikTok view verification + caption compliance check
    let verifiedViews: number | null = null;
    let videoTitle = '';
    if (platform === 'tiktok') {
      try {
        const verifyRes = await fetch('/api/tiktok/verify-video', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          verifiedViews = verifyData.viewCount;
          videoTitle = verifyData.title || '';
        }
      } catch { /* verification is optional — submission still works */ }
    }

    // Compliance check: verify caption contains required hashtags and handle
    if (videoTitle && (requiredHashtags || artistHandle)) {
      const missing: string[] = [];
      if (requiredHashtags) {
        // Check each hashtag (comma-separated or space-separated)
        const tags = requiredHashtags.split(',').map(t => t.trim()).filter(Boolean);
        for (const tag of tags) {
          if (!videoTitle.toLowerCase().includes(tag.toLowerCase())) {
            missing.push(tag);
          }
        }
      }
      if (artistHandle && !videoTitle.toLowerCase().includes(artistHandle.toLowerCase().replace('@', ''))) {
        missing.push(`@${artistHandle.replace('@', '')}`);
      }
      if (missing.length > 0) {
        setCaptionCheck({ ok: false, missing });
      } else {
        setCaptionCheck({ ok: true, missing: [] });
      }
    }

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, contentUrl: url, platform, viewsVerified: verifiedViews }),
      });
      const data = await res.json();
      if (res.ok) {
        fetch('/api/analytics/event', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ event: 'video_submit_complete', path: window.location.pathname, metadata: { campaign_id: campaignId, platform } }) }).catch(()=>{});
        trackSubmitContent(platform);
        setSubmitted(true);
        addToast('Submitted! The artist will review your video.', 'success');
      } else if (res.status === 409) {
        // Duplicate submission
        addToast('You already submitted this exact video to this campaign. Check your earnings page for status.', 'info');
        setSubmitted(true); // Show success screen to prevent re-submission
      } else {
        addToast(data.error || 'Failed to submit', 'error');
      }
    } catch { addToast('Network error — try again', 'error'); }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full sm:max-w-lg max-h-[92vh] sm:rounded-3xl rounded-t-3xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full bg-white/20" /></div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* ── Header ── */}
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                  <ArrowLeft size={20} className="text-muted-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base sm:text-lg truncate">Create &amp; earn</h2>
                  <p className="text-[11px] text-muted-foreground truncate">{trackTitle}</p>
                </div>
              </div>

              {/* ── Auth gates ── */}
              {!authChecked ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : !session ? (
                <div className="space-y-5">
                  {/* Earnings preview — shows value before auth */}
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-500/[0.08] to-transparent border border-emerald-500/15 p-5 text-center">
                    <p className="text-sm font-medium mb-1" style={{color: '#8B887E'}}>You could earn</p>
                    <p className="text-4xl font-bold tracking-tight" style={{color: '#22C55E'}}>
                      ${(parseFloat(creatorEarnings) * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </p>
                    <p className="text-xs mt-1" style={{color: '#6B6760'}}>per 1M verified views · paid via Stripe</p>
                  </div>

                  {/* Auth section */}
                  <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{background: 'rgba(255,255,255,0.02)'}}>
                    <div className="p-5 space-y-4">
                      <div className="text-center">
                        <h3 className="font-semibold" style={{color: '#F4F1EA'}}>Create &amp; earn</h3>
                        <p className="text-xs mt-1" style={{color: '#6B6760'}}>Sign up free · 30 seconds · no credit card</p>
                      </div>

                      {/* Google OAuth — primary CTA */}
                      <button onClick={async () => {
                        const { createClient } = await import('@/lib/supabase/client');
                        const supabase = createClient();
                        supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/c/${campaignId}` },
                        });
                      }}
                        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] hover:-translate-y-0.5"
                        style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F4F1EA'}}>
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Continue with Google
                      </button>

                      {/* Divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px" style={{background: 'rgba(255,255,255,0.06)'}} />
                        <span className="text-[11px]" style={{color: '#6B6760'}}>or</span>
                        <div className="flex-1 h-px" style={{background: 'rgba(255,255,255,0.06)'}} />
                      </div>

                      {/* Email option */}
                      <button onClick={() => setLoginOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                        style={{background: 'rgba(214,168,95,0.08)', border: '1px solid rgba(214,168,95,0.2)', color: '#D6A85F'}}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4l-10 8L2 4"/></svg>
                        Continue with email
                      </button>

                      {/* Trust badges — creator focused */}
                      <div className="flex items-center justify-center gap-3 text-[10px]" style={{color: '#6B6760', opacity: 0.5}}>
                        <span className="flex items-center gap-1"><Check size={10} /> Paid via Stripe</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Eye size={10} /> Verified views</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !session.is_creator && session.type !== 'creator' ? (
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-center space-y-4">
                  <Music4 size={36} className="mx-auto text-primary/30" />
                  <div><h3 className="font-semibold">Switch to creator</h3><p className="text-xs text-muted-foreground mt-1">Your account is set to artist. Switch to creator mode to submit videos.</p></div>
                  <Button variant="outline" onClick={onClose} className="w-full">Got it</Button>
                </div>
              ) : submitted ? (
                /* ── 🎉 Success ── */
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/10 p-6 text-center space-y-5">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center">
                      <Check size={32} className="text-emerald-400" />
                    </div>
                  </motion.div>
                  <div><h3 className="font-semibold text-lg">You&apos;re in!</h3><p className="text-xs text-muted-foreground mt-1">Here&apos;s what happens next:</p></div>
                  <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 text-left space-y-2.5">
                    {[
                      { emoji: '👀', text: 'The artist reviews your video (usually within 48 hours).' },
                      { emoji: '✅', text: 'Artist approves → we track view growth for 7 days.' },
                      { emoji: '💰', text: `You earn $${(parseFloat(creatorEarnings) * 1000).toFixed(0)} per 1M views gained after submission — paid via Stripe.` },
                    ].map((s, i) => (
                      <div key={i} className="flex gap-2.5 text-[11px]"><span className="shrink-0">{s.emoji}</span><span className="text-muted-foreground leading-relaxed">{s.text}</span></div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const text = `Just submitted a video for "${trackTitle}" on @selahfm! Creators earn the full CPM — no deductions. 🎵💰\n\nselah.fm/browse`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/20 text-[#1DA1F2] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> Share your earnings
                  </button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1 text-xs">Close</Button>
                    <Button onClick={() => { setSubmitted(false); setUrl(''); }} className="flex-1 text-xs">Submit another</Button>
                  </div>
                  {session?.id && (
                    <a
                      href={`/creators/${session.id}`}
                      className="block text-center text-[11px] text-primary/70 hover:text-primary transition-colors mt-2"
                    >
                      View your creator profile →
                    </a>
                  )}
                </motion.div>
              ) : (
                <>
                  {/* ═══ HOW IT WORKS (top — instruction-first) ═══ */}
                  <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4 space-y-3">
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">How it works</p>
                    <div className="space-y-3">
                      {/* Step 1 */}
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                          <Download size={16} className="text-primary/50" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground/80">Get the track</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                            {contentAssetsUrl ? (
                              <a href={contentAssetsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Download from Google Drive</a>
                            ) : (
                              `Search "${trackTitle}" on TikTok`
                            )}. Use the official audio — no screen recordings.
                          </p>
                          {(tiktokSoundUrl || trackTitle) && (
                            <a href={tiktokSoundUrl || `https://www.tiktok.com/search?q=${encodeURIComponent(trackTitle)}`} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold transition-all hover:opacity-80"
                              style={{color: '#D6A85F'}}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.45-1.04 1.16-1.18 1.89-.07.35-.13.82-.07 1.17.19 1.14 1.21 2.1 2.39 1.99.76-.04 1.47-.45 1.87-1.1.14-.23.23-.49.24-.76.05-1.52.02-3.04.03-4.56z"/></svg>
                              {tiktokSoundUrl ? 'Use sound on TikTok' : 'Search on TikTok'}
                            </a>
                          )}
                        </div>
                      </div>
                      {/* Step 2 */}
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                          <Film size={16} className="text-primary/50" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground/80">Make your video</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">Vertical (9:16), 15–60 seconds, public account. Dance, react, duet — have fun with it.</p>
                        </div>
                      </div>
                      {/* Step 3 */}
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                          <Banknote size={16} className="text-[#22C55E]/60" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground/80">Paste your link &amp; get paid</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                            Post publicly, paste the link below. Earn the full <span className="text-[#22C55E] font-semibold">${(parseFloat(creatorEarnings) * 1000).toFixed(0)}</span> per 1M verified views. Paid via Stripe.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ═══ FORM (clean, minimal) ═══ */}
                  <div className="space-y-4">
                    {/* Earnings badge — compact inline */}
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#22C55E]/[0.04] border border-[#22C55E]/10">
                      <DollarSign size={14} className="text-[#22C55E]" />
                      <span className="text-xs text-[#22C55E] font-medium">You&apos;ll earn <strong>${(parseFloat(creatorEarnings) * 1000).toFixed(0)}</strong> per 1M verified views</span>
                    </div>

                    {/* Platform selector */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Where did you post?</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PLATFORMS.map(p => {
                          const active = platform === p.id;
                          return (
                            <button key={p.id} onClick={() => setPlatform(p.id)}
                              className={`flex items-center gap-2.5 py-3 px-3 rounded-xl border-2 transition-all active:scale-[0.97] ${
                                active ? 'border-primary bg-primary/[0.06]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                              }`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${p.bgClass}`} style={{ color: p.color }}>{p.icon}</div>
                              <span className="text-[11px] font-medium">{p.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* URL input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Paste your video link</label>
                      <Input value={url} onChange={e => { setUrl(e.target.value); setCaptionCheck(null); if (!startTracked.current && e.target.value.includes('https://')) { startTracked.current = true; fetch('/api/analytics/event', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ event: 'video_submit_start', path: window.location.pathname, metadata: { campaign_id: campaignId, platform } }) }).catch(()=>{}); } }}
                        placeholder={`https://www.${platform === 'facebook' ? 'facebook' : platform}.com/...`}
                        className="text-sm py-5 rounded-xl" autoFocus />
                    </div>

                    {/* Caption compliance check */}
                    {captionCheck && !captionCheck.ok && (
                      <div className="rounded-xl p-3 text-xs space-y-1.5" style={{background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)'}}>
                        <p className="font-semibold" style={{color: '#FBBF24'}}>⚠️ Your video caption might be missing:</p>
                        {captionCheck.missing.map((item, i) => (
                          <p key={i} className="flex items-center gap-1.5" style={{color: '#A09B92'}}>
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background: '#FBBF24'}} />
                            <code className="text-xs font-mono" style={{color: '#FBBF24'}}>{item}</code>
                          </p>
                        ))}
                        <p className="text-[10px] pt-1" style={{color: '#6B6760'}}>You can still submit — the artist will review regardless.</p>
                      </div>
                    )}
                    {captionCheck && captionCheck.ok && (
                      <div className="rounded-xl p-3 text-xs" style={{background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)'}}>
                        <p style={{color: '#22C55E'}}>✓ Caption looks good — all required tags found.</p>
                      </div>
                    )}

                    {/* Submit */}
                    <Button onClick={handleSubmit} disabled={!url || submitting}
                      className="w-full py-6 text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary transition-all hover:shadow-[0_0_30px_rgba(67,56,202,0.2)] active:scale-[0.98]">
                      {submitting
                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Camera size={16} className="mr-2" />Submit my video</>
                      }
                    </Button>

                    {/* Trust — creator-focused */}
                    <div className="flex items-center justify-center gap-3 text-[10px] text-muted-foreground/40">
                      <span className="flex items-center gap-1"><DollarSign size={10} /> Full CPM rate</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Check size={10} /> Paid via Stripe</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Eye size={10} /> Verified views only</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
          <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} redirectUrl={`/c/${campaignId}`} />
      </motion.div>
      )}
    </AnimatePresence>
  );
}
