'use client';

import { useState } from 'react';
import TopNav from '@/components/TopNav';

export default function EarningsPage() {
  const [submissions] = useState([
    { id: '1', track: 'Midnight Frequencies', platform: 'tiktok', views: 12400, earned: 37.20, status: 'paid', date: 'May 8' },
    { id: '2', track: 'Desert Prayer', platform: 'instagram', views: 8300, earned: 33.20, status: 'paid', date: 'May 7' },
    { id: '3', track: 'Neon Cathedral', platform: 'tiktok', views: 45100, earned: 90.20, status: 'pending', date: 'May 9' },
  ]);

  const total = submissions.filter(s => s.status === 'paid').reduce((s, e) => s + e.earned, 0);
  const pending = submissions.filter(s => s.status === 'pending').reduce((s, e) => s + e.earned, 0);

  return (
    <div className="min-h-screen bg-void">
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-ivory mb-6">Earnings</h1>

        <div className="card-elevated text-center py-8 mb-6">
          <div className="text-muted text-xs uppercase tracking-widest mb-2">Available</div>
          <div className="font-display text-5xl text-gold">${total.toFixed(2)}</div>
          <div className="text-muted text-sm mt-1">+${pending.toFixed(2)} pending</div>
        </div>

        <div className="space-y-2">
          {submissions.map(s => (
            <div key={s.id} className="card !p-4 flex items-center justify-between">
              <div>
                <div className="text-ivory text-sm font-semibold">{s.track}</div>
                <div className="text-muted text-xs">{s.platform} · {s.views.toLocaleString()} views · {s.date}</div>
              </div>
              <div className="text-right">
                <div className="text-gold font-bold">${s.earned.toFixed(2)}</div>
                <div className={`text-xs ${s.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>{s.status}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
