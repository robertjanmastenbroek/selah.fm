'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const links = [
  { href: '/browse', label: 'Discover' },
  { href: '/creators', label: 'Creators' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/review', label: 'Review' },
  { href: '/earnings', label: 'Earnings' },
];

export default function Header() {
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const [open, setOpen] = useState(false);
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
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/browse" className="font-semibold text-lg tracking-tight">
            Selah<span className="text-accent-foreground">.fm</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${isActive(link.href) ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {profile ? (
          <div ref={menuRef} className="relative">
            <button onClick={() => setOpen(!open)}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium
                         hover:bg-muted/80 transition-colors">
              {initials}
            </button>
            {open && (
              <div className="absolute right-0 top-10 w-56 bg-popover border rounded-lg shadow-lg overflow-hidden z-50">
                <div className="px-4 py-3 border-b">
                  <p className="text-sm font-medium truncate">{profile?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                </div>
                <button onClick={() => { router.push('/dashboard'); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors">Dashboard</button>
                <button onClick={() => { router.push('/earnings'); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors">Earnings</button>
                <button onClick={() => { router.push('/settings'); setOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors">Settings</button>
                <div className="border-t" />
                <button onClick={() => { setOpen(false); handleLogout(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors">
                  Log out
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

      <nav className="md:hidden flex items-center justify-around h-12 border-t bg-background/95 backdrop-blur">
        {links.slice(0, 5).map(link => (
          <Link key={link.href} href={link.href}
            className={`text-xs font-medium px-2 py-2 transition-colors
              ${isActive(link.href) ? 'text-foreground' : 'text-muted-foreground'}`}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
