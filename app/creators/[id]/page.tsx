'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/creators').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        const found = data.find((c: any) => c.id === id);
        setCreator(found || null);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-background"><Header /><main className="page-container"><Card><CardContent className="p-8 space-y-4"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-20 w-full" /></CardContent></Card></main></div>
  );

  if (!creator) return (
    <div className="min-h-screen bg-background"><Header /><main className="page-container"><Card className="text-center py-16"><CardContent><p className="text-4xl mb-4">—</p><p className="text-muted-foreground">Creator not found.</p></CardContent></Card></main></div>
  );

  const cpm = (creator.preferred_cpm_cents || 300) / 100;
  const earned = (creator.total_earned_cents || 0) / 100;
  const rate = creator.acceptance_rate || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container max-w-2xl">
        <Link href="/creators" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">← Back to Creators</Link>

        <Card className="mb-8">
          <CardContent className="p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-accent/10 text-accent-foreground flex items-center justify-center font-bold text-2xl flex-shrink-0">
                {creator.display_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{creator.display_name || 'Creator'}</h1>
                <p className="text-muted-foreground text-sm">
                  {[creator.tiktok_handle && `@${creator.tiktok_handle}`, creator.instagram_handle && `@${creator.instagram_handle}`, creator.youtube_handle && `@${creator.youtube_handle}`].filter(Boolean).join(' · ') || 'No platforms connected'}
                </p>
                <Badge variant="secondary" className="mt-2">{rate}% acceptance rate</Badge>
              </div>
            </div>

            {creator.bio && <p className="text-muted-foreground">{creator.bio}</p>}

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-accent-foreground">${cpm}</p>
                <p className="text-muted-foreground text-xs">Preferred CPM</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{creator.total_submissions || 0}</p>
                <p className="text-muted-foreground text-xs">Total posts</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-accent-foreground">${earned.toFixed(0)}</p>
                <p className="text-muted-foreground text-xs">Total earned</p>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={() => window.location.href = '/dashboard'}>
              Hire for a campaign
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
