'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Sub {
  id: string;
  track_title: string;
  platform: string;
  views_verified: number;
  review_status: string;
  payout_amount_cents: number;
  submitted_at: string;
}

export default function CreatorSubmissions({ creatorId }: { creatorId: string }) {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/submissions?campaignId=all`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubs(data.filter((s: any) => s.creator_id === creatorId).slice(0, 5));
        }
      })
      .finally(() => setLoading(false));
  }, [creatorId]);

  if (loading) {
    return <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  if (subs.length === 0) {
    return <p className="text-sm text-muted-foreground">No submissions yet.</p>;
  }

  const statusBadge = (s: Sub) => {
    if (s.review_status === 'approved' && s.payout_amount_cents) return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400">paid ${((s.payout_amount_cents || 0) / 100).toFixed(0)}</Badge>;
    if (s.review_status === 'approved') return <Badge variant="secondary" className="text-[10px]">approved</Badge>;
    if (s.review_status === 'rejected') return <Badge variant="outline" className="text-[10px] text-red-400">rejected</Badge>;
    return <Badge variant="outline" className="text-[10px]">pending</Badge>;
  };

  return (
    <div className="space-y-2">
      {subs.map(s => (
        <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{s.track_title}</p>
            <p className="text-xs text-muted-foreground">{s.platform} · {(s.views_verified || 0).toLocaleString()} views · {new Date(s.submitted_at).toLocaleDateString()}</p>
          </div>
          <div className="shrink-0 ml-3">
            {statusBadge(s)}
          </div>
        </div>
      ))}
    </div>
  );
}
