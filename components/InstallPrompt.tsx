'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

/**
 * PWA Install Prompt — shows when the browser fires beforeinstallprompt.
 * Uses a deferred prompt to present a native install UI.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Check if user already dismissed
    if (localStorage.getItem('selah_install_dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a bit before showing — don't interrupt first visit
      setTimeout(() => setShowPrompt(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Track successful install
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.setItem('selah_install_dismissed', 'true');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('selah_install_dismissed', 'true');
  };

  if (installed || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[9999]"
      >
        <div className="rounded-2xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl p-4 backdrop-blur-xl">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Download size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Install Selah.fm</p>
              <p className="text-[11px] text-muted-foreground">Get push notifications and faster access</p>
            </div>
            <button onClick={dismiss} className="p-1 rounded-lg hover:bg-white/[0.06] text-muted-foreground">
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={dismiss} className="flex-1 py-2 rounded-xl border border-white/[0.08] text-xs font-medium text-muted-foreground hover:bg-white/[0.04] transition-colors">
              Not now
            </button>
            <button onClick={handleInstall} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all">
              Install
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
