'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setProfile(d.user); });
  }, []);

  const initials = profile?.name?.[0]?.toUpperCase() || '?';

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const handleLogout = async () => {
    setOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/browse" className="font-semibold text-lg tracking-tight">
            Selah<span className="text-amber-600">.fm</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${isActive(link.href)
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {profile ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-medium hover:bg-muted/80 transition-colors">
              {initials}
            </button>
            {open && (
              <div className="absolute right-0 top-10 z-50 w-48 bg-popover border rounded-lg shadow-lg py-1">
                <div className="px-4 py-2.5 border-b text-xs text-muted-foreground truncate">{profile?.email || 'Signed in'}</div>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Dashboard</Link>
                <Link href="/earnings" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Earnings</Link>
                <Link href="/settings" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-muted transition-colors">Settings</Link>
                <div className="border-t my-1" />
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-muted transition-colors">Log out</button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
        )}
      </div>

      <nav className="md:hidden flex items-center justify-around h-12 border-t bg-background/95 backdrop-blur">
        {links.map(link => (
          <Link key={link.href} href={link.href}
            className={`text-xs font-medium px-3 py-2 transition-colors
              ${isActive(link.href) ? 'text-foreground' : 'text-muted-foreground'}`}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
