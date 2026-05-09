'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const links = [
  { href: '/browse', label: 'Discover' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/review', label: 'Review' },
  { href: '/earnings', label: 'Earnings' },
];

export default function Header() {
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setProfile(d.user);
    });
  }, []);

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
            Selah<span className="text-amber-600">.fm</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link key={link.href} href={link.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${isActive(link.href) 
                    ? 'bg-muted text-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-medium hover:bg-muted/80 transition-colors focus:outline-none">
              {initials}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium truncate">{profile?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => router.push('/dashboard')}>Dashboard</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push('/earnings')}>Earnings</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
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
