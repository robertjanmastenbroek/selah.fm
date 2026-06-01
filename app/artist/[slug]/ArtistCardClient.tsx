'use client';

import { useEffect, useState, useRef } from 'react';

function useCountUp(target: number, duration = 1500, startOnMount = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startOnMount) return;
    let start = 0;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  return value;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

interface MetricCardProps {
  platform: string;
  label: string;
  value: number;
  changePct?: number;
  color: string;
  icon: string;
  delay: number;
}

function MetricCard({ platform, label, value, changePct, color, icon, delay }: MetricCardProps) {
  const [visible, setVisible] = useState(false);
  const countUp = useCountUp(value, 1500, visible);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{platform}</span>
      </div>
      <div className="text-xl font-bold tabular-nums" style={{ color }}>
        {visible ? formatNumber(countUp) : '0'}
      </div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {changePct !== undefined && changePct !== null && (
        <div className={`text-[10px] mt-0.5 ${changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {changePct >= 0 ? '↗' : '↘'} {Math.abs(changePct)}%
        </div>
      )}
    </div>
  );
}

export default function ArtistCardClient({ artist, profile, metrics }: { artist: any; profile: any; metrics: Record<string, any[]> }) {
  const platformColors: Record<string, string> = {
    spotify: '#1DB954', deezer: '#A238FF', youtube: '#FF0000',
    soundcloud: '#FF5500', instagram: '#E4405F', tiktok: '#000000',
    facebook: '#1877F2', twitter: '#1DA1F2',
  };

  const platformIcons: Record<string, string> = {
    spotify: '🟢', deezer: '🟣', youtube: '🔴', soundcloud: '🟠',
    instagram: '📷', tiktok: '🎵', facebook: '📘', twitter: '🐦',
  };

  const cards = Object.entries(metrics).flatMap(([platform, metricList]) =>
    metricList.map((m: any, i: number) => ({
      platform,
      label: m.metric_name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      value: m.value,
      changePct: m.change_pct,
      color: platformColors[platform] || '#6B7280',
      icon: platformIcons[platform] || '📊',
      delay: (Object.keys(metrics).indexOf(platform) * 200) + (i * 100),
    }))
  );

  const totalFollowers = cards.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Hero */}
      <div className="text-center space-y-3">
        {profile?.spotify_image_url && (
          <img
            src={profile.spotify_image_url}
            alt={artist.artist_name}
            className="w-24 h-24 rounded-full mx-auto object-cover border-2 border-white/10 shadow-lg"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">{artist.artist_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {cards.length > 0 ? `${cards.length} metrics across ${Object.keys(metrics).length} platforms` : 'No metrics yet'}
            {profile?.last_refreshed_at && ` · Updated ${new Date(profile.last_refreshed_at).toLocaleDateString()}`}
          </p>
        </div>
        {totalFollowers > 0 && (
          <div className="text-4xl font-bold text-primary">
            {useCountUp(totalFollowers, 2000, true).toLocaleString()}
            <span className="text-sm text-muted-foreground ml-2 font-normal">total followers</span>
          </div>
        )}
      </div>

      {/* Metric cards */}
      {cards.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map((card, i) => (
            <MetricCard key={`${card.platform}-${card.label}`} {...card} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No metrics collected yet.</p>
          <p className="text-xs mt-1">Data refreshes daily. Check back soon.</p>
        </div>
      )}

      {/* Campaign CTA */}
      {artist.campaign_slug && (
        <div className="text-center pt-4">
          <a
            href={`/c/${artist.campaign_slug}?utm_source=artist_card`}
            className="inline-block px-6 py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            🎵 Promote &quot;{artist.latest_track_name || 'your music'}&quot; — earn per view
          </a>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-4 border-t border-white/[0.04]">
        <p className="text-xs text-muted-foreground">
          Powered by <a href="/" className="text-primary/60 hover:text-primary">Selah.fm</a> — Free artist dashboard · Updated daily
        </p>
      </div>
    </div>
  );
}
