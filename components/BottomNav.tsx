'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const TABS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/browse', label: 'Discover', icon: '🔍' },
  { href: '/dashboard', label: 'Campaigns', icon: '📊' },
  { href: '/earnings', label: 'Earnings', icon: '💰' },
  { href: '/settings', label: 'Profile', icon: '👤' },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border">
      <div className="flex items-center justify-around h-16 pt-1 pb-2">
        {TABS.map(({ href, label, icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200
                ${active ? 'text-gold' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <span className={`text-xl transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                {icon}
              </span>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
