'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const links = [
  { href: '/browse', label: 'Discover' },
  { href: '/creators', label: 'Creators' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/review', label: 'Review' },
  { href: '/earnings', label: 'Earnings' },
];

export default function Header() {
  const [profile, setProfile] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => d.user && setProfile(d.user))
      .catch(() => {});
  }, []);

  const initials = profile?.name?.[0]?.toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/browse" className="font-semibold text-lg">
            Selah<span className="text-accent-foreground">.fm</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${pathname === link.href ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="relative">
          <button onClick={() => setOpen(!open)}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            {initials}
          </button>
          {open && (
            <div className="absolute right-0 top-10 w-48 bg-popover border rounded-lg shadow-lg overflow-hidden z-50">
              <div className="px-4 py-2.5 border-b text-sm font-medium">{profile?.name || 'User'}</div>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-muted">Dashboard</Link>
              <Link href="/earnings" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-muted">Earnings</Link>
              <Link href="/settings" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-muted">Settings</Link>
              <Link href="/login" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-destructive hover:bg-muted border-t">Log out</Link>
            </div>
          )}
        </div>
      </div>

      <nav className="md:hidden flex items-center justify-around h-12 border-t bg-background/95 backdrop-blur">
        {links.slice(0, 5).map(link => (
          <Link key={link.href} href={link.href}
            className={`text-xs font-medium px-2 py-2 ${pathname === link.href ? 'text-foreground' : 'text-muted-foreground'}`}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
