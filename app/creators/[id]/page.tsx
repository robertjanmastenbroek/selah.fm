'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  acceptance_rate: number;
  total_earned_cents: number;
  total_verified_views: number;
  total_submissions: number;
}

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/creators/${id}`)
      .then(r => r.json())
      .then(d => { setCreator(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-background pb-20"><Header /><main className="page-container"><Skeleton className="h-40 w-full mb-4" /><Skeleton className="h-6 w-1/3 mb-2" /><Skeleton className="h-4 w-2/3" /></main><BottomNav /></div>;
  if (!creator) return <div className="min-h-screen bg-background pb-20"><Header /><main className="page-container text-center py-20"><h2 className="text-xl font-bold mb-2">Creator not found</h2></main><BottomNav /></div>;

  const earned = (creator.total_earned_cents || 0) / 100;
  const views = (creator.total_verified_views || 0);
  const acceptance = Math.round((creator.acceptance_rate || 0) * 100);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="page-container max-w-2xl">
        {/* Profile header */}
        <Card className="mb-6 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-amber-100 to-amber-50" />
          <CardContent className="p-6 -mt-12 relative">
            <div className="w-20 h-20 rounded-full bg-muted border-4 border-background flex items-center justify-center text-2xl font-bold">
              {creator.display_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="mt-4">
              <h1 className="text-2xl font-bold">{creator.display_name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {creator.tiktok_handle && <Badge variant="outline">@TikTok</Badge>}
                {creator.instagram_handle && <Badge variant="outline">@Instagram</Badge>}
                {creator.youtube_handle && <Badge variant="outline">@YouTube</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { value: `$${earned.toFixed(0)}`, label: 'Earned' },
            { value: views >= 1000 ? `${(views/1000).toFixed(1)}K` : views, label: 'Views' },
            { value: `${acceptance}%`, label: 'Accepted' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-accent-foreground">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bio */}
        {creator.bio && (
          <Card className="mb-6">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{creator.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Genres & CPM */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-2">Genres</h3>
              <div className="flex gap-1 flex-wrap">
                {(creator.genres || '').split(',').slice(0,4).map(g => (
                  <Badge key={g} variant="secondary" className="text-xs">{g.trim()}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-2">CPM Rate</h3>
              <div className="text-2xl font-bold text-accent-foreground">${(creator.preferred_cpm_cents / 100).toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">per 1,000 views</div>
            </CardContent>
          </Card>
        </div>

        {/* Hire CTA */}
        <Card className="mb-6 border-accent/20 bg-accent/5">
          <CardContent className="p-5 text-center space-y-3">
            <h3 className="font-semibold">Want this creator to promote your music?</h3>
            <p className="text-sm text-muted-foreground">Hire them for your campaign at their CPM rate or negotiate a custom offer.</p>
            <Button className="w-full" onClick={() => window.location.href = `/dashboard?hire=${creator.id}&cpm=${creator.preferred_cpm_cents}&name=${encodeURIComponent(creator.display_name)}`}>Hire this creator</Button>
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
