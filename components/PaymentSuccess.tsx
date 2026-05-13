'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, DollarSign, Share2, Copy, CheckCircle, ArrowRight, X } from 'lucide-react';
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

// ── Confetti ──────────────────────────────────────────────────
function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 2.5,
      size: 5 + Math.random() * 10,
      color: ['#4338CA', '#81C784', '#FFD54F', '#EF9A9A', '#CE93D8', '#4FC3F7'][Math.floor(Math.random() * 6)],
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 80,
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
          initial={{ y: -20, opacity: 1, rotate: 0, x: 0 }}
          animate={{
            y: '110vh',
            opacity: [1, 1, 0],
            rotate: p.rotation + 360 + Math.random() * 180,
            x: p.drift,
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
  const [shareMethod, setShareMethod] = useState('');

  const shareUrl = campaignId ? `https://selah.fm/c/${campaignId}` : 'https://selah.fm';
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareText = mode === 'donation'
    ? `I just supported "${campaignTitle}" on Selah.fm! 🎵 Help this artist get more views on TikTok, Reels & Shorts.`
    : `I just funded my campaign "${campaignTitle}" on Selah.fm! 🎵 Creators are making content for it.`;
  const encodedText = encodeURIComponent(shareText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setShareMethod('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      color: '#25D366',
      bg: 'bg-[#25D366]/10',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodedText}%20${encodedUrl}`,
      color: '#fff',
      bg: 'bg-white/10',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: '#1877F2',
      bg: 'bg-[#1877F2]/10',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
    },
    {
      name: 'Copy Link',
      action: handleCopy,
      color: copied ? '#81C784' : '#4338CA',
      bg: copied ? 'bg-emerald-500/10' : 'bg-primary/10',
      icon: copied ? <CheckCircle size={18} /> : <Copy size={16} />,
    },
  ];

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
            className="relative z-10 w-full max-w-sm rounded-3xl bg-[#0F0F23] border border-white/[0.10] shadow-2xl overflow-hidden"
          >
            {/* Glow ring */}
            <motion.div
              className="absolute -inset-4 rounded-3xl opacity-20 pointer-events-none"
              animate={{
                boxShadow: [
                  '0 0 60px rgba(67,56,202,0.2), 0 0 120px rgba(67,56,202,0.1)',
                  '0 0 80px rgba(67,56,202,0.3), 0 0 160px rgba(67,56,202,0.15)',
                  '0 0 60px rgba(67,56,202,0.2), 0 0 120px rgba(67,56,202,0.1)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <X size={18} className="text-muted-foreground" />
            </button>

            <div className="p-8 text-center space-y-6">
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

              {/* Title + Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <h2 className="text-2xl font-bold">
                  {mode === 'donation' ? 'Thank you for your support!' : 'Campaign funded!'}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {mode === 'donation'
                    ? `Your $${amount} donation to "${campaignTitle}" makes a real difference. Every dollar helps creators get paid for their work.`
                    : `$${amount} has been added to your campaign "${campaignTitle}". Creators can now earn from your budget.`}
                </p>
              </motion.div>

              {/* Amount highlight */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary/[0.08] border border-primary/10"
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
                  className="text-sm text-muted-foreground italic leading-relaxed"
                >
                  &ldquo;{donorMessage}&rdquo;
                  {donorName && <span className="not-italic"> — {donorName}</span>}
                </motion.p>
              )}

              {/* Share section — GoFundMe-style post-donation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-4 pt-2"
              >
                <p className="text-xs text-muted-foreground font-medium">
                  Share this campaign to help it reach more people
                </p>

                {/* Share buttons */}
                <div className="flex items-center justify-center gap-3">
                  {shareOptions.map(opt => {
                    const isAction = !!opt.action;
                    const Comp = isAction ? 'button' : 'a';
                    return (
                      <Comp
                        key={opt.name}
                        href={isAction ? undefined : opt.href}
                        target={isAction ? undefined : '_blank'}
                        rel={isAction ? undefined : 'noopener noreferrer'}
                        onClick={isAction ? (e: any) => { e.preventDefault(); opt.action!(); } : undefined}
                        className={`flex flex-col items-center gap-1 py-2 px-2 rounded-xl hover:bg-white/[0.06] transition-colors active:scale-[0.95]`}
                        title={opt.name}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${opt.bg}`}
                          style={{ color: opt.color }}
                        >
                          {opt.icon}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{opt.name}</span>
                      </Comp>
                    );
                  })}
                </div>

                {/* View campaign button */}
                {campaignId && (
                  <Link
                    href={`/c/${campaignId}`}
                    className="block w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity active:scale-[0.97]"
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      View campaign <ArrowRight size={14} />
                    </span>
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
