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
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setProfile(d.user);
    });
  }, []);

  return (
    <>
      {/* === TOP BAR === */}
      <div className="fixed top-0 inset-x-0 z-50 bg-bg/95 backdrop-blur-sm border-b border-border-light">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-12 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <a href="/browse" className="font-semibold text-text text-base">
              SendMusic<span className="text-gold">.io</span>
            </a>
            
            {/* Desktop nav — hidden on mobile */}
            <div className="hidden md:flex items-center gap-0.5">
              {tabs.map(t => (
                <a key={t.href} href={t.href}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                    ${pathname === t.href || pathname.startsWith(t.href + '/') 
                      ? 'bg-bg-secondary text-text' 
                      : 'text-text-muted hover:text-text-secondary'}`}>
                  {t.label}
                </a>
              ))}
            </div>
          </div>

          {/* Profile button */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 rounded-full bg-bg-secondary border border-border flex items-center justify-center
                       text-xs font-semibold text-text-secondary shrink-0">
            {profile?.name?.[0]?.toUpperCase() || '☺'}
          </button>
        </div>
      </div>

      {/* === PROFILE DROPDOWN (fixed to viewport) === */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setMenuOpen(false)} />
          <div className="fixed top-12 right-4 sm:right-6 z-[70] w-56 bg-bg border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border-light">
              <p className="text-text text-sm font-medium truncate">{profile?.name || 'User'}</p>
              <p className="text-text-muted text-xs mt-0.5 truncate">{profile?.email}</p>
            </div>
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/earnings', label: 'Earnings' },
              { href: '/settings', label: 'Settings' },
            ].map(item => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-text-secondary hover:text-text hover:bg-bg-secondary transition-colors">
                {item.label}
              </a>
            ))}
            <button onClick={async () => {
              setMenuOpen(false);
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }} className="w-full text-left px-4 py-3 border-t border-border-light text-sm text-crimson hover:bg-red-50 transition-colors">
              Log out
            </button>
          </div>
        </>
      )}

      {/* === BOTTOM NAV (mobile only) === */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-bg/95 backdrop-blur-sm border-t border-border-light flex items-center justify-around h-12">
        {tabs.map(t => {
          const active = pathname === t.href || pathname.startsWith(t.href + '/');
          return (
            <a key={t.href} href={t.href}
              className={`text-[11px] font-medium px-3 py-2 transition-colors
                ${active ? 'text-gold' : 'text-text-muted'}`}>
              {t.label}
            </a>
          );
        })}
      </div>
    </>
  );
}
