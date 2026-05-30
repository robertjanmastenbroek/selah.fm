'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X, Sparkles } from 'lucide-react';

export default function OnboardingBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user needs onboarding
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        // Show banner if user exists but hasn't onboarded
        if (data.user && !data.onboarded) {
          setVisible(true);
        }
      })
      .catch(() => {});
  }, []);

  if (!visible || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="w-full px-4 py-3"
        style={{ background: 'linear-gradient(135deg, rgba(67,56,202,0.15), rgba(139,143,255,0.08))' }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles size={18} className="text-primary shrink-0" />
            <p className="text-sm text-foreground/80">
              <span className="font-semibold text-foreground">Welcome to Selah.fm.</span>{' '}
              Set up your profile in 60 seconds to get personalized campaigns.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: '#4338CA' }}
            >
              Get started <ArrowRight size={14} />
            </Link>
            <button
              onClick={() => { setVisible(false); setDismissed(true); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
