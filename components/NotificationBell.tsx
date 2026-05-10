'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'submission' | 'approval' | 'rejection' | 'earning' | 'payout' | 'system';
  message: string;
  read: boolean;
  link: string;
  created_at: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) {
        setNotifs(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // Silent fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {}
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    setOpen(false);
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
    } catch {}
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const linkForNotification = (n: Notification): string => {
    if (n.link) return n.link;
    switch (n.type) {
      case 'submission': return '/review';
      case 'approval':
      case 'rejection':
      case 'earning':
      case 'payout': return '/earnings';
      default: return '/';
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-popover border rounded-xl shadow-xl z-50 overflow-hidden animate-slide-up">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="font-medium text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                <img src="/images/empty-notifications.png" alt="No notifications" className="mx-auto mb-3 w-20 h-20 object-contain opacity-60" />
                No notifications yet
              </div>
            ) : (
              notifs.map(n => (
                <Link
                  key={n.id}
                  href={linkForNotification(n)}
                  onClick={() => markRead(n.id)}
                  className={`block px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${
                    !n.read ? 'bg-muted/30' : ''
                  }`}
                >
                  <p className="text-sm leading-relaxed">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
