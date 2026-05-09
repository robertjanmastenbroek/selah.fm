'use client';

import { useState } from 'react';

const MOCK_SUBMISSIONS = [
  { id: '1', creator: '@creatormia', track: 'Midnight Frequencies', platform: 'tiktok', views: 12400, url: 'tiktok.com/@creatormia/video/123', thumbnail: '🎬' },
  { id: '2', creator: '@dancewithjake', track: 'Midnight Frequencies', platform: 'instagram', views: 8300, url: 'instagram.com/reel/456', thumbnail: '📱' },
  { id: '3', creator: '@viralqueen', track: 'Midnight Frequencies', platform: 'tiktok', views: 2100, url: 'tiktok.com/@viralqueen/video/789', thumbnail: '🎵' },
  { id: '4', creator: '@shortsguy', track: 'Midnight Frequencies', platform: 'youtube', views: 9500, url: 'youtube.com/shorts/abc', thumbnail: '▶️' },
];

export default function ReviewPage() {
  const [submissions] = useState(MOCK_SUBMISSIONS);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);

  const pending = submissions.filter(s => !reviewed.has(s.id));
  const item = pending[current];

  const handleAction = (status: 'approved' | 'rejected') => {
    if (!item) return;
    setReviewed(new Set([...reviewed, item.id]));
    if (current >= pending.length - 1) {
      setCurrent(0);
    }
  };

  const approved = submissions.filter(s => reviewed.has(s.id)).length;

  return (
    <div className="min-h-screen bg-void">
      <div className="sticky top-0 bg-void/95 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center justify-between z-10">
        <a href="/dashboard" className="text-muted text-sm hover:text-ivory">← Back</a>
        <span className="font-display text-gold text-lg">Review</span>
        <span className="text-muted text-sm">{approved}/{submissions.length} done</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {!item ? (
          <div className="card text-center py-16">
            <div className="text-4xl mb-4">✅</div>
            <div className="font-display text-xl text-ivory mb-2">All caught up</div>
            <p className="text-muted text-sm">No pending submissions to review.</p>
          </div>
        ) : (
          <>
            <div className="card-elevated mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-ivory">{item.creator}</div>
                  <div className="text-muted text-sm">{item.track} · {item.platform}</div>
                </div>
                <div className="bg-gold/10 text-gold font-bold px-3 py-1 rounded-full text-sm">
                  {(item.views / 1000).toFixed(1)}K views
                </div>
              </div>

              {/* Video thumbnail placeholder */}
              <div className="bg-void-card rounded-xl h-64 flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="text-5xl mb-3">{item.thumbnail}</div>
                  <a href={`https://${item.url}`} target="_blank" className="text-gold text-sm hover:underline">
                    Open in {item.platform} →
                  </a>
                </div>
              </div>

              {/* Payout info */}
              <div className="bg-void rounded-lg p-3 text-sm text-muted mb-4">
                CPM $3 × {(item.views / 1000).toFixed(1)}K views = <span className="text-gold font-bold">${((item.views / 1000) * 3).toFixed(2)}</span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button onClick={() => handleAction('rejected')}
                  className="flex-1 border border-crimson/40 text-crimson-light py-3 rounded-xl font-semibold
                             hover:bg-crimson/10 transition-all">
                  ✕ Reject
                </button>
                <button onClick={() => handleAction('approved')}
                  className="flex-1 bg-gold text-void py-3 rounded-xl font-semibold
                             hover:bg-gold-hover transition-all">
                  ✓ Approve & pay
                </button>
              </div>
            </div>

            {/* Progress */}
            <div className="text-center text-muted text-xs">
              {pending.length - 1} remaining
            </div>
          </>
        )}
      </div>
    </div>
  );
}
