'use client';

import { useState } from 'react';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs] = useState([
    { id: '1', text: 'New submission on Midnight Frequencies', time: '2m ago', read: false },
    { id: '2', text: 'Campaign "Desert Prayer" budget 50% spent', time: '1h ago', read: false },
    { id: '3', text: 'Creator @dancewithjake joined your campaign', time: '3h ago', read: true },
  ]);

  const unread = notifs.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2">
        <span className="text-xl">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-crimson text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-72 bg-void-card border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-white/5 flex justify-between">
              <span className="text-ivory font-semibold text-sm">Notifications</span>
              <span className="text-muted text-xs">{unread} new</span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifs.map(n => (
                <div key={n.id} className={`p-3 border-b border-white/5 hover:bg-void-elevated transition-colors ${!n.read ? 'bg-gold/5' : ''}`}>
                  <p className="text-ivory text-sm">{n.text}</p>
                  <p className="text-muted text-xs mt-1">{n.time}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
