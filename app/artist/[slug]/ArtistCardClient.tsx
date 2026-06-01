'use client';

import { useEffect, useState, useRef } from 'react';

function useCountUp(target: number, duration = 1500, startOnMount = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!startOnMount) return;
    let startTime = performance.now();
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

const platformMeta: Record<string, { label: string; color: string; icon: string }> = {
  spotify: { label: 'Spotify', color: '#1DB954', icon: '🟢' },
  deezer: { label: 'Deezer', color: '#A238FF', icon: '🟣' },
  youtube: { label: 'YouTube', color: '#FF0000', icon: '🔴' },
  soundcloud: { label: 'SoundCloud', color: '#FF5500', icon: '🟠' },
  instagram: { label: 'Instagram', color: '#E4405F', icon: '📷' },
  tiktok: { label: 'TikTok', color: '#000', icon: '🎵' },
  facebook: { label: 'Facebook', color: '#1877F2', icon: '📘' },
  twitter: { label: 'Twitter/X', color: '#1DA1F2', icon: '🐦' },
};

interface MetricCardProps { platform: string; label: string; value: number; changePct?: number; color: string; icon: string; delay: number; }

function MetricCard({ platform, label, value, changePct, color, icon, delay }: MetricCardProps) {
  const [visible, setVisible] = useState(false);
  const countUp = useCountUp(value, 1500, visible);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div className={`bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{platform}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>{fmt(visible ? countUp : 0)}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
      {changePct != null && (
        <div className={`text-[10px] mt-1 ${changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {changePct >= 0 ? '↗' : '↘'} {Math.abs(changePct)}%
        </div>
      )}
    </div>
  );
}

export default function ArtistCardClient({ artist, initialData }: { artist: any; initialData: any }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  const profile = data?.profile || {};
  const metrics = data?.metrics || {};
  const cacheMsg = data?.cached ? data.message : null;

  // Build metric cards from data
  const cards: any[] = [];
  Object.entries(metrics).forEach(([platform, metricList]: [string, any]) => {
    const meta = platformMeta[platform] || { label: platform, color: '#6B7280', icon: '📊' };
    (metricList || []).forEach((m: any, i: number) => {
      cards.push({
        platform: meta.label,
        label: (m.metric_name || '').replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        value: m.value || 0,
        changePct: m.change_pct,
        color: meta.color,
        icon: meta.icon,
        delay: 100 + (Object.keys(metrics).indexOf(platform) * 150) + (i * 80),
      });
    });
  });

  const totalFollowers = cards.reduce((sum, c) => sum + c.value, 0);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/artist/${artist.slug}/refresh`);
      const fresh = await res.json();
      if (!fresh.error) {
        setData(fresh);
        setRefreshed(true);
        setTimeout(() => setRefreshed(false), 3000);
      }
    } catch {}
    setRefreshing(false);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Hero */}
      <div className="relative border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="max-w-4xl mx-auto px-6 py-12 text-center relative">
          {profile?.spotify_image_url && (
            <img src={profile.spotify_image_url} alt={artist.artist_name}
              className="w-28 h-28 rounded-full mx-auto object-cover border-2 border-white/10 shadow-xl mb-4" />
          )}
          <h1 className="text-3xl font-bold">{artist.artist_name}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {cards.length > 0
              ? `${cards.length} metrics across ${Object.keys(metrics).length} platforms`
              : 'Loading metrics...'}
            {profile?.last_refreshed_at && ` · Updated ${new Date(profile.last_refreshed_at).toLocaleString()}`}
          </p>
          {cacheMsg && <p className="text-xs text-amber-400/60 mt-1">{cacheMsg}</p>}

          {totalFollowers > 0 && (
            <div className="text-5xl font-bold text-primary mt-4">
              {useCountUp(totalFollowers, 2000).toLocaleString()}
              <span className="text-base text-muted-foreground ml-2 font-normal">total followers</span>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`mt-4 px-5 py-2 rounded-xl text-sm font-medium transition-all ${
              refreshed ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
              'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
            } disabled:opacity-40`}
          >
            {refreshing ? '⏳ Refreshing...' : refreshed ? '✅ Refreshed' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {cards.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cards.map((card, i) => <MetricCard key={`${card.platform}-${card.label}-${i}`} {...card} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg mb-2">No metrics yet</p>
            <p className="text-sm">Click &quot;Refresh Data&quot; to fetch live stats from Spotify &amp; Deezer</p>
          </div>
        )}
      </div>

      {/* Campaign CTA */}
      {artist.campaign_slug && (
        <div className="text-center pb-12">
          <a href={`/c/${artist.campaign_slug}?utm_source=artist_card`}
            className="inline-block px-6 py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
            🎵 Promote &quot;{artist.latest_track_name || 'your music'}&quot; — earn per view
          </a>
        </div>
      )}

      <div className="text-center pb-8 border-t border-white/[0.04] pt-6">
        <p className="text-xs text-muted-foreground">
          Powered by <a href="/" className="text-primary/60 hover:text-primary">Selah.fm</a> · Free artist dashboard · Refresh anytime
        </p>
      </div>
    </div>
  );
}
