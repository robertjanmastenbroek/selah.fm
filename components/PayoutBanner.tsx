'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, X, LoaderCircle, Check } from 'lucide-react';

interface Props {
  userId: string;
  hasStripeConnect: boolean;
  hasApprovedEarnings: boolean;
}

const DISMISS_KEY = 'selah-payout-banner-dismissed';

export function PayoutBanner({ userId, hasStripeConnect, hasApprovedEarnings }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(DISMISS_KEY);
    if (saved) {
      const ts = parseInt(saved, 10);
      if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  if (hasStripeConnect || dismissed || done) return null;
  if (!hasApprovedEarnings) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.url) {
        setDone(true);
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to open Stripe');
        setLoading(false);
      }
    } catch {
      setError('Network error');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-amber-500/[0.06] to-rose-500/[0.03] border border-amber-500/15 backdrop-blur-xl p-4 relative overflow-hidden"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
          <Wallet size={18} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-100">Complete your payout setup</p>
          <p className="text-xs text-amber-200/60 mt-0.5">
            You have approved earnings waiting. Connect Stripe to receive payouts directly to your bank.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={handleConnect} disabled={loading}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-60 active:scale-95">
              {loading ? <><LoaderCircle size={12} className="animate-spin" /> Connecting...</> : <><Wallet size={12} /> Connect Stripe</>}
            </button>
            <button onClick={dismiss} className="text-[10px] text-amber-200/40 hover:text-amber-200/60 transition-colors">Remind me later</button>
          </div>
          {error && <p className="text-[10px] text-red-400 mt-2">{error}</p>}
        </div>
        <button onClick={dismiss} className="shrink-0 p-1 text-amber-200/30 hover:text-amber-200/60 transition-colors"><X size={14} /></button>
      </div>
    </motion.div>
  );
}
