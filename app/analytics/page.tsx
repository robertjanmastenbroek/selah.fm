'use client';

import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TikTok, Instagram, YouTube } from '@/components/SocialIcons';
import { Sparkles, TrendingUp, Eye, DollarSign, Send, ExternalLink } from 'lucide-react';

interface PlatformData {
  platform: string;
  total_submissions: number;
  total_views: number;
  total_earned_cents: number;
  approved: number;
  pending: number;
  rejected: number;
}

interface LifetimeData {
  total_submissions: number;
  total_views: number;
  total_paid_cents: number;
  total_earned_cents: number;
}

interface RecentSubmission {
  id: string;
  platform: string;
  content_url: string;
  views_verified: number;
  payout_amount_cents: number;
  review_status: string;
  payout_status: string;
  submitted_at: string;
  track_title: string;
  cover_art_url: string;
}

interface MonthlyData {
  month: string;
  submissions: number;
  views: number;
  earned_cents: number;
}

interface AnalyticsData {
  byPlatform: PlatformData[];
  lifetime: LifetimeData;
  recent: RecentSubmission[];
  monthly: MonthlyData[];
  connections: Record<string, boolean>;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function formatMoney(cents: number): string {
  return '$' + (cents / 100).toFixed(2);
}

function platformIcon(platform: string) {
  switch (platform) {
    case 'tiktok': return <TikTok size={16} />;
    case 'instagram': return <Instagram size={16} />;
    case 'youtube': return <YouTube size={16} />;
    default: return null;
  }
}

function platformColor(platform: string): string {
  switch (platform) {
    case 'tiktok': return '#ff0050';
    case 'instagram': return '#E1306C';
    case 'youtube': return '#FF0000';
    default: return '#5B7FFF';
  }
}

function statusBadge(status: string, payoutStatus?: string) {
  if (payoutStatus === 'paid') return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Paid</Badge>;
  if (status === 'approved') return <Badge className="text-[10px] bg-success/10 text-success border-success/20">Approved</Badge>;
  if (status === 'rejected') return <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
  return <Badge variant="secondary" className="text-[10px]">Pending</Badge>;
}

// ── Chart: simple horizontal bar ──────────────────────────────────────────
function BarChart({ data, maxValue, color }: { data: { label: string; value: number }[]; maxValue: number; color: string }) {
  return (
    <div className="space-y-2">
      {data.map(d => {
        const pct = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
        return (
          <div key={d.label} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 shrink-0 text-right">{d.label}</span>
            <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-12 shrink-0">{d.value.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, error, isLoading } = useSWR('/api/analytics', fetcher, swrConfig);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="section-title">Analytics</h1>
            <Sparkles size={20} className="text-primary" />
          </div>
          <p className="text-muted-foreground text-sm mb-8">Track your content performance and earnings across platforms.</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-16 mx-auto mb-2" /><Skeleton className="h-8 w-20 mx-auto" /></CardContent></Card>)}
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <Card className="text-center py-16">
            <CardContent>
              <p className="text-4xl mb-4 opacity-10">📊</p>
              <h2 className="text-lg font-medium mb-2">Couldn't load analytics</h2>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── Lifetime summary ────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { label: 'Total views', value: formatViews(data!.lifetime.total_views), sub: 'Across all platforms', icon: Eye },
                { label: 'Submissions', value: data!.lifetime.total_submissions.toLocaleString(), sub: 'Content submitted', icon: Send },
                { label: 'Earned', value: formatMoney(data!.lifetime.total_paid_cents), sub: 'Paid out', icon: DollarSign },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  >
                    <Card className="h-full">
                      <CardContent className="p-4 text-center">
                        <Icon size={16} className="mx-auto mb-2 text-muted-foreground/50" />
                        <div className="text-xl font-bold mb-0.5">{s.value}</div>
                        <div className="text-[11px] font-medium">{s.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* ── Platform breakdown ───────────────────────────── */}
            {data!.byPlatform.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-sm mb-1 flex items-center gap-2">
                      <TrendingUp size={16} className="text-primary/60" />
                      Performance by platform
                    </h2>
                    <p className="text-xs text-muted-foreground mb-6">Total verified views per platform</p>
                    <BarChart
                      data={data!.byPlatform.map((p: any) => ({ label: p.platform, value: p.total_views }))}
                      maxValue={Math.max(...data!.byPlatform.map((p: any) => p.total_views))}
                      color="linear-gradient(90deg, #5B7FFF, #8B9FFF)"
                    />
                    <div className="mt-6 grid grid-cols-3 gap-3">
                      {data!.byPlatform.map((p: any) => (
                        <div key={p.platform} className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <div className="flex items-center justify-center gap-1.5 mb-1" style={{ color: platformColor(p.platform) }}>
                            {platformIcon(p.platform)}
                            <span className="text-xs font-medium capitalize">{p.platform}</span>
                          </div>
                          <div className="text-sm font-bold">{formatMoney(p.total_earned_cents)}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {p.approved} approved · {p.pending} pending
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── Monthly trend ────────────────────────────────── */}
            {data!.monthly.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-sm mb-1">Monthly earnings</h2>
                    <p className="text-xs text-muted-foreground mb-6">Last 6 months</p>
                    <BarChart
                      data={data!.monthly.map((m: any) => ({
                        label: m.month.slice(5),
                        value: m.earned_cents,
                      }))}
                      maxValue={Math.max(...data!.monthly.map((m: any) => m.earned_cents), 1)}
                      color="linear-gradient(90deg, #81C784, #A5D6A7)"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ── Recent submissions ────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-semibold text-sm mb-4">Recent submissions</h2>
                  {data!.recent.length === 0 ? (
                    <div className="text-center py-8">
                      <Send size={28} className="mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No submissions yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">Browse campaigns to start creating content.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data!.recent.map((s: any, i: number) => (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + i * 0.04, duration: 0.3 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-primary/10 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: platformColor(s.platform) + '15', color: platformColor(s.platform) }}>
                              {platformIcon(s.platform)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{s.track_title}</p>
                              <p className="text-xs text-muted-foreground">
                                {(s.views_verified || 0).toLocaleString()} views · {new Date(s.submitted_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-semibold">{formatMoney(s.payout_amount_cents || 0)}</span>
                            {statusBadge(s.review_status, s.payout_status)}
                            {s.content_url && (
                              <a href={s.content_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* ── Empty state when zero data ─────────────────────── */}
            {data!.lifetime.total_submissions === 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="text-center mt-6">
                  <CardContent className="p-8">
                    <img src="/images/empty-analytics.png" alt="No data yet" className="mx-auto mb-4 w-36 h-36 object-contain opacity-80" loading="lazy" />
                    <h3 className="font-medium text-sm mb-2">No analytics yet</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Once you start submitting content and earning, your performance data will appear here.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
