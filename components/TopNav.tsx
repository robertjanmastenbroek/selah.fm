'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { LayoutDashboard, Banknote, Settings, LogOut, Search, Menu, MessageCircle, Sparkles, Mail, TrendingUp, Video } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import LocaleSwitcher from '@/components/LocaleSwitcher';

export default function Header() {
  const { data } = useSWR('/api/auth/me', fetcher, swrConfig);
  const profile = data?.user || null;
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Messages
  const [unreadMessages, setUnreadMessages] = useState(0);

  const initials = profile?.name?.[0]?.toUpperCase() || '?';
  const profileImage = profile?.profile_image_url || null;

  // Fetch messages
  useEffect(() => {
    if (!profile) return;
    fetch('/api/messages', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) { const total = d.reduce((sum: number, c: any) => sum + (c.unread || 0), 0); setUnreadMessages(total); }
      }).catch(() => {});
  }, [profile]);

  const totalUnread = unreadMessages;

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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.04]" style={{ background: 'linear-gradient(180deg, rgba(15,15,35,0.98) 0%, rgba(15,15,35,0.92) 100%)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: search → /browse */}
        <Link href="/browse?focus=search" className="p-2 -ml-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Browse tracks">
          <Search size={20} strokeWidth={1.5} />
        </Link>

        {/* Center: logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Image src="/images/selah-nav-logo.png" alt="Selah.fm" className="h-7 w-auto" priority width="200" height="40" />
        </Link>

        {/* Quick actions — visible pill buttons for authenticated users */}
        <div className="hidden sm:flex items-center gap-1.5 ml-auto mr-2">
          {profile?.is_artist && (
            <Link href="/dashboard?tab=campaigns"
              className="px-3 py-1.5 rounded-lg bg-primary/[0.08] border border-primary/20 text-primary text-[10px] font-semibold hover:bg-primary/[0.12] transition-colors flex items-center gap-1">
              <TrendingUp size={12} /> Create
            </Link>
          )}
          {profile?.is_creator && (
            <Link href="/browse"
              className="px-3 py-1.5 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/[0.12] transition-colors flex items-center gap-1">
              <Video size={12} /> Submit
            </Link>
          )}
        </div>

        {/* Right: locale switcher + messages + notification bell + hamburger menu */}
        <div className="flex items-center gap-0.5" ref={dropdownRef}>
          <LocaleSwitcher />
          {profile && (
            <Link href="/messages" className="p-2 text-muted-foreground hover:text-primary transition-colors relative" aria-label="Messages">
              <Mail size={20} strokeWidth={1.5} />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1" style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>
          )}
          {profile && <NotificationBell />}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 -mr-2 text-muted-foreground hover:text-primary transition-colors relative"
            aria-label="Menu"
          >
            <Menu size={20} strokeWidth={1.5} />
            {totalUnread > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1" style={{ background: 'linear-gradient(135deg, #4338CA, #5B7FFF)' }}>
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-3 top-12 z-50 w-72 rounded-2xl shadow-2xl animate-slide-up overflow-hidden" style={{ background: '#11112A', border: '1px solid rgba(49,46,129,0.4)' }}>
              {profile ? (
                <>
                  {/* Profile header */}
                  <div className="px-4 py-3 border-b border-white/[0.05]" style={{ background: 'linear-gradient(135deg, rgba(67,56,202,0.1) 0%, transparent 100%)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0" style={{ background: 'linear-gradient(135deg, #4338CA, #5B7FFF)' }}>
                        {profileImage ? <img src={profileImage} alt="" className="w-full h-full object-cover" /> : initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{profile.name || 'User'}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
                      </div>
                      <Link href="/settings" onClick={() => setOpen(false)} className="shrink-0 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
                        <Settings size={15} className="text-muted-foreground hover:text-foreground" />
                      </Link>
                    </div>
                  </div>

                  {/* Messages preview */}
                  {unreadMessages > 0 && (
                    <div className="border-b border-white/[0.04]">
                      <Link href="/dashboard" onClick={() => setOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          <MessageCircle size={12} className="text-primary" />
                          Messages
                          <span className="text-[10px] text-white px-1.5 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, #4338CA, #5B7FFF)' }}>{unreadMessages}</span>
                        </span>
                        <span className="text-[10px] text-primary font-medium">View</span>
                      </Link>
                    </div>
                  )}

                  {/* No alerts state */}
                  {totalUnread === 0 && (
                    <div className="px-4 py-3 border-b border-white/[0.04] text-center">
                      <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
                        <Sparkles size={11} className="text-accent/40" /> No new alerts
                      </p>
                    </div>
                  )}

                  {/* Quick actions */}
                  {profile?.is_artist && (
                    <div className="border-b border-white/[0.04] px-3 py-2">
                      <Link href="/dashboard?tab=campaigns" onClick={() => setOpen(false)}
                        className="flex items-center gap-2 w-full px-2 py-2 rounded-lg bg-primary/[0.08] border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/[0.12] transition-colors">
                        <TrendingUp size={14} /> Create Campaign
                      </Link>
                    </div>
                  )}
                  {profile?.is_creator && (
                    <div className="border-b border-white/[0.04] px-3 py-2">
                      <Link href="/browse" onClick={() => setOpen(false)}
                        className="flex items-center gap-2 w-full px-2 py-2 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/[0.12] transition-colors">
                        <Video size={14} /> Submit Video
                      </Link>
                    </div>
                  )}

                  {/* Navigation links */}
                  <div className="py-1">
                    <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setOpen(false)} />
                    <NavItem href="/messages" icon={MessageCircle} label="Messages" onClick={() => setOpen(false)} />
                    <NavItem href="/earnings" icon={Banknote} label="Earnings" onClick={() => setOpen(false)} />
                  </div>

                  <div className="border-t border-white/[0.05] py-1">

                    <NavItem href="/browse" icon={Search} label="Browse tracks" onClick={() => setOpen(false)} />
                    <a href="https://github.com/robertjanmastenbroek/selah.fm" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                      Star on GitHub
                    </a>
                  </div>

                  <div className="border-t border-white/[0.05] py-1">
                    <button onClick={handleLogout} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.04] transition-colors">
                      <LogOut size={16} strokeWidth={1.5} /> Log out
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-1">
                  <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.03] transition-colors font-medium text-primary">Sign in</Link>
                  <Link href="/browse" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.03] transition-colors"><Search size={16} /> Browse tracks</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavItem({ href, icon: Icon, label, onClick }: { href: string; icon: any; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground/80 hover:text-foreground hover:bg-white/[0.03] transition-colors">
      <Icon size={16} strokeWidth={1.5} className="text-muted-foreground" />
      {label}
    </Link>
  );
}
