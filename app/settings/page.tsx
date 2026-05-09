'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [userType, setUserType] = useState('artist');
  const [displayName, setDisplayName] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) {
        setUserType(d.user.type);
        setDisplayName(d.user.name);
      }
    });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-void pb-20">
      <div className="sticky top-0 bg-void/95 backdrop-blur border-b border-white/5 px-4 py-4 z-10">
        <div className="max-w-lg mx-auto">
          <span className="font-display text-gold text-lg">Settings</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Profile */}
        <div className="card-elevated !p-6">
          <h3 className="text-ivory font-semibold mb-4">Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="text-muted text-xs block mb-1">Display name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-void border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm
                           focus:outline-none focus:border-gold/50 transition-all" />
            </div>
            <div>
              <label className="text-muted text-xs block mb-1">Account type</label>
              <div className="flex bg-void border border-white/10 rounded-xl p-1">
                {(['artist', 'creator'] as const).map((t) => (
                  <button key={t} onClick={() => setUserType(t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                      ${userType === t ? 'bg-gold/20 text-gold' : 'text-muted'}`}>
                    {t === 'artist' ? '🎵 Artist' : '📱 Creator'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Connected accounts */}
        <div className="card-elevated !p-6">
          <h3 className="text-ivory font-semibold mb-4">Connected accounts</h3>
          <div className="space-y-3">
            {[
              { name: 'TikTok', icon: '🎵', color: '#ff0050' },
              { name: 'Instagram', icon: '📸', color: '#E1306C' },
              { name: 'YouTube', icon: '▶️', color: '#FF0000' },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: p.color + '20' }}>{p.icon}</div>
                  <span className="text-ivory text-sm">{p.name}</span>
                </div>
                <button className="btn-secondary !py-1.5 !px-3 text-xs !rounded-lg">Connect →</button>
              </div>
            ))}
          </div>
        </div>

        {/* Account actions */}
        <div className="card-elevated !p-6">
          <button onClick={handleLogout}
            className="w-full py-3 text-crimson-light text-sm font-semibold rounded-xl border border-crimson/30 hover:bg-crimson/10 transition-all">
            Log out
          </button>
        </div>

        <div className="text-center text-muted text-xs pt-4">
          SendMusic.io v0.1 — Artist + Creator marketplace
        </div>
      </div>
    </div>
  );
}
