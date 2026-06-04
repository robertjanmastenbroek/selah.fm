'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/TopNav';
import { Skeleton } from '@/components/ui/skeleton';
import { Film, Megaphone, Eye, DollarSign, TrendingUp, Users } from 'lucide-react';

export default function FeedPage() {
  const [feed, setFeed] = useState<any[]>([]);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/feed?limit=30', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setFeed(d.feed || []);
        setFollowing(d.following || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              Feed
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {following > 0 ? `Following ${following} artist${following !== 1 ? 's' : ''}` : 'Follow artists to see their activity'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl bg-white/[0.03]" />)}
          </div>
        ) : feed.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp size={40} className="mx-auto mb-4 text-muted-foreground/20" />
            <h2 className="text-lg font-semibold mb-2">
              {following === 0 ? 'Follow artists to get started' : 'No recent activity'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {following === 0
                ? 'Browse artists and follow the ones you like. Their submissions and campaigns will appear here.'
                : 'Artists you follow haven\'t posted recently. Browse more artists to expand your feed.'}
            </p>
            <Link href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition-all">
              <Users size={16} /> Browse artists
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {feed.map((item: any, i: number) => {
              const isSubmission = item.type === 'submission';
              const trackSlug = (item.track_title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
              const href = isSubmission
                ? `/artist/${item.artist_slug}`
                : `/artist/${item.artist_slug}/tracks/${trackSlug}`;
              return (
                <Link key={`${item.type}-${item.id}-${i}`} href={href}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSubmission ? 'bg-indigo-500/10' : 'bg-emerald-500/10'}`}>
                    {isSubmission ? <Film size={18} className="text-indigo-400" /> : <Megaphone size={18} className="text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {isSubmission ? item.track_title || 'New submission' : item.title || 'New campaign'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.artist_name}
                      {isSubmission && item.views_verified > 0 && (
                        <span className="ml-2 text-muted-foreground/50">
                          · {parseInt(item.views_verified).toLocaleString()} views
                        </span>
                      )}
                      {!isSubmission && item.total_budget_cents > 0 && (
                        <span className="ml-2 text-muted-foreground/50">
                          · ${(item.total_budget_cents / 100).toFixed(0)} budget
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-[10px] text-muted-foreground/40 shrink-0">
                    {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
