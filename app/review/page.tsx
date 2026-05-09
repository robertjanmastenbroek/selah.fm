'use client';

import { useState, useEffect } from 'react';
import TopNav from '@/components/TopNav';

interface Submission {
  id: string;
  creator: string;
  track_title: string;
  platform: string;
  content_url: string;
  views_verified: number;
  cpm_rate_cents: number;
  review_status: string;
}

export default function ReviewPage() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/submissions?campaignId=all');
      const data = await res.json();
      if (Array.isArray(data)) setSubs(data.filter((s: Submission) => s.review_status === 'pending'));
    } catch {}
    setLoading(false);
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: id, status }),
      });
    } catch {}
    setSubs(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-void">
      <TopNav />
      <main className="page-container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="section-title mb-1">Review</h1>
          <p className="text-muted/50 text-sm">{loading ? 'Loading...' : `${subs.length} pending submissions`}</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2].map(i => (
              <div key={i} className="card-glass p-5 animate-pulse">
                <div className="h-5 bg-white/[0.04] rounded w-1/2 mb-3" />
                <div className="h-4 bg-white/[0.03] rounded w-3/4 mb-4" />
                <div className="h-16 bg-white/[0.03] rounded mb-4" />
                <div className="flex gap-2">
                  <div className="h-10 bg-white/[0.04] rounded flex-1" />
                  <div className="h-10 bg-white/[0.04] rounded flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : subs.length === 0 ? (
          <div className="card-glass text-center py-16 animate-fade-in">
            <div className="text-muted/30 text-[64px] mb-4 font-light">✓</div>
            <div className="text-ivory font-medium text-lg">All caught up</div>
            <p className="text-muted/40 text-sm mt-1">No submissions to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subs.map((s, i) => {
              const cpm = (s.cpm_rate_cents || 300) / 100;
              const gross = ((s.views_verified || 0) / 1000) * cpm;
              const net = gross * 0.8;

              return (
                <div key={s.id} className="card-glass p-5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-ivory font-semibold">{s.creator || 'Creator'}</div>
                      <div className="text-muted/50 text-sm mt-0.5">
                        <span>{s.track_title} · {s.platform}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gold font-bold text-lg">{((s.views_verified || 0)).toLocaleString()}</div>
                      <div className="text-muted/40 text-[11px] mt-0.5">views</div>
                    </div>
                  </div>
                  <div className="card-elevated p-3 text-sm text-muted/50 mb-4">
                    {(s.views_verified || 0).toLocaleString()} views × ${cpm} CPM = <span className="text-gold font-semibold">${gross.toFixed(2)}</span>
                    <span className="text-muted/30 mx-1">·</span>
                    <span className="text-muted/40">−20% fee</span>
                    <span className="text-muted/30 mx-1">=</span>
                    <span className="text-ivory font-semibold">${net.toFixed(2)}</span> net
                  </div>
                  <a href={s.content_url?.startsWith('http') ? s.content_url : `https://${s.content_url}`} target="_blank"
                    className="text-gold/70 text-sm hover:text-gold transition-colors mb-4 inline-block">
                    Watch on {s.platform} →
                  </a>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(s.id, 'rejected')}
                      className="btn-secondary flex-1 !border-crimson-light/20 !text-crimson-light/70 hover:!bg-crimson/5">
                      Reject
                    </button>
                    <button onClick={() => handleAction(s.id, 'approved')} className="btn-primary flex-1">
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
