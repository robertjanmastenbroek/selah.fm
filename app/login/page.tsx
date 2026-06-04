'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { ArrowRight, Sparkles, Check, Shield, Music, Video, TrendingUp, Star, Quote, DollarSign, BadgeCheck } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const redirect = searchParams.get('redirect') || '';
  const claimCode = searchParams.get('claim') || '';
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'artist'|'creator'|'fan'>('creator');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [ageConsent, setAgeConsent] = useState(false);
  const [liveStats, setLiveStats] = useState<{ totalPaid: string; artists: string; campaigns: string } | null>(null);

  // Fetch live stats
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => {
        const paid = d.totalPaidCents || d.total_paid_cents || 0;
        const artists = d.artists || d.total_artists || 0;
        const campaigns = d.activeCampaigns || d.total_campaigns || 0;
        setLiveStats({
          totalPaid: paid >= 100000 ? `$${(paid / 100000).toFixed(1)}K` : `$${Math.round(paid / 100)}`,
          artists: artists >= 1000 ? `${(artists / 1000).toFixed(1)}K` : String(artists),
          campaigns: campaigns >= 1000 ? `${(campaigns / 1000).toFixed(1)}K` : String(campaigns),
        });
      })
      .catch(() => {
        setLiveStats({ totalPaid: '$0', artists: '2,000+', campaigns: '1,200+' });
      });
  }, []);



  // Capture signup source on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = {
      referrer: document.referrer || "",
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      path: window.location.pathname + window.location.search,
    };
    sessionStorage.setItem("selah_signup_source", JSON.stringify(source));
  }, []);

  const supabase = createClient();

  const buildRedirectUrl = () => {
    let next = redirect || '/browse';
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}${refCode ? "&ref="+refCode : ""}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        fetch('/api/analytics/event', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'login_submit', path:window.location.pathname, metadata:{ method: showEmailForm ? 'email' : 'google' } }) }).catch(()=>{});
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) { setError(authError.message); setLoading(false); return; }
        setTimeout(() => { window.location.href = redirect || '/browse'; }, 300);
      } else {
        fetch('/api/analytics/event', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ event: 'signup_start', path: window.location.pathname, session_id: sessionStorage.getItem('selah_session_id') || '', metadata: { method: 'email' } }) }).catch(e => console.error('Async error in login/page.tsx:', e));
        const { error: authError, data: signUpData } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
              user_type: role,
              is_artist: role === 'artist',
              is_creator: role === 'creator',
            },
            emailRedirectTo: buildRedirectUrl(),
          },
        });
        if (authError) { setError(authError.message); setLoading(false); return; }
        fetch('/api/analytics/event', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ event: 'signup_complete', path: window.location.pathname, metadata: { method: 'email' } }) }).catch(e => console.error('Async error in login/page.tsx:', e));
        // If auto-confirmed (session returned), redirect immediately
        if (signUpData?.session) {
          window.location.href = redirect || (role === 'fan' ? '/browse?welcome=fan' : '/onboarding');
        } else {
          window.location.href = `/verify?email=${encodeURIComponent(email)}`;
        }
        setLoading(false);
      }
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    fetch('/api/analytics/event', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ event:'google_signin_click', path:window.location.pathname, metadata:{ mode } }) }).catch(()=>{});
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: buildRedirectUrl(),
        },
      });
    } catch {
      setGoogleLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (resetError) setError(resetError.message);
    else setForgotSent(true);
    setLoading(false);
  };

  const benefits = [
    { icon: Shield, text: 'No bots·Real creators only' },
    { icon: TrendingUp, text: 'You set the CPM & approve every video' },
    { icon: Check, text: 'Only pay for verified views' },
    { icon: DollarSign, text: 'Free to start·Keep 80%' },
    { icon: BadgeCheck, text: 'Third-party view verification' },
  ];



  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.25) 0%, #0F0F23 60%), #0F0F23' }}>
      
      {/* Logo */}
      <a href="/" className="font-bold text-2xl mb-8" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
        Selah<span className="text-primary">.fm</span>
      </a>

      <div className="w-full max-w-sm space-y-4">
        {/* Referral banner */}
        {refCode && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400 text-center">
            🎁 You&apos;ve been referred! Get a 5% bonus on your first deposit.
          </div>
        )}

        {/* Success / Error */}
        {success && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-emerald-400">{success}</div>}
        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}

        {/* ── Forgot Password Mode ── */}
        {forgotMode ? (
          <form onSubmit={handleForgot} className="space-y-4">
            <h2 className="text-lg font-bold text-center">Reset your password</h2>
            <p className="text-sm text-muted-foreground text-center">Enter your email and we&apos;ll send you a reset link.</p>
            {forgotSent ? (
              <p className="text-sm text-emerald-400 text-center">Check your email for the reset link.</p>
            ) : (
              <>
                <Input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="Your email address" className="h-12 rounded-xl bg-white/[0.04] border-white/[0.06]" />
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl font-semibold">{loading ? 'Sending...' : 'Send reset link'}</Button>
              </>
            )}
            <button onClick={() => { setForgotMode(false); setForgotSent(false); }} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
              Back to login
            </button>
          </form>
        ) : showEmailForm ? (
          /* ── Email/Password Form ── */
          <>
            <button onClick={() => setShowEmailForm(false)} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-2">
              ← Back to all options
            </button>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div className="grid grid-cols-3 gap-2">
                  {[{r:'artist',label:'🎵 Artist',desc:'I promote my music'},{r:'creator',label:'📱 Creator',desc:'I create content'},{r:'fan',label:'❤️ Fan',desc:'I support artists'}].map(({r,label,desc})=>(
                    <button type="button" key={r} onClick={()=>setRole(r as any)}
                      className={`p-3 rounded-xl border-2 text-left transition-all text-xs ${role===r?'border-primary bg-primary/[0.04]':'border-white/[0.06] bg-white/[0.02]'}`}>
                      <div className="font-medium">{label}</div>
                      <div className="text-[10px] text-muted-foreground">{desc}</div>
                    </button>
                  ))}
                </div>
              )}
              {mode === 'signup' && (
                <Input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Display name"
                  className="h-12 rounded-xl bg-white/[0.04] border-white/[0.06]" />
              )}
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                className="h-12 rounded-xl bg-white/[0.04] border-white/[0.06]" />
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 6 chars)"
                className="h-12 rounded-xl bg-white/[0.04] border-white/[0.06]" />
              
              {mode === 'signup' && (
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={ageConsent} onChange={e => setAgeConsent(e.target.checked)} className="mt-0.5 shrink-0 rounded border-white/20" />
                  <span className="text-[11px] text-muted-foreground leading-relaxed">
                    I am 13+. By creating an account, I agree to the{' '}
                    <a href="/tos" className="text-primary hover:underline" target="_blank">Terms</a> and{' '}
                    <a href="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</a>.
                  </span>
                </label>
              )}

              <Button type="submit" disabled={loading || (mode === 'signup' && !ageConsent)} className="w-full h-12 rounded-xl font-semibold">
                {loading ? 'One moment...' : mode === 'login' ? 'Log in' : 'Create account'}
              </Button>
            </form>

            {mode === 'login' && (
              <button onClick={() => { setForgotMode(true); setForgotEmail(email); }} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                Forgot your password?
              </button>
            )}

            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
              {mode === 'login' ? "No account? Sign up" : "Have an account? Log in"}
            </button>
          </>
        ) : (
          /* ── PRIMARY: Google OAuth + Benefits ── */
          <>
            {/* Google — primary CTA */}
            <button onClick={handleGoogleSignIn} disabled={googleLoading}
              className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl font-semibold text-base text-white transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_0_24px_rgba(67,56,202,0.3)] active:scale-[0.98] disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #4338CA, #4338CA)' }}>
              {googleLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirecting...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/[0.06]" />
              <span className="text-[11px] text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-white/[0.06]" />
            </div>

            {/* Email option — secondary */}
            <button onClick={() => setShowEmailForm(true)}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-white/[0.08] bg-white/[0.02] text-sm font-medium hover:bg-white/[0.04] transition-all">
              Continue with email
            </button>

            {/* Benefits strip */}
            <div className="space-y-2 pt-2">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-muted-foreground/70">
                    <Icon size={14} className="text-primary/60 shrink-0" />
                    <span>{b.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Toggle login/signup */}
            <div className="text-center pt-2">
              <button onClick={() => { setShowEmailForm(true); setMode(mode === 'login' ? 'signup' : 'login'); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {mode === 'login' ? "New here? Create an account" : "Already have an account? Log in"}
              </button>
            </div>
          </>
        )}

        {/* Compact testimonial — no carousel, no overlap */}
        {!showEmailForm && !forgotMode && (
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-4 space-y-2.5">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map(s => (
                <svg key={s} className="w-3 h-3" viewBox="0 0 20 20" fill={s <= 4 ? '#F59E0B' : 'rgba(255,255,255,0.06)'}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed">&ldquo;Selah.fm connected me with creators who understood my sound. 50K verified views in the first week.&rdquo;</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-[9px] font-bold text-primary/60 shrink-0">RJ</div>
              <p className="text-[10px] text-muted-foreground/50"><span className="text-muted-foreground/70 font-medium">Robert-Jan</span> · Independent Artist</p>
              <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-300">Spotify</span>
            </div>
          </div>
        )}

        {/* Social proof stats — live from API */}
        <div className="pt-4 border-t border-white/[0.04]">
          <div className="flex items-center justify-center gap-6">
            {[
              { value: liveStats?.campaigns || '...', label: 'Funded tracks' },
              { value: liveStats?.artists || '...', label: 'Artists' },
              { value: liveStats?.totalPaid || '...', label: 'Paid to creators' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-sm font-bold">{s.value}</div>
                <div className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-3">
            💎 MIT licensed ·{' '}
            <a href="https://github.com/robertjanmastenbroek/selah.fm" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              GitHub
            </a>
            <span className="mx-2 opacity-30">·</span>
            <a href="/browse" className="hover:text-primary transition-colors">Browse first</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{background:'#0F0F23'}}>
      <div className="animate-pulse text-muted-foreground text-sm">Loading...</div>
    </div>}>
      <LoginForm />
    </Suspense>
  );
}
