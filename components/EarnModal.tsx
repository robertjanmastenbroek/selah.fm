'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/Toast';
import { trackSubmitContent } from '@/lib/analytics';
import { Camera, DollarSign, ArrowLeft, AlertCircle, Check, Shield, Music4 } from 'lucide-react';

interface EarnModalProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  trackTitle: string;
  cpmCents: number;
  coverArtUrl?: string;
  contentAssetsUrl?: string;
}

// ── Platform config with official brand colors + SVG logos ──
const PLATFORMS = [
  {
    id: 'tiktok' as const,
    label: 'TikTok',
    color: '#ff0050',
    bgClass: 'bg-[#ff0050]/10',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
  },
  {
    id: 'instagram' as const,
    label: 'Reels',
    color: '#E1306C',
    bgClass: 'bg-[#E1306C]/10',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="17.5" cy="6.5" r="1.5"/>
      </svg>
    ),
  },
  {
    id: 'youtube' as const,
    label: 'Shorts',
    color: '#FF0000',
    bgClass: 'bg-[#FF0000]/10',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29.94 29.94 0 0 0 1 12a29.94 29.94 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29.94 29.94 0 0 0 23 12a29.94 29.94 0 0 0-.46-5.58z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
      </svg>
    ),
  },
  {
    id: 'facebook' as const,
    label: 'Facebook',
    color: '#1877F2',
    bgClass: 'bg-[#1877F2]/10',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
];

// Resolve platform label for display
function platformLabel(id: string) {
  const p = PLATFORMS.find(p => p.id === id);
  return p ? p.label : id;
}

export default function EarnModal({ open, onClose, campaignId, trackTitle, cpmCents, coverArtUrl, contentAssetsUrl }: EarnModalProps) {
  const [platform, setPlatform] = useState('tiktok');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  // Auth state
  const [authChecked, setAuthChecked] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!open) return;
    setAuthChecked(false);
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setSession(d.user || null);
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
  }, [open]);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setPlatform('tiktok');
      setUrl('');
      setSubmitting(false);
      setSubmitted(false);
    }
  }, [open]);

  const cpmDollars = cpmCents / 100;
  const creatorEarnings = (cpmDollars * 0.8).toFixed(2);

  const handleSubmit = async () => {
    if (!url || !session) return;
    if (!url.startsWith('https://')) {
      addToast('Please paste a valid HTTPS link from the platform you chose', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, contentUrl: url, platform }),
      });
      if (res.ok) {
        trackSubmitContent(platform);
        setSubmitted(true);
        addToast('Submitted! The artist will review your video.', 'success');
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to submit', 'error');
      }
    } catch {
      addToast('Network error — try again', 'error');
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          {/* Sheet / Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full sm:max-w-lg max-h-[92vh] sm:rounded-3xl rounded-t-3xl bg-[#0D0D0D] border border-white/[0.08] shadow-2xl overflow-y-auto"
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="p-6 space-y-5">
              {/* ── Header ── */}
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-1.5 -ml-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                  <ArrowLeft size={20} className="text-muted-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-lg truncate">Join this campaign</h2>
                  <p className="text-xs text-muted-foreground truncate">{trackTitle}</p>
                </div>
              </div>

              {/* ── Auth gate ── */}
              {!authChecked ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : !session ? (
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-center space-y-4">
                  <Camera size={32} className="mx-auto text-primary/40" />
                  <div>
                    <h3 className="font-semibold">Sign in to submit</h3>
                    <p className="text-sm text-muted-foreground mt-1">You need an account to submit videos and earn.</p>
                  </div>
                  <Button
                    onClick={() => router.push(`/login?redirect=/c/${campaignId}`)}
                    className="w-full py-5 rounded-xl bg-gradient-to-r from-primary to-primary/80"
                  >
                    Sign in to join
                  </Button>
                  <p className="text-[10px] text-muted-foreground/60">
                    Don&apos;t have an account? You can create one after clicking.
                  </p>
                </div>
              ) : !session.is_creator && session.type !== 'creator' ? (
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-center space-y-4">
                  <Music4 size={32} className="mx-auto text-primary/40" />
                  <div>
                    <h3 className="font-semibold">You&apos;re signed in as an artist</h3>
                    <p className="text-sm text-muted-foreground mt-1">Switch to a creator account to submit videos and earn.</p>
                  </div>
                  <Button variant="outline" onClick={onClose} className="w-full">Got it</Button>
                </div>
              ) : submitted ? (
                /* ── Success state ── */
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/10 p-6 text-center space-y-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}>
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 mx-auto flex items-center justify-center">
                      <Check size={28} className="text-emerald-400" />
                    </div>
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-lg">Submitted!</h3>
                    <p className="text-sm text-muted-foreground mt-1">The artist will review your video and approve it before paying.</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">You&apos;ll earn</p>
                    <p className="text-2xl font-bold text-emerald-400">${creatorEarnings}</p>
                    <p className="text-[10px] text-emerald-400/60">per 1,000 verified views</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
                    <Button onClick={() => { setSubmitted(false); setUrl(''); }} className="flex-1">Join another</Button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* ── Creator resource pack — front and center ── */}
                  {contentAssetsUrl ? (
                    <motion.a
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      href={contentAssetsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-primary/[0.08] to-primary/[0.03] border-2 border-primary/20 p-4 hover:border-primary/30 transition-all group active:scale-[0.98]"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-primary group-hover:underline">📦 Download official audio & assets</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Master track (.wav + .mp3), cover art, reference videos — everything you need to create winning content.</p>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/40 shrink-0 group-hover:translate-x-0.5 transition-transform"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </motion.a>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-amber-500/[0.04] border border-amber-500/10 p-4 flex items-start gap-3"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400/60 shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <div>
                        <p className="text-xs font-semibold text-amber-400/80">No resource pack provided</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">The artist hasn&apos;t shared a Google Drive with audio files yet. You can still find the official audio by searching &quot;{trackTitle}&quot; on the platform.</p>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Earnings preview ── */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-gradient-to-br from-emerald-500/[0.06] to-emerald-500/[0.01] border border-emerald-500/10 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">You&apos;ll earn</span>
                      <DollarSign size={16} className="text-emerald-400/60" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-emerald-400">${creatorEarnings}</span>
                      <span className="text-xs text-emerald-400/60">per 1K views</span>
                    </div>
                    <p className="text-[10px] text-emerald-400/40 mt-1">80% of ${cpmDollars.toFixed(2)} CPM rate set by the artist</p>
                  </motion.div>

                  {/* ── Platform selector ── */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Choose platform</label>
                    <div className="grid grid-cols-4 gap-2">
                      {PLATFORMS.map(p => {
                        const active = platform === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setPlatform(p.id)}
                            className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all active:scale-[0.96] ${
                              active
                                ? 'border-primary bg-primary/[0.06] shadow-[0_0_20px_rgba(67,56,202,0.08)]'
                                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${p.bgClass}`} style={{ color: p.color }}>
                              {p.icon}
                            </div>
                            <span className="text-[10px] font-medium">{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── URL input ── */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Paste your video link</label>
                    <Input
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder={`https://www.${platform === 'facebook' ? 'facebook' : platform}.com/...`}
                      className="text-sm py-5 rounded-xl"
                      autoFocus
                    />
                  </div>

                  {/* ── Submit ── */}
                  <Button
                    onClick={handleSubmit}
                    disabled={!url || submitting}
                    className="w-full py-6 text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary transition-all hover:shadow-[0_0_30px_rgba(67,56,202,0.2)] active:scale-[0.98]"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Camera size={16} className="mr-2" /> Join — earn ${creatorEarnings}/1K views</>
                    )}
                  </Button>

                  {/* ── Trust signals ── */}
                  <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/50">
                    <span className="flex items-center gap-1"><Shield size={10} /> Artist reviews before paying</span>
                    <span>·</span>
                    <span>Paid via Stripe</span>
                  </div>

                  {/* ── How it works (reference at bottom) ── */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">How it works</p>
                    <div className="space-y-2.5">
                      {[
                        { step: '1', emoji: '🔍', title: 'Find the official audio', desc: `Open ${platformLabel(platform)} and search for "${trackTitle}". You must use the official audio — not a screen recording.` },
                        { step: '2', emoji: '🎬', title: 'Create your video', desc: 'Record a video using the official audio. Dance, react, duet — be creative! Make it public so views count.' },
                        { step: '3', emoji: '📋', title: 'Submit your link', desc: 'Copy the link to your published video and paste it above. The artist reviews and you get paid for verified views.' },
                      ].map(s => (
                        <div key={s.step} className="flex gap-3">
                          <span className="text-sm shrink-0 mt-0.5">{s.emoji}</span>
                          <div>
                            <p className="text-xs font-semibold text-foreground/70">{s.title}</p>
                            <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5 break-words">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
