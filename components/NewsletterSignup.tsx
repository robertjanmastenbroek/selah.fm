'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Mail, Check } from 'lucide-react';

interface Props {
  source?: string;
  /** Only show if user has been on page for this many seconds */
  delay?: number;
}

export default function NewsletterSignup({ source = 'website', delay = 30 }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('selah_newsletter_dismissed');
  });

  // Show popup after delay (only once per session)
  useState(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setOpen(true), delay * 1000);
    return () => clearTimeout(timer);
  });

  if (dismissed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, source }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setDone(true);
      localStorage.setItem('selah_newsletter_dismissed', 'true');
      setTimeout(() => setOpen(false), 4000);
    } catch {
      setError('Network error — try again');
      setLoading(false);
    }
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('selah_newsletter_dismissed', 'true');
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20, x: 20 }}
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96"
        >
          <div className="rounded-2xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Header */}
            <div className="p-5 border-b border-white/[0.06] flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Sparkles size={20} className="text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm">Free CPM Cheat Sheet 📊</h3>
                <p className="text-xs text-muted-foreground mt-1">Know exactly what creators earn per 1,000 views.</p>
              </div>
              <button onClick={dismiss} className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors shrink-0">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {done ? (
                <div className="text-center py-4 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                    <Check size={24} className="text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold">Check your inbox! 📬</p>
                  <p className="text-xs text-muted-foreground">CPM Cheat Sheet is on its way.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground/60">The CPM Cheat Sheet includes:</p>
                    <ul className="text-[11px] text-muted-foreground space-y-1">
                      <li>• TikTok: $0.50–$1 CPM ($500–$1K/1M)</li>
                      <li>• Reels: $1–$3 CPM ($1K–$3K/1M)</li>
                      <li>• Shorts: $1–$5 CPM ($1K–$5K/1M)</li>
                    </ul>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
                  />
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-semibold hover:shadow-[0_0_16px_rgba(67,56,202,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Mail size={14} /> Send me the Cheat Sheet</>
                    )}
                  </button>
                  <p className="text-[9px] text-muted-foreground/40 text-center">
                    No spam. Unsubscribe anytime.
                  </p>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
