'use client';

import { useEffect, useState } from 'react';

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const startTime = performance.now();
    let raf: number;
    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      setValue(Math.floor((1 - Math.pow(2, -10 * progress)) * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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

function MetricCard({ platform, label, value, color }: { platform: string; label: string; value: number; color: string }) {
  const countUp = useCountUp(value, 1500);
  return (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{platform}</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>{fmt(countUp)}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

interface StatsData {
  profile: { total_followers?: number; total_streams?: number };
  metrics: Record<string, { metric_name: string; value: number }[]>;
}

/**
 * Streaming stats grid — shows per-platform data from artist_metrics.
 * Only renders when metrics data is available.
 */
export default function ArtistStreamingStats({ data }: { data: StatsData | null }) {
  if (!data) return null;

  const metrics = data.metrics || {};
  const cards: { platform: string; label: string; value: number; color: string }[] = [];

  Object.entries(metrics).forEach(([platform, metricList]: [string, any]) => {
    const meta = platformMeta[platform] || { label: platform, color: '#6B7280' };
    const list = Array.isArray(metricList) ? metricList : [];
    const seen = new Set<string>();
    for (const m of [...list].sort((a: any, b: any) => (b.value || 0) - (a.value || 0))) {
      if (!seen.has(m.metric_name)) {
        seen.add(m.metric_name);
        cards.push({
          platform: meta.label,
          label: m.metric_name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
          value: m.value || 0,
          color: meta.color,
        });
      }
    }
  });

  if (cards.length === 0) return null;

  return (
    <section>
      <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <span className="text-muted-foreground">📊</span>
        Streaming stats
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {cards.map((card, i) => (
          <MetricCard key={`${card.platform}-${card.label}`} {...card} />
        ))}
      </div>
    </section>
  );
}
