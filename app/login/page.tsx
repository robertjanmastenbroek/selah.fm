'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [type, setType] = useState<'artist' | 'creator'>('artist');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const body: any = { email, password, type };
    if (mode === 'signup') body.name = name || email.split('@')[0];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.ok) {
      window.location.href = type === 'artist' ? '/dashboard' : '/browse';
    } else {
      setError(data.error || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="font-display text-gold text-2xl mb-2">SendMusic.io</div>
        <p className="text-muted text-sm">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </p>
      </div>

      <div className="flex bg-void-card rounded-xl p-1 mb-6 w-full max-w-sm">
        {(['artist', 'creator'] as const).map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
              ${type === t ? 'bg-gold text-void' : 'text-muted hover:text-ivory'}`}>
            {t === 'artist' ? '🎵 Artist' : '📱 Creator'}
          </button>
        ))}
      </div>

      {error && (
        <div className="w-full max-w-sm bg-crimson/10 border border-crimson/30 rounded-xl px-4 py-3 mb-4 text-sm text-crimson-light">
          {error}
        </div>
      )}

      {/* Social login */}
      <div className="w-full max-w-sm space-y-3 mb-4">
        <a href="/api/auth/signin/google"
          className="w-full bg-white text-gray-800 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all text-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </a>
        <a href="/api/auth/signin/apple"
          className="w-full bg-white text-gray-800 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all text-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          Continue with Apple
        </a>
      </div>

      <div className="w-full max-w-sm flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-muted text-xs">or</span>
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {mode === 'signup' && (
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Display name" required
            className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg
                       placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all" />
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" required
          className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg
                     placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" required
          className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg
                     placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all" />

        <button type="submit" disabled={loading}
          className="btn-gold w-full text-lg !py-3.5 !rounded-xl">
          {loading ? '...' : mode === 'login' ? `Log in` : `Create account`}
        </button>
      </form>

      <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
        className="mt-6 text-muted text-sm hover:text-gold transition-colors">
        {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
      </button>
    </div>
  );
}
