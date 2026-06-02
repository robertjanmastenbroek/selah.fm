'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Heart, Video, ExternalLink } from 'lucide-react';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ArtistEmbed from '@/components/ArtistEmbed';

export default function ArtistDashboardSection() {
  const { data: profileData } = useSWR('/api/auth/me', fetcher, swrConfig);
  const profile = profileData?.user || null;
  const [artistData, setArtistData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.display_name) { setLoading(false); return; }

    // Search for artist profile matching the user's display name
    fetch(`/api/artist/search?q=${encodeURIComponent(profile.display_name)}&generate=false`)
      .then(r => r.json())
      .then(d => {
        if (d.artists?.length > 0) {
          // Found a matching artist — fetch full profile
          fetch(`/api/artists/${d.artists[0].slug}`)
            .then(r => r.json())
            .then(ad => setArtistData(ad))
            .catch(() => {})
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [profile?.display_name]);

  if (loading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!artistData?.artist) return null;

  const { artist, tracks, stats } = artistData;
  const slug = artist.profile_slug || '';

  return (
    <Card className="mb-8 border-primary/10 bg-primary/[0.02]">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Music size={14} className="text-primary" />
              Your artist profile
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{artist.artist_name}</p>
          </div>
          <Link href={`/artist/${slug}`}
            className="text-xs text-primary hover:underline flex items-center gap-1">
            View profile <ExternalLink size={10} />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-bold">{stats?.total_tracks || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Tracks</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-bold">{stats?.total_submissions || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Videos</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-bold">
              {stats?.total_views >= 1000 ? `${(stats.total_views / 1000).toFixed(1)}K` : stats?.total_views || 0}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Views</p>
          </div>
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <p className="text-lg font-bold">
              ${((stats?.total_donations_cents || 0) / 100).toFixed(0)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase">Donated</p>
          </div>
        </div>

        {/* Track list */}
        {tracks && tracks.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Your tracks</p>
            <div className="grid gap-2">
              {tracks.slice(0, 5).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2 min-w-0">
                    <Music size={12} className="text-muted-foreground shrink-0" />
                    <span className="text-xs truncate">{t.track_title}</span>
                    <span className="text-[10px] text-muted-foreground/50 shrink-0">
                      ${(t.cpm_rate_cents ? (t.cpm_rate_cents / 100) * 1000 : 0).toFixed(0)}/1M
                    </span>
                  </div>
                  <Link href={`/c/${t.campaign_slug || t.id}`}
                    className="text-[10px] text-primary hover:underline shrink-0">
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Embed widget */}
        <ArtistEmbed artistSlug={slug} artistName={artist.artist_name} />
      </CardContent>
    </Card>
  );
}
