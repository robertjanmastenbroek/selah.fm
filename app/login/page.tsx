'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [type, setType] = useState<'artist' | 'creator'>('artist');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth — redirect to dashboard
    await new Promise(r => setTimeout(r, 800));
    window.location.href = type === 'artist' ? '/dashboard' : '/browse';
  };

  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="font-display text-gold text-2xl mb-2">sendmusic.io</div>
        <p className="text-muted text-sm">
          {mode === 'login' ? 'Welcome back' : 'Start earning or promoting'}
        </p>
      </div>

      {/* Type toggle — who are you? */}
      <div className="flex bg-void-card rounded-xl p-1 mb-6 w-full max-w-sm">
        {(['artist', 'creator'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
              ${type === t ? 'bg-gold text-void' : 'text-muted hover:text-ivory'}`}
          >
            {t === 'artist' ? '🎵 Artist' : '📱 Creator'}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg
                     placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg
                     placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all"
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full text-lg !py-3.5 !rounded-xl"
        >
          {loading ? '...' : mode === 'login' ? `Log in as ${type}` : `Create ${type} account`}
        </button>
      </form>

      {/* Mode toggle */}
      <button
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
        className="mt-6 text-muted text-sm hover:text-gold transition-colors"
      >
        {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
      </button>
    </div>
  );
}
