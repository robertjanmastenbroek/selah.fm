'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/TopNav';
import CampaignSearch from '@/components/CampaignSearch';
import CampaignCover from '@/components/CampaignCover';
import { useToast } from '@/components/Toast';
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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState<Record<string, string>>({});
  const [submitPlatform, setSubmitPlatform] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<{ search?: string; platform?: string; minCpm?: number; offset?: number }>({});
  const { addToast } = useToast();

  const fetchCampaigns = (f: typeof filters = {}) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.search) params.set('search', f.search);
    if (f.platform) params.set('platform', f.platform);
    if (f.minCpm) params.set('minCpm', String(f.minCpm));
    if (f.offset) params.set('offset', String(f.offset));
    fetch(`/api/campaigns?${params}`)
      .then(r => r.json())
      .then(data => {
        setCampaigns(data.campaigns || []);
        setTotal(data.total || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleFilter = (f: any) => {
    setFilters(f);
    fetchCampaigns(f);
  };

  const handleJoin = (id: string) => {
    setJoined(prev => new Set([...prev, id]));
    setSubmitPlatform(prev => ({ ...prev, [id]: 'tiktok' }));
  };

  const handleSubmit = async (campaignId: string) => {
    const url = submitUrl[campaignId];
    if (!url) return;
    setSubmitting(campaignId);
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId, contentUrl: url, platform: submitPlatform[campaignId] || 'tiktok' }),
      });
      if (res.ok) {
        addToast('Submitted! Artist will review your video.', 'success');
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to submit', 'error');
      }
    } catch {
      addToast('Network error — try again', 'error');
    }
    setSubmitting(null);
    setSubmitUrl(prev => ({ ...prev, [campaignId]: '' }));
    setJoined(prev => { const next = new Set(prev); next.delete(campaignId); return next; });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title mb-1">Discover campaigns</h1>
            <p className="text-muted-foreground text-sm">{total} campaigns available</p>
          </div>
          <CampaignSearch onFilter={handleFilter} />
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
              <h2 className="text-lg font-medium mb-2">
                {Object.keys(filters).length > 0 ? 'No matching campaigns' : 'No campaigns yet'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {Object.keys(filters).length > 0 ? 'Try adjusting your filters.' : 'Be the first to create one.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="campaign-grid">
              {campaigns.map((c, i) => {
                const isJoined = joined.has(c.id);
                const cpm = c.cpm_rate_cents / 100;
                const budget = c.total_budget_cents / 100;
                const remaining = c.budget_remaining_cents / 100;
                const pct = budget > 0 ? ((budget - remaining) / budget) * 100 : 0;

                return (
                  <Card key={c.id} className="animate-slide-up overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                    <CampaignCover src={c.cover_art_url} title={c.track_title} className="h-40" />
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link href={`/c/${c.id}`} className="font-semibold text-lg leading-tight hover:text-accent-foreground transition-colors">
                            {c.track_title}
                          </Link>
                          <p className="text-muted-foreground text-sm">${cpm} CPM · ${budget} budget</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {(c.platforms || []).map((p: string) => (
                            <span key={p} className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              p === 'tiktok' ? 'bg-pink-500/10 text-pink-400' :
                              p === 'instagram' ? 'bg-purple-500/10 text-purple-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>{p === 'youtube' ? 'YT' : p === 'instagram' ? 'IG' : 'TT'}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{c.approved_submissions || '0'} submissions</span>
                        <span>{pct > 0 ? `${Math.round(pct)}% paid` : `${(c as any).budget_consumed_pct || 0}% used`}</span>
                      </div>
                      <Progress value={Math.min(pct, 100)} className="h-1.5" />

                      {c.recommended_hashtags && (
                        <p className="text-xs text-muted-foreground truncate">{c.recommended_hashtags}</p>
                      )}

                      {!isJoined ? (
                        <Button onClick={() => handleJoin(c.id)} className="w-full transition-all duration-200 hover:shadow-md">Join campaign</Button>
                      ) : submitting === c.id ? (
                        <Button disabled className="w-full">Submitting...</Button>
                      ) : (
                        <div className="space-y-2 animate-[slideUp_0.25s_ease-out]">
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
            {total > campaigns.length && (
              <div className="text-center mt-8">
                <Button variant="outline" onClick={() => fetchCampaigns({ ...filters, offset: campaigns.length })}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
