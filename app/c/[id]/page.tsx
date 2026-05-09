'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => {
        const found = Array.isArray(data) ? data.find((c: any) => c.id === id) : null;
        setCampaign(found);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-background"><Header /><main className="page-container"><Card><CardContent className="p-8 space-y-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-32 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card></main></div>
  );

  const cpm = campaign?.cpm_rate_cents ? campaign.cpm_rate_cents / 100 : 0;
  const budget = campaign?.total_budget_cents ? campaign.total_budget_cents / 100 : 0;
  const remaining = campaign?.budget_remaining_cents ? campaign.budget_remaining_cents / 100 : 0;
  const spent = budget - remaining;
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const subs = campaign?.approved_submissions || '0';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container max-w-2xl">
        <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to Discover</Link>

        <Card className="mb-8">
          {campaign?.cover_art_url && (
            <div className="h-56 overflow-hidden rounded-t-xl">
              <img src={campaign.cover_art_url} alt={campaign.track_title} className="w-full h-full object-cover" />
            </div>
          )}
          <CardContent className="p-8 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{campaign?.track_title || `Campaign #${id}`}</h1>
                <p className="text-muted-foreground text-sm mt-1">Music promotion on TikTok, Reels & Shorts</p>
              </div>
              <Badge>{campaign?.status || 'Active'}</Badge>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold text-amber-600">${cpm.toFixed(2)}</p><p className="text-muted-foreground text-xs mt-1">CPM per 1K views</p></div>
              <div><p className="text-2xl font-bold text-amber-600">${budget}</p><p className="text-muted-foreground text-xs mt-1">Total budget</p></div>
              <div><p className="text-2xl font-bold text-amber-600">{subs}</p><p className="text-muted-foreground text-xs mt-1">Submissions</p></div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Budget used</span><span>{pct.toFixed(0)}% · ${spent.toFixed(0)} of ${budget}</span></div>
              <Progress value={pct} className="h-2" />
            </div>

            {campaign?.recommended_hashtags && (
              <p className="text-sm text-muted-foreground">{campaign.recommended_hashtags}</p>
            )}
            {campaign?.requirements && (
              <Card className="bg-muted/50"><CardContent className="p-4 text-sm text-muted-foreground">{campaign.requirements}</CardContent></Card>
            )}

            <Button size="lg" className="w-full" onClick={() => window.location.href = '/login'}>
              Join this campaign
            </Button>
          </CardContent>
        </Card>

        <Card><CardContent className="p-8 space-y-4">
          <h2 className="text-xl font-semibold">How it works</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Artists post campaigns with CPM rates. Creators browse, pick tracks they love, 
            make TikToks, Instagram Reels, or YouTube Shorts, and submit their content links.
            Artists review and approve. Creators get paid for every verified view.
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No bots. No fake views. Every view is verified through platform APIs.
            Artists set a max payout per submission so their budget stays safe.
          </p>
        </CardContent></Card>
      </main>
    </div>
  );
}
