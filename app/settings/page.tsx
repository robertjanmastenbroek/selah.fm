'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/TopNav';

export default function SettingsPage() {
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setProfile(d.user);
    });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <main className="page-container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="section-title mb-1">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Profile card */}
          <div className="card p-6">
            <h2 className="text-text font-medium text-sm mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="text-text-muted text-xs mb-1.5 block">Display name</label>
                <input defaultValue={profile?.name || ''} className="input-field" />
              </div>
              <div>
                <label className="text-text-muted text-xs mb-1.5 block">Email</label>
                <input defaultValue={profile?.email || ''} disabled className="input-field opacity-60" />
              </div>
              <button className="btn-primary text-sm">Save changes</button>
            </div>
          </div>

          {/* Connected accounts */}
          <div className="card p-6">
            <h2 className="text-text font-medium text-sm mb-4">Connected accounts</h2>
            <div className="space-y-3">
              {[
                { name: 'Google', connected: true, icon: 'G' },
                { name: 'TikTok', connected: false, icon: 'T' },
                { name: 'Instagram', connected: false, icon: 'I' },
                { name: 'YouTube', connected: false, icon: 'Y' },
              ].map(p => (
                <div key={p.name} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs font-semibold text-muted/60">
                      {p.icon}
                    </div>
                    <div>
                      <div className="text-text text-sm">{p.name}</div>
                      <div className="text-text-muted text-[11px]">
                        {p.connected ? 'Connected' : 'Not connected'}
                      </div>
                    </div>
                  </div>
                  {p.connected ? (
                    <span className="text-emerald-400/60 text-[11px] font-medium">Connected</span>
                  ) : (
                    <button className="text-gold/70 text-[11px] font-medium hover:text-gold transition-colors">
                      Connect
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Danger zone */}
          <div className="card p-6">
            <h2 className="text-crimson-light/70 font-medium text-sm mb-4">Account</h2>
            <button onClick={handleLogout}
              className="btn-secondary w-full !border-crimson-light/20 !text-crimson-light/70 hover:!bg-crimson/5">
              Log out
            </button>
          </div>

          <div className="text-center text-text-muted text-xs py-4">
            SendMusic.io v0.2
          </div>
        </div>
      </main>
    </div>
  );
}
