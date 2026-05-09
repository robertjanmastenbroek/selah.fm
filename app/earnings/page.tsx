'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';

interface Submission {
  id: string;
  trackTitle: string;
  contentUrl: string;
  platform: string;
  views: number;
  earned: number;
  status: string;
  submittedAt: string;
}

export default function EarningsPage() {
  const [submissions] = useState<Submission[]>([
    { id: '1', trackTitle: 'Midnight Frequencies', contentUrl: 'tiktok.com/@.../video/...', platform: 'tiktok', views: 12400, earned: 37.20, status: 'paid', submittedAt: '2026-05-06' },
    { id: '2', trackTitle: 'Desert Prayer', contentUrl: 'instagram.com/reel/...', platform: 'instagram', views: 8300, earned: 25.70, status: 'paid', submittedAt: '2026-05-07' },
    { id: '3', trackTitle: 'Summer Nights', contentUrl: 'youtube.com/shorts/...', platform: 'youtube', views: 45100, earned: 90.20, status: 'pending', submittedAt: '2026-05-08' },
    { id: '4', trackTitle: 'Tribal Sunrise', contentUrl: 'instagram.com/reel/...', platform: 'instagram', views: 2100, earned: 6.30, status: 'paid', submittedAt: '2026-05-04' },
  ]);

  const totalEarned = submissions.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.earned, 0);
  const pendingEarned = submissions.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.earned, 0);
  const totalViews = submissions.reduce((sum, s) => sum + s.views, 0);

  return (
    <div className="min-h-screen bg-void pb-20">
      <div className="sticky top-0 bg-void/95 backdrop-blur border-b border-white/5 px-4 py-4 z-10">
        <div className="max-w-lg mx-auto">
          <span className="font-display text-gold text-lg">Earnings</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Balance card */}
        <div className="card-elevated text-center py-8">
          <div className="text-muted text-xs uppercase tracking-widest mb-2">Available balance</div>
          <div className="font-display text-5xl text-gold mb-2">${totalEarned.toFixed(2)}</div>
          <div className="text-muted text-sm">+${pendingEarned.toFixed(2)} pending · {totalViews.toLocaleString()} total views</div>
          <button className="btn-gold w-full mt-6 !rounded-xl">Cash out</button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card !p-4 text-center">
            <div className="text-gold text-xl font-bold">{submissions.length}</div>
            <div className="text-muted text-xs">Submissions</div>
          </div>
          <div className="card !p-4 text-center">
            <div className="text-gold text-xl font-bold">{totalViews.toLocaleString()}</div>
            <div className="text-muted text-xs">Views</div>
          </div>
          <div className="card !p-4 text-center">
            <div className="text-gold text-xl font-bold">${(submissions.filter(s => s.status === 'paid').length)}</div>
            <div className="text-muted text-xs">Paid out</div>
          </div>
        </div>

        {/* Submission history */}
        <div>
          <h3 className="text-ivory font-semibold mb-3">Submission history</h3>
          <div className="space-y-2">
            {submissions.map((s) => (
              <div key={s.id} className="card !p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-ivory text-sm font-semibold truncate">{s.trackTitle}</div>
                  <div className="text-muted text-xs flex items-center gap-2 mt-0.5">
                    <span className="capitalize">{s.platform}</span>
                    <span>·</span>
                    <span>{s.views.toLocaleString()} views</span>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <div className="text-gold font-bold">${s.earned.toFixed(2)}</div>
                  <div className={`text-xs mt-0.5 ${s.status === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {s.status === 'paid' ? 'Paid' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav role="creator" />
    </div>
  );
}
