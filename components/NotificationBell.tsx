'use client';

import { useState } from 'react';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications] = useState([
    { id: '1', text: 'Your submission was approved 🎉', time: '2m ago', read: false },
    { id: '2', text: 'Campaign "Summer Nights" has 3 new submissions', time: '1h ago', read: false },
    { id: '3', text: 'Payout of $37.20 processed', time: '3h ago', read: true },
    { id: '4', text: 'New creator joined your campaign', time: '1d ago', read: true },
  ]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative w-10 h-10 rounded-xl bg-bg-card border border-white/10 flex items-center justify-center hover:border-gold/30 transition-all">
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-crimson text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-72 bg-bg-card border border-white/10 rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-white/5">
            <span className="text-text font-semibold text-sm">Notifications</span>
            <span className="text-muted text-xs ml-2">{notifications.length} total</span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b border-white/5 hover:bg-bg-elevated transition-colors`}>
                <div className="flex items-start gap-3">
                  {!n.read && <div className="w-2 h-2 rounded-full bg-gold mt-1.5 flex-shrink-0" />}
                  <div>
                    <div className="text-text text-sm">{n.text}</div>
                    <div className="text-muted text-xs mt-0.5">{n.time}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setOpen(false)}
            className="w-full py-2.5 text-gold text-xs font-semibold hover:bg-bg-elevated transition-colors">
            Mark all read
          </button>
        </div>
      )}
    </div>
  );
}
