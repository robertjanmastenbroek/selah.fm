'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Search, TrendingUp, DollarSign, Music, Star, Flame, Medal, Zap, User, BarChart3, ChevronRight } from 'lucide-react';
import Header from '@/components/TopNav';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  profile_image_url: string;
  total_earnings_cents: number;
  total_views: number;
  submission_count: number;
  track_name: string;
  artist_name: string;
  best_streak: number;
}

type Period = 'all' | 'month' | 'week';

export default function EarningsPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<Period>('all');
  const [myRank, setMyRank] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');
  const [stats, setStats] = useState({ total_paid_cents: 0, total_views: 0, unique_creators: 0 });

  // Auth
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.user) setMe(d.user); })
      .catch(() => {});
  }, []);

  // Load leaderboard
  useEffect(() => {
    setLoading(true);
    fetch(`/api/earnings/leaderboard?period=${period}&limit=100`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setEntries(d.entries || []);
        if (d.stats) setStats(d.stats);
        if (d.myRank) setMyRank(d.myRank);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const filtered = search
    ? entries.filter(e => e.display_name?.toLowerCase().includes(search.toLowerCase()))
    : entries;

  const formatDollars = (cents: number) => {
    const dollars = cents / 100;
    if (dollars >= 1000000) return `$${(dollars / 1000000).toFixed(1)}M`;
    if (dollars >= 10000) return `$${(dollars / 1000).toFixed(1)}K`;
    return `$${dollars.toFixed(2)}`;
  };

  const formatViews = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
    return v.toString();
  };

  // Achievements for top creators
  const getAchievements = (entry: LeaderboardEntry) => {
    const badges: { label: string; icon: string; color: string }[] = [];
    if (entry.rank === 1) badges.push({ label: '#1', icon: '👑', color: 'text-amber-400' });
    if (entry.total_earnings_cents >= 100000) badges.push({ label: '100K', icon: '💎', color: 'text-blue-400' });
    if (entry.total_earnings_cents >= 10000) badges.push({ label: '10K', icon: '⭐', color: 'text-amber-400' });
    if (entry.total_views >= 100000) badges.push({ label: '100K Views', icon: '👁️', color: 'text-emerald-400' });
    if (entry.best_streak >= 3) badges.push({ label: `${entry.best_streak} streak`, icon: '🔥', color: 'text-orange-400' });
    if (entry.submission_count >= 10) badges.push({ label: 'Veteran', icon: '🎖️', color: 'text-purple-400' });
    return badges.slice(0, 3);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ════════════════ HERO ════════════════ */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 flex items-center justify-center mx-auto mb-4 border border-amber-400/10">
            <Trophy size={32} className="text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
            Creator Leaderboard
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Top creators ranked by verified view earnings. Submit videos, earn per view, and climb the ranks.
          </p>
        </motion.div>

        {/* ════════════════ PERIOD TABS ════════════════ */}
        <div className="flex items-center justify-center gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 max-w-xs mx-auto">
          {[
            { id: 'all' as Period, label: 'All Time' },
            { id: 'month' as Period, label: 'This Month' },
            { id: 'week' as Period, label: 'This Week' },
          ].map(p => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                period === p.id ? 'bg-primary/20 text-primary shadow-sm' : 'text-muted-foreground/60 hover:text-foreground'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* ════════════════ YOUR RANK ════════════════ */}
        {me && myRank && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-500/[0.06] to-orange-500/[0.03] border border-amber-500/15 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/[0.04] rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                  myRank.rank === 1 ? 'bg-amber-400/20 text-amber-400' :
                  myRank.rank <= 3 ? 'bg-gray-400/20 text-gray-400' :
                  myRank.rank <= 10 ? 'bg-orange-500/20 text-orange-500' :
                  'bg-white/[0.06] text-muted-foreground'
                }`}>
                  #{myRank.rank}
                </div>
                <div>
                  <p className="text-sm font-semibold">You're #{myRank.rank} of {myRank.total_creators} creators</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDollars(myRank.total_earnings_cents)} earned · {formatViews(myRank.total_views)} views
                  </p>
                </div>
              </div>
              {myRank.rank <= 3 && (
                <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                  <Medal size={16} />
                  Podium
                </div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {me?.stripe_connect_id ? '✅ Payouts set up' : 'Set up payouts to receive earnings'}
              </p>
              {!me?.stripe_connect_id && (
                <button onClick={async () => {
                  setStripeLoading(true); setStripeError('');
                  try {
                    const res = await fetch('/api/stripe/connect', { method: 'POST', credentials: 'include' });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                    else setStripeError(data.error || 'Failed');
                  } catch { setStripeError('Network error'); }
                  setStripeLoading(false);
                }}
                  className="text-[10px] px-3 py-1.5 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-all disabled:opacity-40"
                  disabled={stripeLoading}>
                  {stripeLoading ? 'Connecting...' : 'Set up payouts'}
                </button>
              )}
              {stripeError && <p className="text-[10px] text-red-400">{stripeError}</p>}
            </div>
          </motion.div>
        )}

        {/* ════════════════ STATS OVERVIEW ════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total Paid', value: stats.total_paid_cents > 0 ? formatDollars(stats.total_paid_cents) : '$0', icon: DollarSign, color: 'text-emerald-400' },
            { label: 'Total Views', value: stats.total_views > 0 ? formatViews(stats.total_views) : '0', icon: TrendingUp, color: 'text-blue-400' },
            { label: 'Creators', value: stats.unique_creators > 0 ? stats.unique_creators.toString() : (entries.length ? entries.length.toString() : '0'), icon: User, color: 'text-indigo-400' },
            { label: 'Top Earner', value: entries[0] ? formatDollars(entries[0].total_earnings_cents) : '$0', icon: Star, color: 'text-amber-400' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                <Icon size={16} className={`mx-auto mb-2 ${stat.color}`} />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* ════════════════ SEARCH ════════════════ */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search creators by name..."
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none" />
        </div>

        {/* ════════════════ LEADERBOARD ════════════════ */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="animate-pulse rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-white/[0.06]" />
                <div className="w-10 h-10 rounded-full bg-white/[0.04]" />
                <div className="flex-1"><div className="h-3 w-32 bg-white/[0.04] rounded mb-2" /><div className="h-2 w-48 bg-white/[0.02] rounded" /></div>
                <div className="h-4 w-16 bg-white/[0.04] rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Trophy size={48} className="mx-auto mb-4 text-muted-foreground/10" />
            <p className="text-sm text-muted-foreground mb-2">
              {search ? 'No creators match your search' : 'No earnings yet — be the first!'}
            </p>
            {!search && (
              <div className="mt-4">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 text-left max-w-md mx-auto mb-4">
                  <h3 className="text-sm font-semibold mb-2">How to get on the leaderboard</h3>
                  <ol className="text-xs text-muted-foreground space-y-2">
                    <li><span className="text-emerald-400 font-bold">1.</span> Browse tracks with active budgets</li>
                    <li><span className="text-emerald-400 font-bold">2.</span> Create a short video featuring the track</li>
                    <li><span className="text-emerald-400 font-bold">3.</span> Submit for verification</li>
                    <li><span className="text-emerald-400 font-bold">4.</span> Earn per 1,000 verified views</li>
                    <li><span className="text-emerald-400 font-bold">5.</span> Climb the leaderboard!</li>
                  </ol>
                </div>
                <Link href="/browse" className="inline-block px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  Browse Tracks →
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.slice(0, 100).map((entry, i) => {
                const rank = entry.rank || i + 1;
                const isTop3 = rank <= 3;
                const badges = getAchievements(entry);
                const meOnBoard = me && entry.user_id === me.id;

                return (
                  <motion.div
                    key={entry.user_id + period}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.02, type: 'spring', stiffness: 400, damping: 30 }}
                    className={`rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-white/[0.03] ${
                      meOnBoard ? 'bg-primary/[0.04] border border-primary/20' :
                      isTop3 ? 'bg-gradient-to-r from-amber-500/[0.04] to-transparent border border-amber-500/10' : 'border border-white/[0.06]'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      rank === 1 ? 'bg-amber-400/20 text-amber-400 shadow-sm shadow-amber-500/20' :
                      rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                      rank === 3 ? 'bg-orange-600/20 text-orange-600' :
                      'bg-white/[0.04] text-muted-foreground'
                    }`}>
                      {rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-white/[0.04]">
                      {entry.profile_image_url ? (
                        <img src={entry.profile_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">
                          {entry.display_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>

                    {/* Info + badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">
                          {entry.display_name || 'Anonymous Creator'}
                          {meOnBoard && <span className="ml-1.5 text-[9px] text-primary font-medium">(you)</span>}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {badges.map((b, bi) => (
                            <span key={bi} className={`text-[9px] ${b.color}`} title={b.label}>
                              {b.icon}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 mt-0.5 flex-wrap">
                        {entry.artist_name && <span className="truncate max-w-[120px]">{entry.artist_name}</span>}
                        {entry.track_name && <span className="hidden sm:inline truncate">· "{entry.track_name}"</span>}
                        <span>· {entry.submission_count} video{entry.submission_count !== 1 ? 's' : ''}</span>
                        {entry.best_streak >= 2 && (
                          <span className="flex items-center gap-0.5 text-orange-400/80">
                            <Flame size={10} /> {entry.best_streak} day streak
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Earnings */}
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-bold ${isTop3 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                        {formatDollars(entry.total_earnings_cents)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/40">{formatViews(entry.total_views)} views</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length > 100 && (
              <p className="text-xs text-center text-muted-foreground/40 pt-2">Showing top 100 — search for specific creators</p>
            )}
          </div>
        )}

        {/* ════════════════ FOOTER ════════════════ */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
            <Link href="/browse" className="text-primary hover:underline">Browse tracks</Link>
            <span>·</span>
            <Link href="/tools/creator-earnings" className="text-primary hover:underline">Earnings calculator</Link>
            <span>·</span>
            <Link href="/welcome-creators" className="text-primary hover:underline">How it works</Link>
          </div>
          <p className="text-[10px] text-muted-foreground/40">
            Leaderboard updates in real-time. Creators earn $0.10–$5.00 CPM depending on the track budget.
          </p>
        </div>
      </div>
    </div>
  );
}
