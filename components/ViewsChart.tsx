'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { ChartBar, TrendingUp, Calendar, Download } from 'lucide-react';

interface ViewsChartProps {
  campaigns: any[];
  isArtist: boolean;
  totalViews: number;
  totalSubmissions: number;
  totalApproved: number;
  totalSpent: number;
}

export default function DashboardChart({
  campaigns,
  isArtist,
  totalViews,
  totalSubmissions,
  totalApproved,
  totalSpent,
}: ViewsChartProps) {
  const [range, setRange] = useState<7 | 30 | 90>(7);

  // Compute weekly views
  const weeklyData = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];
    const now = new Date();
    const weeks: { label: string; views: number; submissions: number }[] = [];

    for (let w = 0; w < 12; w++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - w * 7);

      let views = 0, subs = 0;
      for (const c of campaigns) {
        const cDate = new Date(c.created_at || c.createdAt || now);
        if (cDate >= weekStart && cDate < weekEnd) {
          views += parseInt(c.total_verified_views || c.views || '0');
          subs += parseInt(c.approved_submissions || '0');
        }
      }

      weeks.unshift({
        label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views,
        submissions: subs,
      });
    }
    return weeks;
  }, [campaigns]);

  const visibleWeeks = useMemo(() => {
    const count = range === 7 ? 4 : range === 30 ? 8 : 12;
    return weeklyData.slice(-count);
  }, [weeklyData, range]);

  const hasData = totalSubmissions > 0 || totalViews > 0;
  const approvalRate = totalSubmissions > 0 ? Math.round((totalApproved / totalSubmissions) * 100) : 0;
  const approvalColor = approvalRate >= 70 ? '#22C55E' : approvalRate >= 40 ? '#F59E0B' : '#EF4444';

  // Funnel data
  const funnelData = [
    { name: 'Submitted', value: totalSubmissions, color: '#F59E0B' },
    { name: 'Approved', value: totalApproved, color: '#22C55E' },
    { name: 'Paid', value: Math.min(totalApproved, Math.round(totalSpent / 1000)), color: '#3B82F6' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="rounded-xl bg-[#0B0B1E]/95 backdrop-blur-xl border border-white/[0.08] px-3 py-2 shadow-xl">
          <p className="text-[10px] text-muted-foreground/60">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} className="text-xs font-semibold" style={{ color: p.color || p.stroke }}>
              {p.name}: {p.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isArtist) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      {/* Views chart */}
      <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-5 relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ChartBar size={14} className="text-indigo-400" />
            Views over time
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5">
              {([7, 30, 90] as const).map(d => (
                <button key={d}
                  onClick={() => setRange(d)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                    range === d
                      ? 'bg-primary/20 text-primary shadow-sm'
                      : 'text-muted-foreground/50 hover:text-muted-foreground'
                  }`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {!hasData ? (
          <div className="text-center py-12 text-sm text-muted-foreground/50">
            <ChartBar size={32} className="mx-auto mb-3 text-muted-foreground/20" />
            No view data yet. Create a campaign to see trends.
          </div>
        ) : (
          <div className="relative z-10">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={visibleWeeks} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818CF8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#818CF8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#666' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#666' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#818CF8"
                  strokeWidth={2}
                  fill="url(#viewsGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#818CF8', stroke: '#0F0F23', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Summary strip */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/[0.04]">
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-400">{totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews}</p>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Total views</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: approvalColor }}>{approvalRate}%</p>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Approval rate</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">{totalSubmissions}</p>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Submissions</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Funnel + Submission columns */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Submission Funnel */}
        {hasData && (
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-5 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 relative z-10">
              <TrendingUp size={14} className="text-emerald-400" />
              Submission funnel
            </h3>
            <div className="relative z-10 space-y-3">
              {funnelData.map((stage, i) => {
                const pct = Math.min(Math.round((stage.value / (totalSubmissions || 1)) * 100), 100);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{stage.name}</span>
                      <span className="font-mono text-muted-foreground/70">{stage.value.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + i * 0.15 }}
                        className="h-full rounded-full transition-all"
                        style={{ backgroundColor: stage.color, opacity: 0.6 }}
                      />
                    </div>
                    <p className="text-[9px] text-right text-muted-foreground/40">{pct}% of submitted</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Track performance list */}
        {campaigns.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-5 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 relative z-10">
              <Calendar size={14} className="text-amber-400" />
              Track performance
            </h3>
            <div className="relative z-10 space-y-2 max-h-[240px] overflow-y-auto scrollbar-thin">
              {campaigns.slice(0, 5).map((c: any, i: number) => {
                const views = parseInt(c.total_verified_views || c.views || '0');
                const subs = parseInt(c.approved_submissions || '0');
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer"
                    onClick={() => {
                      const trackSlug = (c.track_title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'track';
                      window.location.href = c.artist_slug ? `/artist/${c.artist_slug}/tracks/${trackSlug}` : `/c/${c.slug || c.id}`;
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{c.track_title}</p>
                      <p className="text-[9px] text-muted-foreground/50">{subs} subs · {views.toLocaleString()} views</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs font-bold text-emerald-400">${((c.cpm_rate_cents || 0) / 100).toFixed(2)}</p>
                      <p className="text-[9px] text-muted-foreground/50">CPM</p>
                    </div>
                  </motion.div>
                );
              })}
              {campaigns.length > 5 && (
                <p className="text-[10px] text-center text-muted-foreground/40 pt-1">+{campaigns.length - 5} more tracks</p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
