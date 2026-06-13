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
}

// ── Platform config ──
const PLATFORMS = [
  { id: 'tiktok' as const, label: 'TikTok', color: '#ff0050', bgClass: 'bg-[#ff0050]/10', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>) },
  { id: 'instagram' as const, label: 'Reels', color: '#E1306C', bgClass: 'bg-[#E1306C]/10', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>) },
  { id: 'youtube' as const, label: 'Shorts', color: '#FF0000', bgClass: 'bg-[#FF0000]/10', icon: (<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29.94 29.94 0 0 0 1 12a29.94 29.94 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29.94 29.94 0 0 0 23 12a29.94 29.94 0 0 0-.46-5.58z" fill="none" stroke="currentColor" strokeWidth="1.5"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>) },
  // Facebook removed — focusing on 3 platforms
];

function platformName(id: string) { return PLATFORMS.find(p => p.id === id)?.label || id; }

export default function EarnModal({ open, onClose, campaignId, trackTitle, cpmCents, coverArtUrl, contentAssetsUrl }: EarnModalProps) {
  const [platform, setPlatform] = useState('tiktok');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, contentUrl: url, platform }),
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
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-center space-y-4">
                  <Camera size={36} className="mx-auto text-primary/30" />
                  <div>
                    <h3 className="font-semibold" style={{color: '#F4F1EA'}}>Sign in to submit</h3>
                    <p className="text-xs mt-1" style={{color: '#6B6760'}}>Create an account (free, 30 seconds) to start earning.</p>
                  </div>
                  <button onClick={() => setLoginOpen(true)}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #D6A85F, #C9974D)' }}>
                    Sign in &amp; join
                  </button>
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
                      { emoji: '✅', text: 'Once approved, we start tracking verified views.' },
                      { emoji: '💰', text: `You earn $${(parseFloat(creatorEarnings) * 1000).toFixed(0)} per 1M verified views — paid via Stripe.` },
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
                              `Search "${trackTitle}" on TikTok, Instagram, or YouTube`
                            )}. Use the official audio — no screen recordings.
                          </p>
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
                      <Input value={url} onChange={e => { setUrl(e.target.value); if (!startTracked.current && e.target.value.includes('https://')) { startTracked.current = true; fetch('/api/analytics/event', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ event: 'video_submit_start', path: window.location.pathname, metadata: { campaign_id: campaignId, platform } }) }).catch(()=>{}); } }}
                        placeholder={`https://www.${platform === 'facebook' ? 'facebook' : platform}.com/...`}
                        className="text-sm py-5 rounded-xl" autoFocus />
                    </div>

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
                      <span className="flex items-center gap-1"><DollarSign size={10} /> You earn 80%</span>
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
