'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/TopNav';
import { motion } from 'framer-motion';
import { Trophy, Search, ChevronUp, TrendingUp, DollarSign, Music, Star } from 'lucide-react';

interface EarningsEntry {
  rank: number;
  user_id: string;
  display_name: string;
  total_earnings_cents: number;
  total_views: number;
  campaign_count: number;
  track_name: string;
  artist_name: string;
}

export default function EarningsPage() {
  const [entries, setEntries] = useState<EarningsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/earnings/leaderboard', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setEntries(d.entries || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? entries.filter(e => e.display_name?.toLowerCase().includes(search.toLowerCase()))
    : entries;

  const formatDollars = (cents: number) => {
    const dollars = cents / 100;
    if (dollars >= 1000000) return `$${(dollars / 1000000).toFixed(1)}M`;
    if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
    return `$${dollars.toFixed(0)}`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 flex items-center justify-center mx-auto mb-4 border border-amber-400/10">
            <Trophy size={32} className="text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
            Creator Earnings
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Top creators on Selah.fm ranked by verified view earnings. Make content, earn per view, climb the leaderboard.
          </p>
        </motion.div>

        {/* Stats overview */}
        {entries.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total paid out', value: formatDollars(entries.reduce((s, e) => s + e.total_earnings_cents, 0)), icon: DollarSign },
              { label: 'Total views', value: formatViews(entries.reduce((s, e) => s + e.total_views, 0)), icon: TrendingUp },
              { label: 'Active creators', value: entries.length.toString(), icon: Music },
              { label: 'Top earner', value: entries[0] ? formatDollars(entries[0].total_earnings_cents) : '$0', icon: Star },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                  <Icon size={16} className="mx-auto mb-2 text-primary/60" />
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{stat.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creators..."
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
          />
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="animate-pulse rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
                <div className="flex-1"><div className="h-3 w-32 bg-white/[0.04] rounded mb-2" /><div className="h-2 w-48 bg-white/[0.02] rounded" /></div>
                <div className="h-4 w-16 bg-white/[0.04] rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Trophy size={48} className="mx-auto mb-4 text-muted-foreground/10" />
            <p className="text-sm text-muted-foreground">
              {search ? 'No creators match your search' : 'No earnings data yet — be the first!'}
            </p>
            {!search && (
              <div className="mt-6 space-y-3">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-5 text-left max-w-md mx-auto">
                  <h3 className="text-sm font-semibold mb-2">How to earn</h3>
                  <ol className="text-xs text-muted-foreground space-y-2">
                    <li>1. Browse campaigns with active budgets</li>
                    <li>2. Pick tracks you want to feature</li>
                    <li>3. Create short videos (TikTok, Reels, Shorts)</li>
                    <li>4. Submit for verification</li>
                    <li>5. Earn per 1,000 verified views</li>
                  </ol>
                </div>
                <a href="/browse" className="inline-block px-6 py-3 rounded-xl bg-[#4338CA] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                  Browse Campaigns →
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 50).map((entry, i) => {
              const rank = entry.rank || i + 1;
              const isTop3 = rank <= 3;
              return (
                <motion.div
                  key={entry.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-white/[0.03] ${
                    isTop3 ? 'bg-gradient-to-r from-amber-500/[0.04] to-transparent border border-amber-500/10' : 'border border-white/[0.06]'
                  }`}
                >
                  {/* Rank badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    rank === 1 ? 'bg-amber-400/20 text-amber-400' :
                    rank === 2 ? 'bg-gray-400/20 text-gray-400' :
                    rank === 3 ? 'bg-orange-600/20 text-orange-600' :
                    'bg-white/[0.04] text-muted-foreground'
                  }`}>
                    {rank}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-white/[0.06] flex items-center justify-center shrink-0 overflow-hidden">
                    {entry.display_name ? (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {entry.display_name[0].toUpperCase()}
                      </span>
                    ) : (
                      <Music size={16} className="text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{entry.display_name || 'Anonymous Creator'}</p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60 mt-0.5">
                      {entry.artist_name && <span className="truncate">{entry.artist_name}</span>}
                      {entry.track_name && <span className="truncate">"{entry.track_name}"</span>}
                      <span>{entry.campaign_count} campaign{entry.campaign_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Earnings */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isTop3 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                      {formatDollars(entry.total_earnings_cents)}
                    </p>
                    <p className="text-[10px] text-muted-foreground/40">{formatViews(entry.total_views)} views</p>
                  </div>

                  {isTop3 && rank === 1 && <ChevronUp size={16} className="text-amber-400 shrink-0" />}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-muted-foreground/40">
            Leaderboard updates in real-time as video views are verified.
            <br />
            Creators earn $0.10–$5.00 CPM depending on campaign budget.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <a href="/browse" className="text-xs text-primary hover:underline">Browse campaigns</a>
            <span className="text-[10px] text-muted-foreground/30">·</span>
            <a href="/tools/creator-earnings" className="text-xs text-primary hover:underline">Estimate your earnings</a>
            <span className="text-[10px] text-muted-foreground/30">·</span>
            <a href="/welcome-creators" className="text-xs text-primary hover:underline">How it works</a>
          </div>
        </div>
      </div>
    </div>
  );
}
