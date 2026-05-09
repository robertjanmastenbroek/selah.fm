'use client';

import { useState } from 'react';
import TopNav from '@/components/TopNav';

const MOCK = [
  { id: '1', creator: '@dancewithjake', track: 'Midnight Frequencies', platform: 'tiktok', url: 'tiktok.com/@.../...', views: 12400, cpm: 3, acceptRate: 92 },
  { id: '2', creator: '@creatormia', track: 'Desert Prayer', platform: 'instagram', url: 'instagram.com/reel/...', views: 8300, cpm: 4, acceptRate: 85 },
];

export default function ReviewPage() {
  const [subs, setSubs] = useState(MOCK);

  const handleAction = (id: string) => {
    setSubs(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-void">
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-8 md:py-10">
        <div className="mb-8">
          <h1 className="section-title mb-1">Review</h1>
          <p className="text-muted/50 text-sm">{subs.length} pending submissions</p>
        </div>

        {subs.length === 0 && (
          <div className="card-glass text-center py-16 animate-fade-in">
            <div className="text-muted/30 text-[64px] mb-4 font-light">✓</div>
            <div className="text-ivory font-medium text-lg">All caught up</div>
            <p className="text-muted/40 text-sm mt-1">No submissions to review.</p>
          </div>
        )}

        <div className="space-y-4">
          {subs.map((s, i) => (
            <div key={s.id} className="card-glass p-5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-ivory font-semibold">{s.creator}</div>
                  <div className="text-muted/50 text-sm flex items-center gap-2 mt-0.5">
                    <span>{s.track} · {s.platform}</span>
                    <span className="bg-gold/10 text-gold text-[11px] px-1.5 py-0.5 rounded-full font-medium">
                      {s.acceptRate}% accept
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gold font-bold text-lg">{s.views.toLocaleString()}</div>
                  <div className="text-muted/40 text-[11px] mt-0.5">views</div>
                </div>
              </div>
              <div className="card-elevated p-3 text-sm text-muted/50 mb-4">
                Payout: {s.views.toLocaleString()} views × ${s.cpm} CPM = <span className="text-gold font-semibold">${((s.views / 1000) * s.cpm).toFixed(2)}</span>
              </div>
              <a href={`https://${s.url}`} target="_blank" className="text-gold/70 text-sm hover:text-gold transition-colors mb-4 inline-block">
                Watch on {s.platform} →
              </a>
              <div className="flex gap-2">
                <button onClick={() => handleAction(s.id)} className="btn-secondary flex-1 !border-crimson-light/20 !text-crimson-light/70 hover:!bg-crimson/5">
                  Reject
                </button>
                <button onClick={() => handleAction(s.id)} className="btn-primary flex-1">
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
