'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, LoaderCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * LoginModal — Professional sign-in/sign-up modal with Google OAuth + email.
 * Used when an unauthenticated user tries to interact with a campaign.
 */
export default function LoginModal({ open, onClose, redirectUrl }: {
  open: boolean; onClose: () => void; redirectUrl?: string;
}) {
  const [mode, setMode] = useState<'choose' | 'email'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/api/auth/callback${redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}` },
      });
      if (error) setError(error.message);
    } catch { setError('Connection error. Please try again.'); }
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
        });
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('An account with this email already exists. Try signing in.');
          } else {
            setError(signUpError.message);
          }
        } else {
          setMessage('Check your email for a confirmation link.');
          setTimeout(() => onClose(), 3000);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            setError('Wrong email or password.');
          } else {
            setError(signInError.message);
          }
        } else {
          window.location.href = redirectUrl || '/dashboard';
        }
      }
    } catch { setError('Connection error. Please try again.'); }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
          <motion.div initial={{ y: 30, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border"
            style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.08)' }}>
            
          <div className="p-6 space-y-5">
            {/* Close button */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: '#F4F1EA' }}>
                {mode === 'choose' ? 'Join Selah.fm' : isSignUp ? 'Create account' : 'Sign in'}
              </h2>
              <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/[0.06] transition-all active:scale-90">
                <X size={18} style={{ color: '#6B6760' }} />
              </button>
            </div>

            {mode === 'choose' ? (
              <>
                <p className="text-sm" style={{ color: '#6B6760' }}>Sign up to boost songs, earn as a creator, or manage your artist page.</p>

                {/* Google */}
                <button onClick={handleGoogleSignIn} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F4F1EA' }}>
                  {loading ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  )}
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <span className="text-[11px]" style={{ color: '#6B6760' }}>or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Email option */}
                <button onClick={() => setMode('email')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
                  style={{ background: 'rgba(214,168,95,0.08)', border: '1px solid rgba(214,168,95,0.2)', color: '#D6A85F' }}>
                  <Mail size={16} /> Continue with email
                </button>

                {error && (
                  <p className="text-xs text-center" style={{ color: '#EF4444' }}>{error}</p>
                )}
              </>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {/* Toggle sign-in / sign-up */}
                <div className="flex p-0.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  {['Sign in', 'Sign up'].map((label) => {
                    const active = (label === 'Sign up') === isSignUp;
                    return (
                      <button key={label} type="button" onClick={() => { setIsSignUp(label === 'Sign up'); setError(''); }}
                        className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all"
                        style={active ? { background: 'rgba(214,168,95,0.15)', color: '#D6A85F' } : { color: '#6B6760' }}>
                        {label}
                      </button>
                    );
                  })}
                </div>

                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email address" required
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#D6A85F]/40 focus:outline-none" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password (min. 6 characters)" required minLength={6}
                  className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#D6A85F]/40 focus:outline-none" />

                {error && <p className="text-xs" style={{ color: '#EF4444' }}>{error}</p>}
                {message && <p className="text-xs" style={{ color: '#22C55E' }}>{message}</p>}

                <button type="submit" disabled={loading || !email || !password}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #D6A85F, #C9974D)' }}>
                  {loading ? <LoaderCircle size={16} className="animate-spin mx-auto" /> : (isSignUp ? 'Create account' : 'Sign in')}
                </button>

                <button type="button" onClick={() => { setMode('choose'); setError(''); setMessage(''); }}
                  className="w-full text-xs text-center" style={{ color: '#6B6760' }}>
                  ← All sign-in options
                </button>
              </form>
            )}
          </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
