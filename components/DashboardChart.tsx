'use client';

import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

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

  // Compute weekly views from campaign data
  const weeklyData = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];

    // Collect all dates from campaigns (using created_at as proxy)
    const now = new Date();
    const weeks: { label: string; views: number }[] = [];

    for (let w = 0; w < 12; w++) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - w * 7);

      const viewsInWeek = campaigns.reduce((sum: number, c: any) => {
        const cDate = new Date(c.created_at || c.createdAt || now);
        if (cDate >= weekStart && cDate < weekEnd) {
          return sum + parseInt(c.total_verified_views || c.views || '0');
        }
        return sum;
      }, 0);

      weeks.unshift({
        label: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: viewsInWeek,
      });
    }

    return weeks;
  }, [campaigns]);

  // Filter by selected range
  const visibleWeeks = useMemo(() => {
    const count = range === 7 ? 4 : range === 30 ? 8 : 12;
    return weeklyData.slice(-count);
  }, [weeklyData, range]);

  const maxViews = Math.max(...visibleWeeks.map(w => w.views), 1);
  const hasData = totalSubmissions > 0 || totalViews > 0;
  const approvalRate = totalSubmissions > 0 ? Math.round((totalApproved / totalSubmissions) * 100) : 0;

  if (!isArtist) return null;

  return (
    <div className="space-y-4">
      {/* Views-over-time chart */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 size={14} className="text-primary" />
            Views over time
          </h3>
          <div className="flex gap-1">
            {([7, 30, 90] as const).map(d => (
              <button key={d}
                onClick={() => setRange(d)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  range === d
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/[0.04]'
                }`}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {!hasData ? (
          <div className="text-center py-8 text-xs text-muted-foreground/50">
            No view data yet. Create a campaign and get submissions to see trends.
          </div>
        ) : (
          <>
            {/* Bar chart */}
            <div className="flex items-end gap-1.5 h-24 mb-2">
              {visibleWeeks.map((w, i) => {
                const height = Math.max((w.views / maxViews) * 100, 2);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[9px] text-muted-foreground/40 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      {w.views}
                    </span>
                    <div
                      className="w-full rounded-t-sm bg-gradient-to-t from-indigo-500/60 to-indigo-400/40 hover:from-indigo-400 hover:to-indigo-300 transition-all cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${w.label}: ${w.views} views`}
                    />
                    <span className="text-[8px] text-muted-foreground/30 rotate-45 origin-left whitespace-nowrap">
                      {w.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary stats below chart */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-white/[0.04]">
              <div className="text-center">
                <p className="text-lg font-bold text-indigo-400">
                  {totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : totalViews}
                </p>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Total views</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold ${approvalRate >= 70 ? 'text-emerald-400' : approvalRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                  {approvalRate}%
                </p>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Approval rate</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-amber-400">{totalSubmissions}</p>
                <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider">Submissions</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Submission funnel — enhanced */}
      {hasData && (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            Submission funnel
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Submitted', value: totalSubmissions, color: 'bg-amber-400', max: totalSubmissions || 1 },
              { label: 'Reviewed', value: totalSubmissions, color: 'bg-indigo-400', max: totalSubmissions || 1 },
              { label: 'Approved', value: totalApproved, color: 'bg-emerald-400', max: totalSubmissions || 1 },
              { label: 'Paid', value: Math.min(totalApproved, Math.round(totalSpent / 1000)), color: 'bg-blue-400', max: totalSubmissions || 1 },
            ].map((stage, i) => {
              const pct = Math.min(Math.round((stage.value / stage.max) * 100), 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{stage.label}</span>
                    <span className="font-mono text-muted-foreground/70">{stage.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stage.color}/60 transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {totalSubmissions > 0 && (
            <p className="text-[10px] text-muted-foreground/40 mt-3 text-center">
              {Math.round((totalApproved / totalSubmissions) * 100)}% of submissions approved
            </p>
          )}
        </div>
      )}
    </div>
  );
}
