'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/TopNav';
import CreatorAvatar from '@/components/CreatorAvatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

interface Artist {
  id: string;
  display_name: string;
  bio: string;
  total_campaigns: number;
  active_campaigns: number;
  total_budget_cents: number;
  total_spent_cents: number;
  total_submissions: number;
  total_views: number;
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchArtists = (search = '') => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/artists?${params}`)
      .then(r => r.json())
      .then(data => { setArtists(data.artists || []); setTotal(data.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchArtists(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArtists(searchText);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <div className="mb-8">
          <h1 className="section-title mb-1">Artists</h1>
          <p className="text-muted-foreground text-sm">{total} artists running campaigns</p>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <input
            type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
            placeholder="Search artists..."
            className="w-full border rounded-lg px-4 py-2.5 text-sm bg-background"
          />
        </form>

        {loading ? (
          <div className="campaign-grid">
            {[1,2,3].map(i => <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-1/3" /><Skeleton className="h-2 w-full" /><Skeleton className="h-16 w-full" /></CardContent></Card>)}
          </div>
        ) : artists.length === 0 ? (
          <Card className="text-center py-16"><CardContent><p className="text-4xl mb-4 opacity-10">🎵</p><h2 className="text-lg font-medium">No artists yet</h2><p className="text-muted-foreground text-sm">Artists appear here when they create their first campaign.</p></CardContent></Card>
        ) : (
          <div className="campaign-grid">
            {artists.map((a, i) => {
              const spent = (a.total_spent_cents || 0) / 100;
              const views = a.total_views || 0;
              return (
                <Card key={a.id} className="animate-slide-up overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <CreatorAvatar name={a.display_name} size="md" />
                      <div>
                        <h3 className="font-semibold">
                          {a.display_name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {a.active_campaigns} active · {a.total_campaigns} total campaigns
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center py-2 border-y">
                      <div>
                        <div className="font-bold text-sm">${spent.toFixed(0)}</div>
                        <div className="text-muted-foreground text-[10px]">spent</div>
                      </div>
                      <div>
                        <div className="font-bold text-sm">{views >= 1000 ? `${(views/1000).toFixed(1)}K` : views}</div>
                        <div className="text-muted-foreground text-[10px]">views</div>
                      </div>
                      <div>
                        <div className="font-bold text-sm">{a.total_submissions}</div>
                        <div className="text-muted-foreground text-[10px]">submissions</div>
                      </div>
                    </div>

                    <Link href={`/browse?search=${encodeURIComponent(a.display_name)}`}>
                      <Button variant="outline" size="sm" className="w-full text-xs">View campaigns →</Button>
                    </Link>
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
