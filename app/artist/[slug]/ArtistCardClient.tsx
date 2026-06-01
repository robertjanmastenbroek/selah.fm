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
  soundcloud: { label: 'SoundCloud', color: '#FF5500' },
  instagram: { label: 'Instagram', color: '#E4405F' },
  tiktok: { label: 'TikTok', color: '#00F2EA' },
};

function MetricCard({ platform, label, value, deltas, color, delay, period }: any) {
  const [visible, setVisible] = useState(false);
  const countUp = useCountUp(value, 1500, visible);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  const delta = deltas?.[period];
  const deltaPct = deltas?.[`${period}_pct`];

  return (
    <div className={`bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{platform}</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>{fmt(visible ? countUp : 0)}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
      {delta != null && delta !== 0 && (
        <div className={`text-[11px] mt-1 font-medium ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {delta > 0 ? '+' : ''}{fmt(Math.abs(delta))}
          {deltaPct != null && <span className="ml-1 opacity-60">({deltaPct > 0 ? '+' : ''}{deltaPct}%)</span>}
        </div>
      )}
      {period === 'all' && deltas?.['28d_pct'] != null && deltas['28d_pct'] !== 0 && (
        <div className={`text-[10px] mt-1 ${deltas['28d_pct'] > 0 ? 'text-green-400/60' : 'text-red-400/60'}`}>
          {deltas['28d_pct'] > 0 ? '↗' : '↘'} {Math.abs(deltas['28d_pct'])}% this month
        </div>
      )}
    </div>
  );
}

export default function ArtistCardClient({ artist, initialData }: { artist: any; initialData: any }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);
  const [period, setPeriod] = useState<'28d' | '1y' | 'all'>('28d');

  const profile = data?.profile || {};
  const metrics = data?.metrics || {};
  const cacheMsg = data?.cached ? data.message : null;

  // Build metric cards with deltas
  const cards: any[] = [];
  Object.entries(metrics).forEach(([platform, metricList]: [string, any]) => {
    const meta = platformMeta[platform] || { label: platform, color: '#6B7280' };
    const list = Array.isArray(metricList) ? metricList : [];
    const best = [...list].sort((a: any, b: any) => (b.value || 0) - (a.value || 0));
    const top = best[0];
    if (top && top.value > 0) {
      cards.push({
        platform: meta.label,
        label: (top.metric_name || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        value: top.value,
        deltas: top.deltas || {},
        color: meta.color,
        delay: 100 + cards.length * 120,
        period,
      });
    }
  });

  // Presence badges
  const presences: { platform: string; handle: string; url: string }[] = [];
  if (artist.instagram_handle) presences.push({ platform: 'Instagram', handle: `@${artist.instagram_handle}`, url: `https://instagram.com/${artist.instagram_handle}` });
  if (artist.tiktok_handle) presences.push({ platform: 'TikTok', handle: `@${artist.tiktok_handle}`, url: `https://tiktok.com/@${artist.tiktok_handle}` });
  if (artist.youtube_url) presences.push({ platform: 'YouTube', handle: 'Channel', url: artist.youtube_url });

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/artist/${artist.slug}/refresh`);
      const fresh = await res.json();
      if (!fresh.error) { setData(fresh); setRefreshed(true); setTimeout(() => setRefreshed(false), 3000); }
    } catch {}
    setRefreshing(false);
  }

  useEffect(() => {
    if (cards.length === 0 && presences.length === 0 && !refreshing) handleRefresh();
  }, []);

  const totalNow = cards.reduce((sum, c) => sum + c.value, 0);
  const totalMonthAgo = cards.reduce((sum, c) => sum + (c.value - (c.deltas?.['28d'] || 0)), 0);
  const monthlyGrowth = totalNow - totalMonthAgo;

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
          <p className="text-sm text-muted-foreground mt-2">
            {cards.length > 0 ? `${cards.length} metrics across ${Object.keys(metrics).length} platforms` :
             refreshing ? 'Fetching live data...' : 'No metrics yet'}
            {profile?.last_refreshed_at && ` · Updated ${new Date(profile.last_refreshed_at).toLocaleDateString()}`}
          </p>

          {/* Time period selector */}
          <div className="inline-flex gap-1 mt-4 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
            {[{ key: '28d', label: '28 Days' }, { key: '1y', label: '1 Year' }, { key: 'all', label: 'All Time' }].map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${period === p.key ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {p.label}
              </button>
            ))}
          </div>

          {totalNow > 0 && (
            <div className="mt-4">
              <div className="text-4xl font-bold text-primary">{useCountUp(totalNow, 2000).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">total {period === '28d' ? 'followers' : period === '1y' ? 'followers' : 'followers'}</div>
              {monthlyGrowth !== 0 && (
                <div className={`text-xs mt-1 ${monthlyGrowth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {monthlyGrowth > 0 ? '+' : ''}{fmt(Math.abs(monthlyGrowth))} this month
                </div>
              )}
            </div>
          )}

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
            <h2 className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider mb-3">Streaming</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cards.map((card, i) => <MetricCard key={`${card.platform}-${card.label}`} {...card} period={period} />)}
            </div>
          </section>
        )}

        {presences.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-muted-foreground/40 uppercase tracking-wider mb-3">Also On</h2>
            <div className="flex flex-wrap gap-2">
              {presences.map(p => (
                <a key={p.platform} href={p.url} target="_blank"
                  className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-muted-foreground hover:border-white/[0.12] transition-colors">
                  {p.platform}: {p.handle}
                </a>
              ))}
            </div>
          </section>
        )}

        {cards.length === 0 && presences.length === 0 && !refreshing && (
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
