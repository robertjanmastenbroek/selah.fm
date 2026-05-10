'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import NotificationBell from '@/components/NotificationBell';
import ChatWidget from '@/components/ChatWidget';
import { LayoutDashboard, ClipboardCheck, Banknote, Settings, LogOut, Music, Bug } from 'lucide-react';

const mainLinks = [
  { href: '/browse', label: 'Campaigns' },
  { href: '/artists', label: 'Artists' },
  { href: '/creators', label: 'Creators' },
];

export default function Header() {
  const { data } = useSWR('/api/auth/me', fetcher, swrConfig);
  const profile = data?.user || null;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href={profile ? '/browse' : '/'} className="flex items-center gap-2 group shrink-0">
            <img src="/images/Selah Logo no text.png" alt="Selah.fm" className="h-8 w-auto" />
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
              <ChatWidget />
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
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"><LayoutDashboard size={16} strokeWidth={1.5} /> Dashboard</Link>
                  <Link href="/review" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"><ClipboardCheck size={16} strokeWidth={1.5} /> Review</Link>
                  <Link href="/earnings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"><Banknote size={16} strokeWidth={1.5} /> Earnings</Link>
                  <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"><Settings size={16} strokeWidth={1.5} /> Settings</Link>
                  <Link href="/report-bug" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"><Bug size={16} strokeWidth={1.5} /> Report a bug</Link>
                  <a href="https://github.com/robertjanmastenbroek/selah.fm" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    Star on GitHub
                  </a>
                  <div className="border-t border-border/20 my-1" />
                  <button onClick={handleLogout} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-muted/50 transition-colors"><LogOut size={16} strokeWidth={1.5} /> Log out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          )}
        </div>
      </div>

      <nav className="md:hidden flex items-center justify-around h-11 border-t border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
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
