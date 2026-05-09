'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import NotificationBell from '@/components/NotificationBell';

const links = [
  { href: '/browse', label: 'Discover' },
  { href: '/creators', label: 'Creators' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/review', label: 'Review' },
];

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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Logo + Nav */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/browse" className="flex items-center gap-2 group shrink-0">
            <span className="text-xl leading-none">♪</span>
            <span className="font-bold text-lg tracking-tight group-hover:text-accent-foreground transition-colors">
              Selah<span className="text-accent-foreground">.fm</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {links.map(link => {
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                  {link.label}
                  {active && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-accent-foreground rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {profile ? (
            <div className="relative flex items-center gap-2" ref={dropdownRef}>
              <NotificationBell />
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 text-accent-foreground text-sm font-bold
                  ring-2 ring-accent/20 hover:ring-accent/40 hover:bg-accent/20 transition-all">
                {initials}
              </button>
              {open && (
                <div className="absolute right-0 top-11 z-50 w-52 bg-popover border rounded-xl shadow-xl py-1 animate-slide-up overflow-hidden">
                  <div className="px-4 py-3 border-b bg-muted/30">
                    <p className="text-sm font-medium truncate">{profile?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                    <span>📊</span> Dashboard
                  </Link>
                  <Link href="/earnings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                    <span>💰</span> Earnings
                  </Link>
                  <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                    <span>⚙️</span> Settings
                  </Link>
                  <div className="border-t my-1" />
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-muted transition-colors">
                    <span>🚪</span> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Mobile top tabs */}
      <nav className="md:hidden flex items-center justify-around h-11 border-t bg-background/95 backdrop-blur">
        {links.map(link => {
          const active = isActive(link.href);
          return (
            <Link key={link.href} href={link.href}
              className={`relative text-xs font-medium px-2 py-1.5 transition-colors
                ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
              {link.label}
              {active && <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-accent-foreground rounded-full" />}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
