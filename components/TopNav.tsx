'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function TopNav() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setProfile(d.user);
    });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const tabs = [
    { href: '/dashboard', label: 'Campaigns', icon: '📊' },
    { href: '/browse', label: 'Browse', icon: '🔍' },
    { href: '/review', label: 'Review', icon: '✅' },
    { href: '/earnings', label: 'Earnings', icon: '💰' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-void/95 backdrop-blur border-b border-white/5">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <a href="/dashboard" className="font-display text-gold text-lg flex-shrink-0">
          SendMusic.io
        </a>

        {/* Center tabs — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map(t => (
            <a key={t.href} href={t.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${pathname === t.href ? 'bg-gold/10 text-gold' : 'text-muted hover:text-ivory hover:bg-void-card'}`}>
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </a>
          ))}
        </nav>

        {/* Profile — right */}
        <div ref={menuRef} className="relative">
          <button onClick={() => setOpen(!open)}
            className="w-9 h-9 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold border border-gold/30 hover:bg-gold/30 transition-all">
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </button>
          {open && (
            <div className="absolute right-0 top-11 w-56 bg-void-card border border-white/10 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5">
                <div className="text-ivory text-sm font-semibold">{profile?.name || 'User'}</div>
                <div className="text-muted text-xs">{profile?.email}</div>
              </div>
              <div className="py-1">
                <a href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-ivory hover:bg-void-elevated transition-colors">📊 Dashboard</a>
                <a href="/earnings" className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-ivory hover:bg-void-elevated transition-colors">💰 Earnings</a>
                <a href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-ivory hover:bg-void-elevated transition-colors">⚙️ Settings</a>
              </div>
              <button onClick={handleLogout}
                className="w-full text-left px-4 py-3 border-t border-white/5 text-sm text-crimson-light hover:bg-crimson/10 transition-colors">
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom tabs — mobile */}
      <nav className="md:hidden flex items-center justify-around py-2 border-t border-white/5">
        {tabs.map(t => (
          <a key={t.href} href={t.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors
              ${pathname === t.href ? 'text-gold' : 'text-muted hover:text-ivory'}`}>
            <span className="text-lg">{t.icon}</span>
            <span className="text-[10px] font-medium">{t.label}</span>
          </a>
        ))}
      </nav>
    </header>
  );
}
