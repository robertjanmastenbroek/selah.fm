'use client';

import { useState } from 'react';
import TopNav from '@/components/TopNav';

const MOCK = [
  { id: '1', creator: '@dancewithjake', track: 'Midnight Frequencies', platform: 'tiktok', url: 'tiktok.com/@.../...', views: 12400, cpm: 3 },
  { id: '2', creator: '@creatormia', track: 'Desert Prayer', platform: 'instagram', url: 'instagram.com/reel/...', views: 8300, cpm: 4 },
];

export default function ReviewPage() {
  const [subs, setSubs] = useState(MOCK);

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setSubs(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-void">
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-ivory mb-2">Review submissions</h1>
        <p className="text-muted text-sm mb-6">{subs.length} pending</p>

        {subs.length === 0 && (
          <div className="card-elevated text-center py-12">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-ivory font-semibold">All caught up</div>
            <p className="text-muted text-sm mt-1">No submissions to review right now.</p>
          </div>
        )}

        <div className="space-y-4">
          {subs.map(s => (
            <div key={s.id} className="card-elevated">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-ivory font-semibold">{s.creator}</div>
                  <div className="text-muted text-xs">{s.track} · {s.platform}</div>
                </div>
                <div className="text-right">
                  <div className="text-gold font-bold">{s.views.toLocaleString()}</div>
                  <div className="text-muted text-[10px]">views · ${((s.views / 1000) * s.cpm).toFixed(2)} payout</div>
                </div>
              </div>
              <a href={`https://${s.url}`} target="_blank" className="text-gold text-xs hover:underline mb-3 block">Watch video →</a>
              <div className="flex gap-2">
                <button onClick={() => handleAction(s.id, 'rejected')} className="flex-1 btn-outline text-sm !py-2 !border-crimson/30 !text-crimson-light hover:!bg-crimson/10">Reject</button>
                <button onClick={() => handleAction(s.id, 'approved')} className="flex-1 btn-gold text-sm !py-2">Approve</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
