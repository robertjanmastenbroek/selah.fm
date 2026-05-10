'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, DollarSign, Share2, Copy, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PaymentSuccessProps {
  open: boolean;
  mode: 'donation' | 'deposit';
  amount: number;
  campaignTitle?: string;
  campaignId?: string;
  donorName?: string;
  donorMessage?: string;
  onClose: () => void;
}

// Confetti particles
function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 2,
      size: 6 + Math.random() * 8,
      color: ['#5B7FFF', '#81C784', '#FFD54F', '#EF9A9A', '#CE93D8'][Math.floor(Math.random() * 5)],
      rotation: Math.random() * 360,
    }))
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '-5%',
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 2,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: '110vh',
            opacity: [1, 1, 0],
            rotate: p.rotation + 360,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />
      ))}
    </div>
  );
}

export default function PaymentSuccess({
  open, mode, amount, campaignTitle, campaignId, donorName, donorMessage, onClose,
}: PaymentSuccessProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = campaignId ? `https://selah.fm/c/${campaignId}` : 'https://selah.fm';

  const handleShare = async () => {
    const text = mode === 'donation'
      ? `I just supported "${campaignTitle}" on Selah.fm! 🎵 Help this artist get more views on TikTok, Reels & Shorts.`
      : `I just funded my campaign "${campaignTitle}" on Selah.fm! 🎵 Creators are making content for it.`;

    if (navigator.share) {
      try { await navigator.share({ title: 'Selah.fm', text, url: shareUrl }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

          {/* Confetti */}
          <Confetti />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.1 }}
            className="relative z-10 w-full max-w-sm rounded-3xl bg-[#0D0D0D] border border-white/[0.10] shadow-2xl overflow-hidden"
          >
            {/* Glow ring */}
            <motion.div
              className="absolute -inset-4 rounded-3xl opacity-20 pointer-events-none"
              animate={{
                boxShadow: [
                  '0 0 60px rgba(91,127,255,0.2), 0 0 120px rgba(91,127,255,0.1)',
                  '0 0 80px rgba(91,127,255,0.3), 0 0 160px rgba(91,127,255,0.15)',
                  '0 0 60px rgba(91,127,255,0.2), 0 0 120px rgba(91,127,255,0.1)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="p-8 text-center space-y-5">
              {/* Checkmark */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 400 }}
                >
                  <CheckCircle size={40} className="text-emerald-400" strokeWidth={1.5} />
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1"
              >
                <h2 className="text-2xl font-bold">
                  {mode === 'donation' ? 'Thank you for your support!' : 'Campaign funded!'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {mode === 'donation'
                    ? `Your $${amount} donation helps "${campaignTitle}" reach more listeners.`
                    : `$${amount} has been added to your campaign "${campaignTitle}".`}
                </p>
              </motion.div>

              {/* Amount highlight */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                className="inline-flex items-baseline gap-1 px-6 py-3 rounded-2xl bg-primary/[0.08] border border-primary/10"
              >
                {mode === 'donation' ? (
                  <Heart size={20} className="text-primary" />
                ) : (
                  <DollarSign size={20} className="text-primary" />
                )}
                <span className="text-3xl font-bold">${amount}</span>
              </motion.div>

              {/* Donor message */}
              {donorMessage && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-sm text-muted-foreground italic"
                >
                  &ldquo;{donorMessage}&rdquo;
                  {donorName && <span className="not-italic"> — {donorName}</span>}
                </motion.p>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-3 pt-3"
              >
                <div className="flex gap-2">
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-medium hover:bg-white/[0.08] transition-colors active:scale-[0.97]"
                  >
                    {copied ? <><CheckCircle size={14} className="text-success" /> Copied!</> : <><Share2 size={14} /> Share</>}
                  </button>
                  {campaignId && (
                    <Link
                      href={`/c/${campaignId}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity active:scale-[0.97]"
                    >
                      View campaign <ArrowRight size={14} />
                    </Link>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  Close
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
