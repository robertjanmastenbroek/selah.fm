'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Music, User, LayoutDashboard } from 'lucide-react';

const TABS = [
  { href: '/browse', label: 'Campaigns', icon: Search },
  { href: '/artists', label: 'Artists', icon: Music },
  { href: '/creators', label: 'Creators', icon: User },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
];

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur border-t border-border/40">
      <div className="flex items-center justify-around h-16 pt-1 pb-2">
        {TABS.map(({ href, label, icon: IconComponent }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <IconComponent size={20} strokeWidth={active ? 2 : 1.5} className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
