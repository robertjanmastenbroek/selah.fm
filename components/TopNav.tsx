'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { href: '/browse', label: 'Discover' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/review', label: 'Review' },
  { href: '/earnings', label: 'Earnings' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      {/* ---- Top header ---- */}
      <header className="fixed top-0 inset-x-0 z-50 bg-bg/95 backdrop-blur-sm border-b border-border-light">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-12 px-4 sm:px-6 lg:px-8">
          {/* Logo + Desktop nav */}
          <div className="flex items-center gap-6">
            <a href="/browse" className="text-text font-semibold text-lg tracking-tight shrink-0">
              SendMusic<span className="text-gold">.io</span>
            </a>
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map(t => {
                const active = pathname === t.href || pathname.startsWith(t.href + '/');
                return (
                  <a key={t.href} href={t.href}
                    className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors
                      ${active ? 'bg-bg-secondary text-text' : 'text-text-muted hover:text-text-secondary'}`}>
                    {t.label}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Profile */}
          <div ref={menuRef} className="relative shrink-0">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-7 h-7 rounded-full bg-bg-secondary border border-border flex items-center justify-center
                         text-xs font-semibold text-text-secondary hover:border-text-muted transition-colors">
              {profile?.name?.[0]?.toUpperCase() || '☺'}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-52 bg-bg border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border-light">
                  <p className="text-text text-sm font-medium truncate">{profile?.name || 'User'}</p>
                  <p className="text-text-muted text-xs mt-0.5 truncate">{profile?.email}</p>
                </div>
                <a href="/dashboard" className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-bg-secondary transition-colors">Dashboard</a>
                <a href="/earnings" className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-bg-secondary transition-colors">Earnings</a>
                <a href="/settings" className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-bg-secondary transition-colors">Settings</a>
                <button onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); }}
                  className="w-full text-left px-4 py-3 border-t border-border-light text-sm text-crimson hover:bg-red-50 transition-colors">
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ---- Bottom tabs (mobile only) ---- */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-bg/95 backdrop-blur-sm border-t border-border-light flex items-center justify-around h-12 pb-safe">
        {tabs.map(t => {
          const active = pathname === t.href || pathname.startsWith(t.href + '/');
          return (
            <a key={t.href} href={t.href}
              className={`flex flex-col items-center justify-center h-full px-3 text-[10px] font-medium transition-colors
                ${active ? 'text-gold' : 'text-text-muted'}`}>
              {t.label}
            </a>
          );
        })}
      </nav>
    </>
  );
}
