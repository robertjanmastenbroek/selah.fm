'use client';

import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import RatingPrompt from '@/components/RatingPrompt';

function formatMoney(cents: number): string {
  return '$' + (cents / 100).toFixed(2);
}

interface Submission {
  id: string; track_title: string; platform: string; views_verified: number;
  payout_amount_cents: number; payout_status: string; review_status: string;
  submitted_at: string; content_url: string;
}

export default function EarningsPage() {
  const { data: profileData } = useSWR('/api/auth/me', fetcher, swrConfig);
  const profile = profileData?.user || null;

  const { data, error, isLoading, mutate } = useSWR('/api/earnings', fetcher, swrConfig);
  const earnings = data?.submissions ? data : { submissions: [], totalPaid: 0, totalPending: 0, totalEarned: 0 };

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

        {error ? (
          <Card className="text-center py-16">
            <CardContent>
              <h2 className="text-lg font-medium mb-2">Couldn't load earnings</h2>
              <p className="text-muted-foreground text-sm mb-4">Check your connection.</p>
              <Button variant="outline" onClick={() => mutate()}>Retry</Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
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
            <Card className="text-center mb-6 animate-fade-in overflow-hidden">
              <img src="/images/earnings-visual.png" alt="Earnings" className="w-full h-32 object-cover opacity-15" loading="lazy" />
              <CardContent className="p-8">
                <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">Available balance</p>
                <p className="text-5xl font-bold tracking-tight">
                  {formatMoney(earnings.totalPaid || 0)}
                </p>
                {(earnings.totalPending || 0) > 0 && (
                  <p className="text-muted-foreground text-sm mt-1">
                    +{formatMoney(earnings.totalPending || 0)} pending
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
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/stripe/connect');
                        if (!res.ok) {
                          const err = await res.json().catch(() => ({ error: 'Failed to connect' }));
                          alert(err.error || 'Failed to connect Stripe. Try again.');
                          return;
                        }
                        const data = await res.json();
                        if (data.url) window.location.href = data.url;
                      } catch {
                        alert('Network error. Check your connection and try again.');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    Set up Stripe Connect →
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Takes 2 minutes. Works in 40+ countries.</p>
              </CardContent>
            </Card>
            )}

            {/* Submissions list */}
            <div className="space-y-2">
              {earnings.submissions.length === 0 ? (
                <Card className="text-center py-16 animate-fade-in">
                  <CardContent>
                    <img src="/images/empty-earnings.png" alt="No earnings yet" className="mx-auto mb-6 w-40 h-40 object-contain opacity-80" loading="lazy" />
                    <h2 className="text-lg font-medium mb-2">No earnings yet</h2>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                      Browse campaigns, submit content, and start earning per verified view.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                earnings.submissions.map((s: Submission, i: number) => (
                  <div key={s.id}>
                    <Card className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{s.track_title}</p>
                          <p className="text-muted-foreground text-xs">
                            {s.platform} · {(s.views_verified || 0).toLocaleString()} views · {new Date(s.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatMoney(s.payout_amount_cents || 0)}
                          </p>
                          {statusBadge(s)}
                        </div>
                      </CardContent>
                    </Card>
                    {/* Rating prompt: show if paid */}
                    {s.payout_status === 'paid' && (
                      <div className="mt-1 mb-3">
                        <RatingPrompt
                          submissionId={s.id}
                          role="creator"
                          targetName={s.track_title}
                          onRated={() => {}}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
