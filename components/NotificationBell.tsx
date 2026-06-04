'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, CircleCheck, CircleX, Banknote, Info, Send, DollarSign, Sparkles, MessageCircle, Heart } from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  submission: Send,
  approval: CircleCheck,
  rejection: CircleX,
  earning: Banknote,
  payout: DollarSign,
  system: Info,
  comment: MessageCircle,
  reaction: Heart,
  donation: Heart,
  message: MessageCircle,
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString();
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications', { credentials: 'include' });
      if (!r.ok) return;
      const d = await r.json();
      if (d.notifications) {
        setNotifications(d.notifications);
        setUnreadCount(d.unreadCount ?? d.unread ?? 0);
      }
    } catch {
      // silently fail — user may not be authenticated
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  // Close on outside click
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

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  }, []);

  const markAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
  }, []);

  const handleNotificationClick = useCallback(async (n: any) => {
    setOpen(false);
    if (!n.read) {
      await markAsRead(n.id);
    }
    if (n.link) {
      window.location.href = n.link;
    }
  }, [markAsRead]);

  const recent = notifications.slice(0, 10);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-muted-foreground hover:text-primary transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-1 bg-red-500">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-80 rounded-2xl shadow-2xl animate-slide-up overflow-hidden"
          style={{
            background: '#11112A',
            border: '1px solid rgba(49,46,129,0.4)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]"
            style={{
              background: 'linear-gradient(135deg, rgba(67,56,202,0.1) 0%, transparent 100%)',
            }}
          >
            <span className="text-sm font-semibold flex items-center gap-2">
              <Bell size={14} className="text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="text-[10px] text-white px-1.5 py-0.5 rounded-full bg-red-500">
                  {unreadCount}
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Sparkles size={24} className="mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              recent.map((n) => {
                const TypeIcon = typeIcons[n.type] || Info;
                const isUnread = !n.read;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-white/[0.02] ${
                      isUnread ? 'bg-indigo-500/[0.04]' : ''
                    }`}
                  >
                    {n.sender_avatar ? (
                      <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-white/[0.06] mt-0.5">
                        <img src={n.sender_avatar} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <span className={`mt-0.5 shrink-0 ${isUnread ? 'text-primary' : 'text-muted-foreground'}`}>
                        <TypeIcon size={15} strokeWidth={1.5} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[12px] leading-relaxed line-clamp-2 ${
                          isUnread
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}