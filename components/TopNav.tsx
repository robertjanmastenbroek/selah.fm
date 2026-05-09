'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { href: '/dashboard', label: 'Campaigns' },
  { href: '/browse', label: 'Browse' },
  { href: '/review', label: 'Review' },
  { href: '/earnings', label: 'Earnings' },
];

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

  return (
    <>
      {/* Desktop header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-void/70 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
          <a href="/dashboard" className="font-display text-gold text-lg tracking-tight">
            SendMusic.io
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map(t => {
              const active = pathname === t.href || (t.href !== '/dashboard' && pathname.startsWith(t.href));
              return (
                <a key={t.href} href={t.href}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${active ? 'text-ivory' : 'text-muted/60 hover:text-muted'}`}>
                  {t.label}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-gold rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          <div ref={menuRef} className="relative">
            <button onClick={() => setOpen(!open)}
              className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/[0.06] flex items-center justify-center
                         text-xs font-semibold text-muted-light hover:border-white/[0.15] transition-all duration-200">
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </button>
            {open && (
              <div className="absolute right-0 top-10 w-56 bg-void-card/95 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <div className="text-ivory text-sm font-medium">{profile?.name || 'User'}</div>
                  <div className="text-muted/60 text-xs mt-0.5">{profile?.email}</div>
                </div>
                <div className="py-1">
                  <a href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-ivory hover:bg-white/[0.04] transition-colors">Dashboard</a>
                  <a href="/earnings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-ivory hover:bg-white/[0.04] transition-colors">Earnings</a>
                  <a href="/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-ivory hover:bg-white/[0.04] transition-colors">Settings</a>
                </div>
                <button onClick={handleLogout}
                  className="w-full text-left px-4 py-3 border-t border-white/[0.06] text-sm text-crimson-light/80 hover:bg-crimson/5 transition-colors">
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile bottom tabs */}
        <nav className="md:hidden flex items-center justify-around py-2 border-t border-white/[0.06] bg-void/80 backdrop-blur-xl">
          {tabs.map(t => {
            const active = pathname === t.href;
            return (
              <a key={t.href} href={t.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors
                  ${active ? 'text-gold' : 'text-muted/40 hover:text-muted'}`}>
                <span className="text-[11px] font-medium">{t.label}</span>
              </a>
            );
          })}
        </nav>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-14 md:h-14" />
    </>
  );
}
