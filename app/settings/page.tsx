'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [name, setName] = useState('Your Name');
  const [role, setRole] = useState<'artist' | 'creator'>('artist');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-void">
      <div className="sticky top-0 bg-void/95 backdrop-blur border-b border-white/5 px-4 py-4 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <a href={role === 'artist' ? '/dashboard' : '/browse'} className="text-muted text-sm hover:text-ivory">← Back</a>
          <span className="font-display text-gold text-lg">Settings</span>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="card-elevated">
          <h3 className="text-ivory font-semibold mb-4">Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="text-muted text-xs block mb-1.5">Display name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-void border border-white/10 rounded-xl px-4 py-3 text-ivory focus:outline-none focus:border-gold/50" />
            </div>
            <div>
              <label className="text-muted text-xs block mb-1.5">Account type</label>
              <div className="flex bg-void-card rounded-xl p-1">
                {(['artist', 'creator'] as const).map((r) => (
                  <button key={r} onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                      ${role === r ? 'bg-gold text-void' : 'text-muted hover:text-ivory'}`}>
                    {r === 'artist' ? '🎵 Artist' : '📱 Creator'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card-elevated">
          <h3 className="text-ivory font-semibold mb-4">Connected accounts</h3>
          <div className="space-y-3">
            {[
              { platform: 'TikTok', connected: false },
              { platform: 'Instagram', connected: false },
              { platform: 'YouTube', connected: false },
            ].map(({ platform, connected }) => (
              <div key={platform} className="flex items-center justify-between py-2">
                <span className="text-muted text-sm">{platform}</span>
                {connected ? (
                  <span className="text-green-400 text-xs font-semibold">Connected</span>
                ) : (
                  <button className="text-gold text-xs font-semibold hover:underline">Connect →</button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="btn-gold w-full !py-3 !rounded-xl">
          {saved ? '✓ Saved' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
