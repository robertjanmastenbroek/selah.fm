'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'submission' | 'approval' | 'rejection' | 'earning';
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'submission', message: 'New submission on "Midnight Frequencies" from @dancewithjake', time: '2 min ago', read: false },
  { id: '2', type: 'approval', message: 'Your submission on "Desert Wind" was approved — 4.2K views so far', time: '1 hour ago', read: false },
  { id: '3', type: 'earning', message: 'You earned $12.40 from "Summer Nights" campaign', time: '3 hours ago', read: true },
  { id: '4', type: 'rejection', message: 'Your submission on "Bass Drop" was rejected — see feedback', time: '1 day ago', read: true },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-popover border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="font-medium text-sm">Notifications</span>
            {unread > 0 && <span className="text-xs text-muted-foreground">{unread} new</span>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">No notifications yet</div>
            ) : (
              notifs.map(n => (
                <Link
                  key={n.id}
                  href={n.type === 'submission' ? '/review' : '/earnings'}
                  onClick={() => markRead(n.id)}
                  className={`block px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${!n.read ? 'bg-muted/30' : ''}`}>
                  <p className="text-sm leading-relaxed">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
