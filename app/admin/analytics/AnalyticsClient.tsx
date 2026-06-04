'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  total: number;
  days: number;
  top_pages: { path: string; views: number }[];
  top_blogs: { path: string; views: number }[];
  utm_sources: { source: string; views: number }[];
  utm_mediums: { medium: string; views: number }[];
  utm_campaigns: { utm_campaign: string; views: number }[];
  hourly: { hour: string; views: number }[];
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [userFlows, setUserFlows] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/pageview?days=${days}&limit=20`)
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
    fetch("/api/admin/user-flows?limit=10")
      .then(r => r.json())
      .then(d => setUserFlows(d.sessions || []))
      .catch(e => console.error('Async error in admin/analytics/AnalyticsClient.tsx:', e));
  }, [days]);

  if (loading) return <div className="p-8 text-muted-foreground">Loading analytics...</div>;
  if (!data) return <div className="p-8 text-red-500">Failed to load analytics</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time page view tracking</p>
        </div>
        <div className="flex gap-2">
          {[1, 7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                days === d
                  ? 'bg-primary/20 text-primary'
                  : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <div className="text-3xl font-bold">{data.total.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">Total pageviews ({data.days}d)</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <div className="text-3xl font-bold">{data.top_pages.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Unique pages visited</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <div className="text-3xl font-bold">{data.top_blogs.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Blog posts with traffic</div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top Pages */}
        <section className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Top Pages</h2>
          <div className="space-y-1.5">
            {data.top_pages.slice(0, 15).map((p, i) => (
              <div key={p.path} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.02] last:border-0">
                <span className="flex items-center gap-2 truncate">
                  <span className="text-muted-foreground w-5 text-right tabular-nums">{i + 1}</span>
                  <a href={p.path} target="_blank" className="text-muted-foreground/80 hover:text-primary truncate max-w-[300px]">
                    {p.path}
                  </a>
                </span>
                <span className="font-mono text-muted-foreground tabular-nums">{p.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Top Blog Posts */}
        <section className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Top Blog Posts</h2>
          <div className="space-y-1.5">
            {data.top_blogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No blog traffic yet</p>
            ) : (
              data.top_blogs.slice(0, 15).map((b, i) => (
                <div key={b.path} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.02] last:border-0">
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-muted-foreground w-5 text-right tabular-nums">{i + 1}</span>
                    <a href={b.path} target="_blank" className="text-muted-foreground/80 hover:text-primary truncate max-w-[300px]">
                      {b.path.replace('/blog/', '')}
                    </a>
                  </span>
                  <span className="font-mono text-muted-foreground tabular-nums">{b.views.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* UTM Attribution */}
      <div className="grid grid-cols-3 gap-4">
        {/* Sources */}
        <section className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">UTM Sources</h2>
          <div className="space-y-1.5">
            {data.utm_sources.map(s => (
              <div key={s.source} className="flex justify-between text-xs py-1 border-b border-white/[0.02] last:border-0">
                <span className="text-muted-foreground/80 truncate">{s.source}</span>
                <span className="font-mono text-muted-foreground tabular-nums">{s.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Mediums */}
        <section className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">UTM Mediums</h2>
          <div className="space-y-1.5">
            {data.utm_mediums.map(m => (
              <div key={m.medium} className="flex justify-between text-xs py-1 border-b border-white/[0.02] last:border-0">
                <span className="text-muted-foreground/80 truncate">{m.medium}</span>
                <span className="font-mono text-muted-foreground tabular-nums">{m.views.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Campaigns */}
        <section className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">UTM Campaigns</h2>
          <div className="space-y-1.5">
            {data.utm_campaigns.length === 0 ? (
              <p className="text-xs text-muted-foreground">No UTM campaigns tracked yet</p>
            ) : (
              data.utm_campaigns.map(c => (
                <div key={c.utm_campaign} className="flex justify-between text-xs py-1 border-b border-white/[0.02] last:border-0">
                  <span className="text-muted-foreground/80 truncate">{c.utm_campaign}</span>
                  <span className="font-mono text-muted-foreground tabular-nums">{c.views.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Hourly trend (last 48h) */}
      <section className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-3">Hourly Traffic (last 48h)</h2>
        <div className="h-32 flex items-end gap-0.5">
          {data.hourly.slice(0, 48).reverse().map((h, i) => {
            const maxViews = Math.max(...data.hourly.map(x => x.views), 1);
            const height = Math.max((h.views / maxViews) * 100, 2);
            return (
              <div
                key={i}
                className="flex-1 bg-primary/40 hover:bg-primary/60 transition-colors rounded-t-sm"
                style={{ height: `${height}%` }}
                title={`${new Date(h.hour).toLocaleString()}: ${h.views} views`}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground/40">
          <span>48h ago</span>
          <span>Now</span>
        </div>
      </section>

      {/* ════════════════════════════════════════ */}
      {/* USER FLOWS — Session tracking           */}
      {/* ════════════════════════════════════════ */}
      <section className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">User Flows (Recent Sessions)</h2>
          <button
            onClick={() => {
              fetch("/api/admin/user-flows?limit=10")
                .then(r => r.json())
                .then(d => setUserFlows(d.sessions || []))
                .catch(e => console.error('Async error in admin/analytics/AnalyticsClient.tsx:', e));
            }}
            className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            Refresh
          </button>
        </div>

        {userFlows.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 text-center py-8">
            No session data yet. Sessions appear after visitors browse multiple pages.
          </p>
        ) : (
          <div className="space-y-4">
            {userFlows.map((session: any) => (
              <div key={session.session_id} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-3">
                {/* Session header */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="font-mono">{session.session_id.slice(0, 12)}...</span>
                  <span>{new Date(session.session_start).toLocaleString()}</span>
                </div>

                {/* Referrer / UTM */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {session.referrer && (
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground/70">
                      From: {new URL(session.referrer).hostname || session.referrer}
                    </span>
                  )}
                  {session.utm_source && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300">
                      UTM: {session.utm_source}
                    </span>
                  )}
                  {session.signed_up > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">
                      🎉 Signed up!
                    </span>
                  )}
                  {session.joined_campaign > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300">
                      Joined campaign
                    </span>
                  )}
                </div>

                {/* Event timeline */}
                <div className="space-y-1">
                  {(session.timeline || []).map((event: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[10px]">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/10 shrink-0" />
                      <span className="text-muted-foreground/50 w-12 shrink-0 tabular-nums">
                        {new Date(event.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className={`font-medium ${
                        event.event === "page_view" ? "text-muted-foreground" :
                        event.event === "signup_complete" ? "text-emerald-400" :
                        event.event === "campaign_join_click" ? "text-indigo-400" :
                        event.event === "cta_click" ? "text-amber-400" : "text-muted-foreground"
                      }`}>
                        {event.event.replace(/_/g, " ")}
                      </span>
                      <span className="text-muted-foreground/40 truncate max-w-[200px]">{event.path}</span>
                      {event.metadata?.cta && <span className="text-muted-foreground/30">({event.metadata.cta})</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
