'use client';

import { useEffect, useState, useRef } from 'react';

function useCountUp(target: number, duration = 1500, startOnMount = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!startOnMount) return;
    const startTime = performance.now();
    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      setValue(Math.floor((1 - Math.pow(2, -10 * progress)) * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);
  return value;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

const platformMeta: Record<string, { label: string; color: string }> = {
  spotify: { label: 'Spotify', color: '#1DB954' },
  deezer: { label: 'Deezer', color: '#A238FF' },
  youtube: { label: 'YouTube', color: '#FF0000' },
  instagram: { label: 'Instagram', color: '#E4405F' },
  tiktok: { label: 'TikTok', color: '#00F2EA' },
  soundcloud: { label: 'SoundCloud', color: '#FF5500' },
};

function MetricCard({ platform, label, value, handle, color, delay }: { platform: string; label: string; value: number; handle?: string; color: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  const countUp = useCountUp(value, 1500, true);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div className={`bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{platform}</div>
      {handle ? (
        <div className="text-sm font-medium" style={{ color }}>{handle}</div>
      ) : (
        <div className="text-2xl font-bold tabular-nums" style={{ color }}>{fmt(visible ? countUp : 0)}</div>
      )}
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export default function ArtistCardClient({ artist, initialData }: { artist: any; initialData: any }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  const profile = data?.profile || {};
  const metrics = data?.metrics || {};

  // Build all metric cards — streaming platforms from metrics, social from artist props
  const cards: any[] = [];

  // Streaming platforms from metrics — show ALL metrics per platform
  Object.entries(metrics).forEach(([platform, metricList]: [string, any]) => {
    const meta = platformMeta[platform] || { label: platform, color: '#6B7280' };
    const list = Array.isArray(metricList) ? metricList : [];
    // Deduplicate by metric_name (take highest value)
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const m of [...list].sort((a: any, b: any) => (b.value || 0) - (a.value || 0))) {
      if (!seen.has(m.metric_name)) { seen.add(m.metric_name); unique.push(m); }
    }
    for (const m of unique) {
      cards.push({
        platform: meta.label,
        label: (m.metric_name || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        value: m.value || 0,
        color: meta.color,
        delay: 100 + cards.length * 120,
      });
    }
  });

  // Social platforms from artist audit data
  if (artist.instagram_handle) {
    cards.push({
      platform: 'Instagram',
      label: 'Handle',
      value: 0,
      handle: '@' + artist.instagram_handle,
      color: platformMeta.instagram?.color || '#E4405F',
      delay: 100 + cards.length * 120,
    });
  }
  if (artist.tiktok_handle) {
    cards.push({
      platform: 'TikTok',
      label: 'Handle',
      value: 0,
      handle: '@' + artist.tiktok_handle,
      color: platformMeta.tiktok?.color || '#00F2EA',
      delay: 100 + cards.length * 120,
    });
  }
  if (artist.youtube_url && !metrics.youtube) {
    cards.push({
      platform: 'YouTube',
      label: 'Handle',
      value: 0,
      handle: 'Channel',
      color: platformMeta.youtube?.color || '#FF0000',
      delay: 100 + cards.length * 120,
    });
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/artist/${artist.slug}/refresh`);
      const fresh = await res.json();
      if (!fresh.error) { setData(fresh); setRefreshed(true); setTimeout(() => setRefreshed(false), 3000); }
    } catch {}
    setRefreshing(false);
  }

  // Auto-refresh if no data at all
  useEffect(() => {
    if (cards.length === 0 && !refreshing) handleRefresh();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <div className="relative border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="max-w-2xl mx-auto px-6 py-14 text-center relative">
          {profile?.spotify_image_url && (
            <img src={profile.spotify_image_url} alt={artist.artist_name}
              className="w-28 h-28 rounded-full mx-auto object-cover border-2 border-white/10 shadow-xl mb-5" />
          )}
          <h1 className="text-3xl font-bold">{artist.artist_name}</h1>

          {/* Hero numbers — total followers + total streams */}
          {(profile?.total_followers > 0 || profile?.total_streams > 0) && (
            <div className="flex items-center justify-center gap-8 mt-4">
              {profile?.total_followers > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-white tabular-nums">
                    {useCountUp(profile.total_followers, 2000).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Followers</div>
                </div>
              )}
              {profile?.total_streams > 0 && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary tabular-nums">
                    {useCountUp(profile.total_streams, 2000).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total Streams</div>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-2">
            {cards.length > 0 ? `${cards.length} metrics across ${Object.keys(metrics).length} platforms` :
             refreshing ? 'Fetching live data...' : 'No metrics yet'}
            {profile?.last_refreshed_at && ` · Updated ${new Date(profile.last_refreshed_at).toLocaleDateString()}`}
          </p>

          <button onClick={handleRefresh} disabled={refreshing}
            className={`mt-4 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              refreshed ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
            } disabled:opacity-40`}>
            {refreshing ? '⏳ Fetching...' : refreshed ? '✅ Updated' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {cards.length > 0 && (
          <section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cards.map((card, i) => <MetricCard key={`${card.platform}-${card.label}`} {...card} />)}
            </div>
          </section>
        )}

        {cards.length === 0 && !refreshing && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">No data yet</p>
            <p className="text-sm">Click &quot;Refresh&quot; to fetch live stats</p>
          </div>
        )}
      </div>

      {artist.campaign_slug && (
        <div className="text-center pb-12">
          <a href={`/c/${artist.campaign_slug}?utm_source=artist_card`}
            className="inline-block px-6 py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
            🎵 Promote &quot;{artist.latest_track_name || 'your music'}&quot; — earn per view
          </a>
        </div>
      )}

      <div className="text-center pb-8 border-t border-white/[0.04] pt-6">
        <p className="text-xs text-muted-foreground">Powered by <a href="/" className="text-primary/60 hover:text-primary">Selah.fm</a> · Free artist dashboard</p>
      </div>
    </div>
  );
}
