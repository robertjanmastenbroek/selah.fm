'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function LoginForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'artist'|'creator'>('creator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body: any = { email, password, name: name || email.split('@')[0], type: role };
    if (refCode && mode === 'signup') body.refCode = refCode;
    const res = await fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if (data.ok) window.location.href = data.redirectTo || '/browse';
    else { setError(data.error); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <a href="/" className="font-semibold text-2xl mb-8">Selah<span className="text-accent-foreground">.fm</span></a>
      <div className="w-full max-w-sm space-y-4">
        {refCode && (
          <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-sm text-accent-foreground text-center">
            🎁 You&apos;ve been referred! Sign up and both of you get a $5 bonus.
          </div>
        )}
        <a href="/api/oauth/google" className="flex items-center justify-center gap-2 w-full border rounded-xl py-3 text-sm font-medium hover:bg-muted transition-colors">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </a>
        <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground">or</span><div className="flex-1 h-px bg-border" /></div>
        {error && <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">{error}</div>}
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
        <Button variant="ghost" className="w-full" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
          {mode === 'login' ? "No account? Sign up" : "Have an account? Log in"}
        </Button>
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
