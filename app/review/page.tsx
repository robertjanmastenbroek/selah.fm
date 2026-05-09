'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Submission {
  id: string;
  creator_name: string;
  track_title: string;
  platform: string;
  content_url: string;
  views_verified: number;
  cpm_rate_cents: number;
  max_payout_per_submission_cents: number;
  review_status: string;
}

export default function ReviewPage() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/submissions?campaignId=all')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setSubs(data.filter((s: Submission) => s.review_status === 'pending'));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id: string, status: string) => {
    try { await fetch('/api/review', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ submissionId: id, status }) }); } catch {}
    setSubs(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <div className="mb-8">
          <h1 className="section-title mb-1">Review</h1>
          <p className="text-muted-foreground text-sm">{loading ? 'Loading...' : `${subs.length} pending`}</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2].map(i => <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-16 w-full" /><div className="flex gap-2"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /></div></CardContent></Card>)}
          </div>
        ) : subs.length === 0 ? (
          <Card className="text-center py-16"><CardContent><p className="text-4xl mb-4 opacity-10">✓</p><h2 className="text-lg font-medium">All caught up</h2><p className="text-muted-foreground text-sm">No submissions to review.</p></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {subs.map((s, i) => {
              const cpm = s.cpm_rate_cents / 100;
              const views = s.views_verified || 0;
              let gross = (views / 1000) * cpm;
              const maxPayout = (s.max_payout_per_submission_cents || 0) / 100;
              if (maxPayout > 0 && gross > maxPayout) gross = maxPayout;
              const net = gross * 0.80;
              return (
                <Card key={s.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{s.creator_name || 'Creator'}</h3>
                        <p className="text-muted-foreground text-sm">{s.track_title} · {s.platform}</p>
                      </div>
                      <Badge variant="secondary">{(s.views_verified || 0).toLocaleString()} views</Badge>
                    </div>
                    <Card className="bg-muted/50"><CardContent className="p-3 text-sm text-muted-foreground">
                      {(s.views_verified || 0).toLocaleString()} views × ${cpm} CPM = <span className="text-foreground font-semibold">${gross.toFixed(2)}</span> → <span className="text-foreground font-semibold">${net.toFixed(2)}</span> creator earns
                    </CardContent></Card>
                    <a href={s.content_url?.startsWith('http') ? s.content_url : `https://${s.content_url}`} target="_blank" className="text-sm text-accent-foreground hover:underline">Watch on {s.platform} →</a>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleAction(s.id, 'rejected')} className="flex-1">Reject</Button>
                      <Button onClick={() => handleAction(s.id, 'approved')} className="flex-1">Approve</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
