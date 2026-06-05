'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem('cookie-consent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] rounded-2xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl p-4 backdrop-blur-xl">
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        This site uses cookies for authentication, analytics, and essential functionality. 
        By continuing, you agree to our{' '}
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>
      <div className="flex gap-2">
        <button
          onClick={reject}
          className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-xs font-medium text-muted-foreground hover:bg-white/[0.04] transition-colors active:scale-[0.98]"
        >
          Reject all
        </button>
        <button
          onClick={accept}
          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
