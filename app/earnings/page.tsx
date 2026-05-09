'use client';

import { useState } from 'react';
import Header from '@/components/TopNav';

export default function EarningsPage() {
  const [submissions] = useState([
    { id: '1', track: 'Midnight Frequencies', platform: 'tiktok', views: 12400, earned: 37.20, status: 'paid', date: 'May 8' },
    { id: '2', track: 'Desert Prayer', platform: 'instagram', views: 8300, earned: 33.20, status: 'paid', date: 'May 7' },
    { id: '3', track: 'Neon Cathedral', platform: 'tiktok', views: 45100, earned: 90.20, status: 'pending', date: 'May 9' },
  ]);

  const total = submissions.filter(s => s.status === 'paid').reduce((s, e) => s + e.earned, 0);
  const pending = submissions.filter(s => s.status === 'pending').reduce((s, e) => s + e.earned, 0);

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <main className="page-container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="section-title mb-1">Earnings</h1>
        </div>

        <div className="card p-8 text-center mb-6 animate-fade-in">
          <div className="text-text-muted text-xs uppercase tracking-[0.2em] mb-2">Available balance</div>
          <div className="font-display text-5xl md:text-6xl text-gold mb-2 tracking-tight">${total.toFixed(2)}</div>
          <div className="text-text-muted text-sm">+${pending.toFixed(2)} pending</div>
        </div>

        <div className="space-y-2">
          {submissions.map((s, i) => (
            <div key={s.id} className="card p-4 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div>
                <div className="text-text text-sm font-medium">{s.track}</div>
                <div className="text-text-muted text-xs mt-0.5">{s.platform} · {s.views.toLocaleString()} views · {s.date}</div>
              </div>
              <div className="text-right">
                <div className="text-gold font-semibold">${s.earned.toFixed(2)}</div>
                <div className={`text-[11px] mt-0.5 ${s.status === 'paid' ? 'text-emerald-400/70' : 'text-amber-400/70'}`}>
                  {s.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
