'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { LayoutDashboard, ClipboardCheck, Banknote, Settings, LogOut, Music, Bug, Search, Menu, Bell, MessageCircle, Clapperboard, HelpCircle } from 'lucide-react';

export default function Header() {
  const { data } = useSWR('/api/auth/me', fetcher, swrConfig);
  const profile = data?.user || null;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  // Messages
  const [unreadMessages, setUnreadMessages] = useState(0);

  const initials = profile?.name?.[0]?.toUpperCase() || '?';
  const profileImage = profile?.profile_image_url || null;

  // Fetch notifications + messages
  useEffect(() => {
    if (!profile) return;
    // Notifications
    fetch('/api/notifications', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.notifications) {
          setNotifications(d.notifications.slice(0, 5));
          setUnreadNotifs(d.unread || 0);
        }
      })
      .catch(() => {});
    // Messages
    fetch('/api/messages', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          const total = d.reduce((sum: number, c: any) => sum + (c.unread || 0), 0);
          setUnreadMessages(total);
        }
      })
      .catch(() => {});
  }, [profile]);

  const totalUnread = unreadNotifs + unreadMessages;

  const markNotifsRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setUnreadNotifs(0);
  };

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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#0A0A0A]/90 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: search → /browse */}
        <Link href="/browse" className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Browse campaigns">
          <Search size={20} strokeWidth={1.5} />
        </Link>

        {/* Center: logo */}
        <Link href="/browse" className="absolute left-1/2 -translate-x-1/2">
          <img src="/images/selah-nav-logo.png" alt="Selah.fm" className="h-8 w-auto" fetchPriority="high" width="200" height="40" />
        </Link>

        {/* Right: hamburger menu with combined badge */}
        <div className="flex items-center" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors relative"
            aria-label="Menu"
          >
            <Menu size={20} strokeWidth={1.5} />
            {totalUnread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground px-1">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-3 top-12 z-50 w-72 bg-[#0D0D0D] border border-white/[0.08] rounded-xl shadow-xl animate-slide-up overflow-hidden">
              {profile ? (
                <>
                  {/* Profile header */}
                  <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary overflow-hidden shrink-0">
                      {profileImage ? <img src={profileImage} alt="" className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{profile.name || 'User'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
                    </div>
                    <Link href="/settings" onClick={() => setOpen(false)} className="shrink-0">
                      <Settings size={16} className="text-muted-foreground hover:text-foreground" />
                    </Link>
                  </div>

                  {/* Notifications preview */}
                  {unreadNotifs > 0 && (
                    <div className="border-b border-white/[0.05]">
                      <div className="flex items-center justify-between px-4 py-2.5">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          <Bell size={12} className="text-primary" />
                          Notifications
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{unreadNotifs}</span>
                        </span>
                        <button onClick={markNotifsRead} className="text-[10px] text-primary hover:underline">Clear</button>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {notifications.filter((n: any) => !n.read).slice(0, 3).map((n: any) => (
                          <Link key={n.id} href={n.link || '#'} onClick={() => setOpen(false)}
                            className="block px-4 py-2 hover:bg-white/[0.03] transition-colors">
                            <p className="text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              {(() => {
                                const d = new Date(n.created_at);
                                const m = Math.floor((Date.now() - d.getTime()) / 60000);
                                if (m < 1) return 'just now';
                                if (m < 60) return `${m}m ago`;
                                const h = Math.floor(m / 60);
                                if (h < 24) return `${h}h ago`;
                                return d.toLocaleDateString();
                              })()}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages preview */}
                  {unreadMessages > 0 && (
                    <div className="border-b border-white/[0.05]">
                      <Link href="/dashboard" onClick={() => setOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          <MessageCircle size={12} className="text-primary" />
                          Messages
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{unreadMessages}</span>
                        </span>
                        <span className="text-[10px] text-primary">View</span>
                      </Link>
                    </div>
                  )}

                  {/* Show "no alerts" when nothing is unread */}
                  {totalUnread === 0 && (
                    <div className="px-4 py-3 border-b border-white/[0.05] text-center">
                      <p className="text-[11px] text-muted-foreground">No new alerts</p>
                    </div>
                  )}

                  {/* Navigation links */}
                  <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"><LayoutDashboard size={16} strokeWidth={1.5} /> Dashboard</Link>
                  <Link href="/review" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"><ClipboardCheck size={16} strokeWidth={1.5} /> Review</Link>
                  <Link href="/earnings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"><Banknote size={16} strokeWidth={1.5} /> Earnings</Link>
                  <Link href="/analytics" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"><LayoutDashboard size={16} strokeWidth={1.5} /> Analytics</Link>
                  <div className="border-t border-white/[0.05] my-1" />
                  <Link href="/browse" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"><Search size={16} strokeWidth={1.5} /> Browse campaigns</Link>
                  <Link href="/artists" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"><Music size={16} strokeWidth={1.5} /> Artists</Link>
                  <Link href="/creators" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"><Clapperboard size={16} strokeWidth={1.5} /> Creators</Link>
                  <Link href="/faq" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"><HelpCircle size={16} strokeWidth={1.5} /> FAQ & Support</Link>
                  <Link href="/report-bug" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"><Bug size={16} strokeWidth={1.5} /> Report a bug</Link>
                  <a href="https://github.com/robertjanmastenbroek/selah.fm" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                    Star on GitHub
                  </a>
                  <div className="border-t border-white/[0.06] my-1" />
                  <button onClick={handleLogout} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/[0.04] transition-colors"><LogOut size={16} strokeWidth={1.5} /> Log out</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors">Sign in</Link>
                  <Link href="/browse" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.04] transition-colors"><Search size={16} /> Browse campaigns</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
