'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';

const mainLinks = [
  { href: '/browse', label: 'Campaigns' },
  { href: '/artists', label: 'Artists' },
  { href: '/creators', label: 'Creators' },
];

/* ── SVG icons ──────────────────────────────────────────────── */
const Icons = {
  Dashboard: () => (<svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>),
  Review: () => (<svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2h12v3H2zM2 7h12v3H2zM2 12h12v3H2z"/><path d="M5 5l2 2 4-4"/></svg>),
  Earnings: () => (<svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6"/><path d="M8 4v8M5 7h3.5a1.5 1.5 0 010 3H6.5"/></svg>),
  Settings: () => (<svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3"/></svg>),
  Logout: () => (<svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l4-3-4-3M15 8H6"/></svg>),
  Note: () => (<svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 18V6l8-1.5v9"/><circle cx="5.5" cy="18" r="2"/><circle cx="15" cy="14.5" r="2"/></svg>),
};

export default function Header() {
  const [profile, setProfile] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setProfile(d.user); });
  }, []);

  const initials = profile?.name?.[0]?.toUpperCase() || '?';
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    setOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-primary"><Icons.Note /></span>
            <span className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">
              Selah<span className="text-primary">.fm</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {mainLinks.map(link => {
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                  {link.label}
                  {active && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-primary rounded-full" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {profile ? (
            <div className="relative flex items-center gap-2" ref={dropdownRef}>
              <NotificationBell />
              <button onClick={() => setOpen(!open)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold
                  ring-2 ring-primary/20 hover:ring-primary/40 hover:bg-primary/20 transition-all">
                {initials}
              </button>
              {open && (
                <div className="absolute right-0 top-11 z-50 w-52 bg-popover border border-border/20 rounded-xl shadow-xl py-1 animate-slide-up overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/20 bg-muted/30">
                    <p className="text-sm font-medium truncate">{profile?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"><Icons.Dashboard /> Dashboard</Link>
                  <Link href="/review" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"><Icons.Review /> Review</Link>
                  <Link href="/earnings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"><Icons.Earnings /> Earnings</Link>
                  <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"><Icons.Settings /> Settings</Link>
                  <div className="border-t border-border/20 my-1" />
                  <button onClick={handleLogout} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-muted/50 transition-colors"><Icons.Logout /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          )}
        </div>
      </div>

      <nav className="md:hidden flex items-center justify-around h-11 border-t border-border/40 bg-background/95 backdrop-blur">
        {mainLinks.map(link => {
          const active = isActive(link.href);
          return (
            <Link key={link.href} href={link.href}
              className={`relative text-xs font-medium px-2 py-1.5 transition-colors
                ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
              {link.label}
              {active && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
