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
    <>
      {/* Top header — logo + desktop nav + profile */}
      <header className="fixed top-0 inset-x-0 z-50 bg-bg/90 backdrop-blur-lg border-b border-border-light">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-12">
          <a href="/browse" className="font-bold text-text text-lg">
            SendMusic<span className="text-gold">.io</span>
          </a>

          <nav className="hidden md:flex items-center gap-0.5">
            {tabs.map(t => {
              const active = pathname === t.href || pathname.startsWith(t.href + '/');
              return (
                <a key={t.href} href={t.href}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                    ${active ? 'bg-bg-secondary text-text' : 'text-text-muted hover:text-text'}`}>
                  {t.label}
                </a>
              );
            })}
          </nav>

          <div ref={menuRef} className="relative">
            <button onClick={() => setOpen(!open)}
              className="w-7 h-7 rounded-full bg-bg-secondary border border-border flex items-center justify-center
                         text-[10px] font-bold text-text-secondary hover:border-text-muted transition-colors">
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </button>
            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-9 w-56 bg-bg border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-light">
                    <div className="text-text text-sm font-medium">{profile?.name || 'User'}</div>
                    <div className="text-text-muted text-xs mt-0.5">{profile?.email}</div>
                  </div>
                  <a href="/dashboard" className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-bg-secondary transition-colors">Dashboard</a>
                  <a href="/earnings" className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-bg-secondary transition-colors">Earnings</a>
                  <a href="/settings" className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-bg-secondary transition-colors">Settings</a>
                  <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}
                    className="w-full text-left px-4 py-3 border-t border-border-light text-sm text-crimson hover:bg-red-50 transition-colors">
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Bottom tabs — mobile only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-bg/90 backdrop-blur-lg border-t border-border-light flex items-center justify-around py-1 safe-area-bottom">
        {tabs.map(t => {
          const active = pathname === t.href || pathname.startsWith(t.href + '/');
          return (
            <a key={t.href} href={t.href}
              className={`flex flex-col items-center px-2 py-1 text-[10px] font-medium transition-colors
                ${active ? 'text-text' : 'text-text-muted'}`}>
              <span className="text-base mb-0.5">
                {t.href === '/browse' && '♫'}
                {t.href === '/dashboard' && '▤'}
                {t.href === '/review' && '✓'}
                {t.href === '/earnings' && '$'}
              </span>
              {t.label}
            </a>
          );
        })}
      </nav>
    </>
  );
}
