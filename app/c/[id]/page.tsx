'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/TopNav';
import CampaignCover from '@/components/CampaignCover';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface Campaign {
  id: string;
  track_title: string;
  track_url: string;
  cover_art_url: string;
  cpm_rate_cents: number;
  total_budget_cents: number;
  budget_remaining_cents: number;
  platforms: string[];
  status: string;
  content_assets_url: string;
  recommended_hashtags: string;
  requirements: string;
  approved_submissions: string;
  total_verified_views: string;
}

export default function CampaignPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${params.id}`)
      .then(r => r.json())
      .then(d => { setCampaign(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-16">
          <div className="space-y-4">
            <Skeleton className="h-48 md:h-64 rounded-2xl" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </main>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign not found</h1>
          <Link href="/browse">
            <Button>Browse campaigns</Button>
          </Link>
        </main>
      </div>
    );
  }

  const budget = campaign.total_budget_cents / 100;
  const remaining = campaign.budget_remaining_cents / 100;
  const spent = budget - remaining;
  const cpm = campaign.cpm_rate_cents / 100;
  const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Cover image */}
        <CampaignCover src={campaign.cover_art_url} title={campaign.track_title} className="h-48 md:h-64 rounded-2xl mb-8" />

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{campaign.track_title}</h1>
            <a href={campaign.track_url} target="_blank" rel="noopener noreferrer" className="text-accent-foreground hover:underline text-sm">
              Listen on Spotify →
            </a>
          </div>
          <Badge variant="outline" className="border-accent/30 text-accent-foreground">
            {campaign.status === 'active' ? 'Live' : campaign.status}
          </Badge>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'CPM', value: `$${cpm}` },
            { label: 'Budget', value: `$${budget}` },
            { label: 'Submissions', value: campaign.approved_submissions || '0' },
            { label: 'Views', value: parseInt(campaign.total_verified_views || '0').toLocaleString() },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <div className="text-lg font-bold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Budget progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-muted-foreground">Budget spent</span>
              <span className="text-sm font-medium">${spent.toFixed(0)} of ${budget}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Campaign details */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {campaign.platforms?.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3">Platforms</h3>
                <div className="flex gap-2 flex-wrap">
                  {campaign.platforms.map(p => <Badge key={p} variant="secondary">{p}</Badge>)}
                </div>
              </CardContent>
            </Card>
          )}
          {campaign.recommended_hashtags && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-3">Recommended hashtags</h3>
                <p className="text-sm text-muted-foreground">{campaign.recommended_hashtags}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Requirements */}
        {campaign.requirements && (
          <Card className="mb-8">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">Requirements for creators</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.requirements}</p>
            </CardContent>
          </Card>
        )}

        {/* Google Drive */}
        {campaign.content_assets_url && (
          <Card className="mb-8">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">Content assets</h3>
              <a href={campaign.content_assets_url} target="_blank" rel="noopener noreferrer" className="text-accent-foreground hover:underline text-sm">
                Open Google Drive folder →
              </a>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="text-center py-8">
          <Link href="/browse">
            <Button size="lg">← Back to browse</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
