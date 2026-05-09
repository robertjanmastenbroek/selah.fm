'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  preferred_cpm_cents: number;
  tiktok_handle: string;
  instagram_handle: string;
  youtube_handle: string;
  profile_image_url: string;
  total_submissions: number;
  approved_submissions: number;
  acceptance_rate: number;
  total_earned_cents: number;
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/creators')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCreators(data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <div className="mb-8">
          <h1 className="section-title mb-1">Creators</h1>
          <p className="text-muted-foreground text-sm">Find creators to promote your music.</p>
        </div>

        {loading ? (
          <div className="campaign-grid">
            {[1,2,3,4].map(i => (
              <Card key={i}><CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-10 w-full" />
              </CardContent></Card>
            ))}
          </div>
        ) : creators.length === 0 ? (
          <Card className="text-center py-16"><CardContent>
            <p className="text-4xl mb-4 opacity-10">👥</p>
            <h2 className="text-lg font-medium">No creators yet</h2>
            <p className="text-muted-foreground text-sm">Creators join when they submit their first campaign.</p>
          </CardContent></Card>
        ) : (
          <div className="campaign-grid">
            {creators.map((c, i) => {
              const cpm = (c.preferred_cpm_cents || 300) / 100;
              const earned = (c.total_earned_cents || 0) / 100;
              const rate = c.acceptance_rate || 0;

              return (
                <Card key={c.id} className="animate-slide-up overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {c.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{c.display_name || 'Creator'}</h3>
                        <p className="text-muted-foreground text-xs truncate">
                          {[c.tiktok_handle && 'TikTok', c.instagram_handle && 'IG', c.youtube_handle && 'YT'].filter(Boolean).join(' · ') || 'No platforms'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">{rate}% accept</Badge>
                    </div>

                    {c.bio && <p className="text-muted-foreground text-sm line-clamp-2">{c.bio}</p>}

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="font-bold">${cpm}</p>
                        <p className="text-muted-foreground text-[10px]">CPM</p>
                      </div>
                      <div>
                        <p className="font-bold">{c.total_submissions}</p>
                        <p className="text-muted-foreground text-[10px]">posts</p>
                      </div>
                      <div>
                        <p className="font-bold">${earned.toFixed(0)}</p>
                        <p className="text-muted-foreground text-[10px]">earned</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/creators/${c.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">Profile</Button>
                      </Link>
                      <Button size="sm" className="flex-1" onClick={() => window.location.href = '/dashboard'}>
                        Hire
                      </Button>
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
