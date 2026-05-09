'use client';

import { usePathname } from 'next/navigation';

const ARTIST_NAV = [
  { href: '/dashboard', label: 'Campaigns', icon: '📊' },
  { href: '/review', label: 'Review', icon: '👀' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

const CREATOR_NAV = [
  { href: '/browse', label: 'Browse', icon: '🔍' },
  { href: '/analytics', label: 'Stats', icon: '📊' },
  { href: '/earnings', label: 'Earnings', icon: '💰' },
];

export default function BottomNav({ role = 'artist' }: { role?: 'artist' | 'creator' }) {
  const pathname = usePathname();
  const nav = role === 'artist' ? ARTIST_NAV : CREATOR_NAV;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-void/95 backdrop-blur border-t border-white/5 z-50 md:hidden">
      <div className="flex items-center justify-around py-2">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href;
          return (
            <a key={href} href={href}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 transition-colors
                ${active ? 'text-gold' : 'text-muted hover:text-ivory'}`}>
              <span className="text-lg">{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
