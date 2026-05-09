'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { href: '/browse', label: 'Discover' },
  { href: '/dashboard', label: 'Dashboard' },
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

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-bg/80 backdrop-blur-lg border-b border-border-light">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14">
        <a href="/browse" className="font-display text-lg text-text tracking-tight font-bold">
          SendMusic.io
        </a>

        <nav className="hidden md:flex items-center gap-1">
          {tabs.map(t => {
            const active = pathname === t.href || pathname.startsWith(t.href + '/');
            return (
              <a key={t.href} href={t.href}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${active ? 'text-text' : 'text-text-muted hover:text-text-secondary'}`}>
                {t.label}
              </a>
            );
          })}
        </nav>

        <div ref={menuRef} className="relative">
          <button onClick={() => setOpen(!open)}
            className="w-8 h-8 rounded-full bg-bg-secondary border border-border flex items-center justify-center
                       text-xs font-semibold text-text-secondary hover:border-text-muted transition-colors">
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </button>
          {open && (
            <div className="absolute right-0 top-10 w-56 bg-bg border border-border rounded-2xl shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border-light">
                <div className="text-text text-sm font-medium">{profile?.name || 'User'}</div>
                <div className="text-text-muted text-xs mt-0.5">{profile?.email}</div>
              </div>
              <div className="py-1">
                <a href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-bg-secondary transition-colors">Dashboard</a>
                <a href="/earnings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-bg-secondary transition-colors">Earnings</a>
                <a href="/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-bg-secondary transition-colors">Settings</a>
              </div>
              <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}
                className="w-full text-left px-4 py-3 border-t border-border-light text-sm text-crimson hover:bg-red-50 transition-colors">
                Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile tabs */}
      <nav className="md:hidden flex items-center justify-around py-2 border-t border-border-light bg-bg">
        {tabs.slice(0, 4).map(t => (
          <a key={t.href} href={t.href}
            className={`text-[11px] font-medium px-2 py-1 transition-colors
              ${pathname === t.href ? 'text-text' : 'text-text-muted'}`}>
            {t.label}
          </a>
        ))}
      </nav>
    </header>
  );
}

// Re-export spacer — use <div className="h-14" /> after TopNav

