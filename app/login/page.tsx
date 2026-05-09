'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
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
    const body: any = { email, password, type: 'creator' };
    if (mode === 'signup') body.name = name || email.split('@')[0];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.ok) {
      window.location.href = '/dashboard';
    } else {
      setError(data.error || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-4">
      <div className="text-center mb-10">
        <div className="font-display text-gold text-3xl mb-2">SendMusic.io</div>
        <p className="text-muted text-sm">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </p>
        <p className="text-muted/60 text-xs mt-2">Create campaigns. Browse music. Earn from views. One account does it all.</p>
      </div>

      {error && (
        <div className="w-full max-w-sm bg-crimson/10 border border-crimson/30 rounded-xl px-4 py-3 mb-4 text-sm text-crimson-light">
          {error}
        </div>
      )}

      {/* Google login */}
      <div className="w-full max-w-sm mb-4">
        <a href="/api/oauth/google"
          className="w-full bg-white text-gray-800 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-all text-sm">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </a>
      </div>

      <div className="w-full max-w-sm flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-muted text-xs">or with email</span>
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {mode === 'signup' && (
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Display name" required
            className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all" />
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" required
          className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" required
          className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all" />

        <button type="submit" disabled={loading}
          className="btn-gold w-full text-lg !py-3.5 !rounded-xl">
          {loading ? '...' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>

      <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
        className="mt-6 text-muted text-sm hover:text-gold transition-colors">
        {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
      </button>
    </div>
  );
}
