'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/TopNav';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Submission {
  id: string;
  track_title: string;
  platform: string;
  views_verified: number;
  payout_amount_cents: number;
  payout_status: string;
  review_status: string;
  submitted_at: string;
  content_url: string;
}

export default function EarningsPage() {
  const [data, setData] = useState<{
    submissions: Submission[];
    totalPaid: number;
    totalPending: number;
    totalEarned: number;
  } | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setProfile(d.user); });
    fetch('/api/earnings')
      .then(r => r.json())
      .then(d => {
        if (d.submissions) setData(d);
        else setData({ submissions: [], totalPaid: 0, totalPending: 0, totalEarned: 0 });
      })
      .catch(() => setData({ submissions: [], totalPaid: 0, totalPending: 0, totalEarned: 0 }))
      .finally(() => setLoading(false));
  }, []);

  const statusBadge = (s: Submission) => {
    if (s.payout_status === 'paid') return <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">paid</Badge>;
    if (s.review_status === 'approved') return <Badge variant="secondary" className="text-xs">approved</Badge>;
    if (s.review_status === 'rejected') return <Badge variant="outline" className="text-xs text-red-400 border-red-400/20">rejected</Badge>;
    return <Badge variant="outline" className="text-xs">pending</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <h1 className="section-title mb-8">Earnings</h1>

        {loading ? (
          <>
            <Card className="text-center mb-6">
              <CardContent className="p-8 space-y-2">
                <Skeleton className="h-4 w-24 mx-auto" />
                <Skeleton className="h-10 w-32 mx-auto" />
                <Skeleton className="h-3 w-20 mx-auto" />
              </CardContent>
            </Card>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Balance card */}
            <Card className="text-center mb-6 animate-fade-in">
              <CardContent className="p-8">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Available balance</p>
                <p className="text-5xl font-bold tracking-tight">
                  ${(data?.totalPaid || 0).toFixed(2)}
                </p>
                {(data?.totalPending || 0) > 0 && (
                  <p className="text-muted-foreground text-sm mt-1">
                    +${(data?.totalPending || 0).toFixed(2)} pending
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Stripe Connect prompt — only show if not connected */}
            {!profile?.stripe_connect_id && (
            <Card className="mb-6 border-accent/20 bg-accent/[0.03] animate-fade-in">
              <CardContent className="p-5 text-center space-y-3">
                <p className="text-sm font-medium">💳 Receive payouts</p>
                <p className="text-xs text-muted-foreground">Connect your bank account via Stripe to receive payments directly. Payouts are processed after your submissions are approved.</p>
                <div className="flex gap-2 justify-center">
                  <Link href="/api/stripe/connect" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent-foreground text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                    Set up Stripe Connect →
                  </Link>
                </div>
                <p className="text-[10px] text-muted-foreground">Takes 2 minutes. Works in 40+ countries.</p>
              </CardContent>
            </Card>
            )}

            {/* Submissions list */}
            <div className="space-y-2">
              {data?.submissions.length === 0 ? (
                <Card className="text-center py-16 animate-fade-in">
                  <CardContent>
                    <p className="text-4xl mb-4 opacity-10">💰</p>
                    <h2 className="text-lg font-medium mb-2">No earnings yet</h2>
                    <p className="text-muted-foreground text-sm">
                      Browse campaigns, submit content, and start earning.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                data?.submissions.map((s, i) => (
                  <Card key={s.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{s.track_title}</p>
                        <p className="text-muted-foreground text-xs">
                          {s.platform} · {(s.views_verified || 0).toLocaleString()} views · {new Date(s.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${((s.payout_amount_cents || 0) / 100).toFixed(2)}
                        </p>
                        {statusBadge(s)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
