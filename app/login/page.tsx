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
