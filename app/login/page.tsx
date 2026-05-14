'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackSignUp, trackLogin } from '@/lib/analytics';

function LoginForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const redirect = searchParams.get('redirect') || '';
  const verifyToken = searchParams.get('verify') || '';
  const resetToken = searchParams.get('reset') || '';
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'artist'|'creator'>('creator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forgot password flow
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Reset password flow
  const [resetMode, setResetMode] = useState(!!resetToken);
  const [resetPassword, setResetPassword] = useState('');
  const [resetDone, setResetDone] = useState(false);

  // Auto-verify email if token in URL
  useEffect(() => {
    if (verifyToken) {
      fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: verifyToken }),
      }).then(r => r.json()).then(d => {
        if (d.verified) setSuccess('Email verified! You can now log in.');
        else setError('Verification link expired or invalid. Try signing up again.');
      }).catch(() => setError('Verification failed.'));
    }
  }, [verifyToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body: any = { email, password, name: name || email.split('@')[0], type: role };
    if (refCode && mode === 'signup') body.refCode = refCode;
    if (redirect && mode === 'login') body.redirect = redirect;
    const res = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.ok) {
      // GA tracking: match inline gtag format — dataLayer.push(['event', name, params])
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push(['event', mode === 'signup' ? 'sign_up' : 'login', { signup_method: 'email' }]);
      }
      mode === 'signup' ? trackSignUp('email') : trackLogin('email');
      // Brief delay to let GA flush the event before navigation
      setTimeout(() => {
        window.location.href = redirect || data.redirectTo || '/browse';
      }, 300);
    } else { setError(data.error); setLoading(false); }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail }),
    });
    await res.json();
    setForgotSent(true);
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password: resetPassword }),
    });
    const data = await res.json();
    if (data.reset) { setResetDone(true); setSuccess('Password reset! You can now log in.'); }
    else { setError(data.error); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <a href="/" className="font-semibold text-2xl mb-8">Selah<span className="text-accent-foreground">.fm</span></a>
      <div className="w-full max-w-sm space-y-4">
        {refCode && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-sm text-accent-foreground text-center">
            🎁 You&apos;ve been referred! When you make your first deposit, you and your referrer both get a 5% bonus.
          </div>
        )}
        {success && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">{success}</div>}
        {error && <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">{error}</div>}

        {resetMode ? (
          <form onSubmit={handleReset} className="space-y-3">
            <h2 className="text-lg font-semibold text-center">Reset your password</h2>
            <Input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} placeholder="New password (min 8 characters)" />
            <Button type="submit" disabled={loading || resetDone} className="w-full">{loading ? '...' : 'Set new password'}</Button>
            {resetDone && <Button variant="ghost" className="w-full" onClick={() => { setResetMode(false); setSuccess(''); }}>Back to login</Button>}
          </form>
        ) : forgotMode ? (
          <form onSubmit={handleForgot} className="space-y-3">
            <h2 className="text-lg font-semibold text-center">Forgot your password?</h2>
            <p className="text-sm text-muted-foreground text-center">Enter your email and we&apos;ll send you a reset link.</p>
            {forgotSent ? (
              <p className="text-sm text-emerald-400 text-center">Check your email for the reset link.</p>
            ) : (
              <>
                <Input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Your email address" />
                <Button type="submit" disabled={loading} className="w-full">{loading ? '...' : 'Send reset link'}</Button>
              </>
            )}
            <Button variant="ghost" className="w-full" onClick={() => { setForgotMode(false); setForgotSent(false); }}>Back to login</Button>
          </form>
        ) : (
          <>
            <a href="/api/oauth/google" className="flex items-center justify-center gap-2 w-full border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </a>
            <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" /></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-2">
                  {[{r:'artist',label:'🎵 Artist',desc:'I want to promote'},{r:'creator',label:'📱 Creator',desc:'I want to earn'}].map(({r,label,desc})=>(
                    <button type="button" key={r} onClick={()=>setRole(r as any)}
                      className={`p-3 rounded-xl border-2 text-left transition-all text-xs ${role===r?'border-primary bg-primary/[0.04]':'border-white/[0.06] bg-white/[0.02]'}`}>
                      <div className="font-medium">{label}</div><div className="text-[10px] text-muted-foreground">{desc}</div>
                    </button>
                  ))}
                </div>
              )}
              {mode === 'signup' && <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Display name" />}
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
              <Button type="submit" disabled={loading} className="w-full">{loading ? '...' : mode === 'login' ? 'Log in' : 'Create account'}</Button>
            </form>
            {mode === 'login' && (
              <button onClick={() => { setForgotMode(true); setForgotEmail(email); }} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                Forgot your password?
              </button>
            )}
            <Button variant="ghost" className="w-full" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
              {mode === 'login' ? "No account? Sign up" : "Have an account? Log in"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
