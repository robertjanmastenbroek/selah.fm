'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Campaign {
  id: string;
  track_title: string;
  cover_art_url: string;
  cpm_rate_cents: number;
  total_budget_cents: number;
  budget_remaining_cents: number;
  platforms: string[];
  approved_submissions: string;
  recommended_hashtags: string;
}

export default function BrowsePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState<Record<string, string>>({});
  const [submitPlatform, setSubmitPlatform] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCampaigns(data); })
      .finally(() => setLoading(false));
  }, []);

  const handleJoin = (id: string) => {
    setJoined(prev => new Set([...prev, id]));
    setSubmitPlatform(prev => ({ ...prev, [id]: 'tiktok' }));
  };

  const handleSubmit = async (campaignId: string) => {
    const url = submitUrl[campaignId];
    if (!url) return;
    setSubmitting(campaignId);
    try {
      await fetch('/api/submissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, contentUrl: url, platform: submitPlatform[campaignId] || 'tiktok', postedAt: new Date().toISOString() }),
      });
    } catch {}
    setSubmitting(null);
    setSubmitUrl(prev => ({ ...prev, [campaignId]: '' }));
    setJoined(prev => { const next = new Set(prev); next.delete(campaignId); return next; });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <div className="mb-8">
          <h1 className="section-title mb-1">Discover campaigns</h1>
          <p className="text-muted-foreground text-sm">Pick a track, create content, get paid.</p>
        </div>

        {loading ? (
          <div className="campaign-grid">
            {[1,2,3].map(i => (
              <Card key={i}><CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent></Card>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <p className="text-6xl mb-4 opacity-10">♪</p>
              <h2 className="text-lg font-medium mb-2">No campaigns yet</h2>
              <p className="text-muted-foreground text-sm">Be the first to create one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="campaign-grid">
            {campaigns.map((c, i) => {
              const isJoined = joined.has(c.id);
              const cpm = c.cpm_rate_cents / 100;
              const budget = c.total_budget_cents / 100;
              const remaining = c.budget_remaining_cents / 100;
              const pct = budget > 0 ? ((budget - remaining) / budget) * 100 : 0;

              return (
                <Card key={c.id} className="animate-slide-up overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                  {c.cover_art_url && (
                    <div className="h-40 overflow-hidden">
                      <img src={c.cover_art_url} alt={c.track_title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/c/${c.id}`} className="font-semibold text-lg leading-tight hover:text-accent-foreground transition-colors">
                          {c.track_title}
                        </Link>
                        <p className="text-muted-foreground text-sm">${cpm} CPM · ${budget} budget</p>
                      </div>
                      <Badge variant="secondary">${cpm}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{c.approved_submissions || '0'} submissions</span>
                      <span>${remaining.toFixed(0)} left</span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-1.5" />

                    {c.recommended_hashtags && (
                      <p className="text-xs text-muted-foreground truncate">{c.recommended_hashtags}</p>
                    )}

                    {!isJoined ? (
                      <Button onClick={() => handleJoin(c.id)} className="w-full">Join campaign</Button>
                    ) : submitting === c.id ? (
                      <Button disabled className="w-full">Submitting...</Button>
                    ) : (
                      <div className="space-y-2 animate-slide-up">
                        <div className="flex gap-2">
                          <select value={submitPlatform[c.id] || 'tiktok'}
                            onChange={e => setSubmitPlatform(prev => ({ ...prev, [c.id]: e.target.value }))}
                            className="border rounded-md px-2 py-2 text-sm bg-background">
                            <option value="tiktok">TikTok</option>
                            <option value="instagram">Reels</option>
                            <option value="youtube">Shorts</option>
                          </select>
                          <Input value={submitUrl[c.id] || ''}
                            onChange={e => setSubmitUrl(prev => ({ ...prev, [c.id]: e.target.value }))}
                            placeholder="Paste video link" className="flex-1" />
                          <Button onClick={() => handleSubmit(c.id)} disabled={!submitUrl[c.id]}>Submit</Button>
                        </div>
                      </div>
                    )}
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
