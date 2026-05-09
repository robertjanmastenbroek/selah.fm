'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Creator {
  id: string;
  display_name: string;
  bio: string;
  genres: string;
  tiktok_handle: string;
  instagram_handle: string;
  youtube_handle: string;
  preferred_cpm_cents: number;
  profile_image_url: string;
  acceptance_rate: number;
  total_earned_cents: number;
  total_verified_views: number;
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState<string | null>(null);
  const [offerCpm, setOfferCpm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/creators')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCreators(data); })
      .finally(() => setLoading(false));
  }, []);

  const hireCreator = async (creatorId: string) => {
    const cpm = offerCpm[creatorId];
    if (!cpm) return;
    setHiring(creatorId);
    try {
      await fetch('/api/creators/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, cpmCents: Math.round(parseFloat(cpm) * 100), campaignId: 'current' }),
      });
    } catch {}
    setHiring(null);
    setOfferCpm(prev => ({ ...prev, [creatorId]: '' }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <div className="mb-8">
          <h1 className="section-title mb-1">Creators</h1>
          <p className="text-muted-foreground text-sm">Find the right creators for your music.</p>
        </div>

        {loading ? (
          <div className="campaign-grid">
            {[1,2,3].map(i => <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-2 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-10 w-full" /></CardContent></Card>)}
          </div>
        ) : creators.length === 0 ? (
          <Card className="text-center py-16"><CardContent><p className="text-4xl mb-4 opacity-10">🎬</p><h2 className="text-lg font-medium">No creators yet</h2><p className="text-muted-foreground text-sm">Creators join when they sign up and submit content.</p></CardContent></Card>
        ) : (
          <div className="campaign-grid">
            {creators.map((c, i) => {
              const acceptancePct = Math.round((c.acceptance_rate || 0) * 100);
              const defaultCpm = (c.preferred_cpm_cents || 100) / 100;
              const isHiring = hiring === c.id;

              return (
                <Card key={c.id} className="animate-slide-up overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                        {c.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <a href={`/creators/${c.id}`} className="font-semibold hover:text-accent-foreground transition-colors">
                          {c.display_name || 'Creator'}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {c.tiktok_handle && `@${c.tiktok_handle}`}
                          {c.instagram_handle && ` · @${c.instagram_handle}`}
                        </p>
                      </div>
                    </div>

                    {c.bio && <p className="text-sm text-muted-foreground line-clamp-2">{c.bio}</p>}

                    {c.genres && (
                      <div className="flex gap-1 flex-wrap">
                        {c.genres.split(',').slice(0, 3).map(g => (
                          <Badge key={g} variant="outline" className="text-xs">{g.trim()}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 text-center py-2 border-y">
                      <div>
                        <div className="font-bold text-sm">${((c.total_earned_cents || 0) / 100).toFixed(0)}</div>
                        <div className="text-muted-foreground text-[10px]">earned</div>
                      </div>
                      <div>
                        <div className="font-bold text-sm">{((c.total_verified_views || 0) / 1000).toFixed(1)}K</div>
                        <div className="text-muted-foreground text-[10px]">views</div>
                      </div>
                      <div>
                        <div className="font-bold text-sm">{acceptancePct}%</div>
                        <div className="text-muted-foreground text-[10px]">accepted</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Default ${defaultCpm}</span>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={offerCpm[c.id] || defaultCpm.toString()}
                        onChange={e => setOfferCpm(prev => ({ ...prev, [c.id]: e.target.value }))}
                        className="w-20 border rounded-md px-2 py-1.5 text-xs bg-background"
                        placeholder={`${defaultCpm}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => hireCreator(c.id)}
                        disabled={isHiring}
                        className="flex-1">
                        {isHiring ? 'Hiring...' : 'Hire'}
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Offer a custom CPM rate to this creator for your campaign.
                    </p>
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
