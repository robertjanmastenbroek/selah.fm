'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Mail, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  source?: string;
  delay?: number;
}

export default function NewsletterSignup({ source = 'website', delay = 30 }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [me, setMe] = useState<{ id: string; email: string; display_name: string } | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('selah_newsletter_dismissed');
  });

  // Check auth on mount
  useEffect(() => {
    if (dismissed) return;
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.user) setMe(d.user); })
      .catch(() => {});
  }, [dismissed]);

  // Show popup after delay
  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setOpen(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [dismissed, delay]);

  if (dismissed) return null;

  const supabase = createClient();

  const subscribe = async (subEmail: string, subName: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail, name: subName, source }),
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback?next=${window.location.pathname}` },
      });
      if (authError) { setError(authError.message); setGoogleLoading(false); }
    } catch { setGoogleLoading(false); }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    subscribe(email, name || email.split('@')[0]);
  };

  const handleOneClickSubscribe = () => {
    if (me) subscribe(me.email, me.display_name || me.email.split('@')[0]);
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
                <div className="space-y-3">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-1">
                    <p className="text-[10px] text-muted-foreground/60">The CPM Cheat Sheet includes:</p>
                    <ul className="text-[11px] text-muted-foreground space-y-1">
                      <li>• TikTok: $0.50–$1 CPM ($500–$1K/1M)</li>
                      <li>• Reels: $1–$3 CPM ($1K–$3K/1M)</li>
                      <li>• Shorts: $1–$5 CPM ($1K–$5K/1M)</li>
                    </ul>
                  </div>

                  {me ? (
                    /* ── Logged in: 1-click subscribe ── */
                    <div className="space-y-3">
                      <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                          {me.display_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{me.display_name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{me.email}</p>
                        </div>
                      </div>
                      <button onClick={handleOneClickSubscribe} disabled={loading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-semibold hover:shadow-[0_0_16px_rgba(67,56,202,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Mail size={14} /> Send me the Cheat Sheet</>
                        )}
                      </button>
                    </div>
                  ) : showEmailForm ? (
                    /* ── Email form (fallback) ── */
                    <form onSubmit={handleEmailSubmit} className="space-y-3">
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Your name (optional)"
                        className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="Email address" required
                        className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none" />
                      {error && <p className="text-xs text-red-400">{error}</p>}
                      <button type="submit" disabled={loading || !email}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white text-sm font-semibold hover:shadow-[0_0_16px_rgba(67,56,202,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Mail size={14} /> Send me the Cheat Sheet</>}
                      </button>
                      <button type="button" onClick={() => setShowEmailForm(false)}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                        ← Back
                      </button>
                    </form>
                  ) : (
                    /* ── Not logged in: Google OAuth primary ── */
                    <div className="space-y-3">
                      <button onClick={handleGoogleSignIn} disabled={googleLoading}
                        className="w-full py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-semibold hover:bg-white/[0.04] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                        {googleLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        )}
                        Continue with Google
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[10px] text-muted-foreground">or</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                      </div>
                      <button onClick={() => setShowEmailForm(true)}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Continue with email
                      </button>
                      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
                    </div>
                  )}

                  <p className="text-[9px] text-muted-foreground/40 text-center pt-1">
                    No spam. Unsubscribe anytime.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
