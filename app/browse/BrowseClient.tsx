'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import OnboardingBanner from '@/components/OnboardingBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/States';
import {
  Search, Megaphone, Film, DollarSign, Eye,
  Music, TrendingUp, ChevronUp, ArrowUpRight,
  X, Sparkles,
} from 'lucide-react';

// GENRES removed — focusing on campaigns

function formatViews(v: number) {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}
function formatDollars(c: number) { return `$${(c / 100).toFixed(0)}`; }

// ── CAMPAIGN CARD ─────────────────────────────────────────────

function CampaignCard({ track, index, focused }: { track: any; index: number; focused: boolean }) {
  const cpm = track.cpm_rate_cents ? (track.cpm_rate_cents / 100).toFixed(2) : null;
  const budget = track.total_budget_cents ? (track.total_budget_cents / 100).toFixed(0) : null;
  const subs = parseInt(track.approved_submissions || '0');
  const views = parseInt(track.total_verified_views || '0');
  const budgetUsed = track.total_budget_cents > 0 ? Math.min(100, Math.round((((track.total_budget_cents || 0) - (track.budget_remaining_cents || 0)) / track.total_budget_cents) * 100)) : 0;
  const slug = (track.track_title || track.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || track.id;
  const url = track.artist_slug ? `/artist/${track.artist_slug}/tracks/${slug}` : `/c/${track.slug || track.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Link href={url} data-browse-card
        className={`group relative block rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border overflow-hidden transition-all hover:border-primary/30 ${
          focused ? 'border-primary/40 ring-1 ring-primary/30' : 'border-white/[0.06]'
        }`}>
        {/* Cover */}
        <div className="aspect-[4/5] bg-gradient-to-br from-primary/10 to-emerald-500/5 relative overflow-hidden">
          {track.cover_art_url ? (
            <img src={track.cover_art_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Film size={28} className="text-white/10" /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F23]/40 to-transparent" />
          {cpm && (
            <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-semibold border" style={{color: '#D6A85F', borderColor: 'rgba(214,168,95,0.2)'}}>
              ${(parseFloat(cpm) * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </div>
          )}
          <div className="absolute bottom-2 left-3 text-[10px] text-white/60 truncate max-w-[70%]">
            {track.artist_name || 'Artist'}
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
            {track.title || track.track_title || 'Untitled'}
          </p>
          {track.total_budget_cents > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold" style={{color: budgetUsed > 0 ? '#22C55E' : '#F4F1EA'}}>
                  {budgetUsed > 0 ? `${budgetUsed}%` : '$0'}
                </span>
                {cpm && (
                  <span className="text-xs font-semibold" style={{color: '#D6A85F'}}>
                    ${(parseFloat(cpm) * 1000).toFixed(0)} per 1M views
                  </span>
                )}
              </div>
              <p className="text-[9px]" style={{color: '#6B6760'}}>
                {budgetUsed > 0 ? 'paid out' : 'campaign budget'}
              </p>
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${budgetUsed}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
              </div>
            </div>
          )}
          {(subs > 0 || views > 0) && (
            <div className="flex items-center gap-3 text-[9px]" style={{color: '#6B6760', opacity: 0.5}}>
              {subs > 0 && <span className="flex items-center gap-1"><Film size={10} /> {subs} sub{subs !== 1 ? 's' : ''}</span>}
              {views > 0 && <span className="flex items-center gap-1"><Eye size={10} /> {formatViews(views)} views</span>}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ── SKELETON ─────────────────────────────────────────────────

function BrowseSkeleton() {
  return (
    <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 max-w-5xl mx-auto">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden animate-pulse">
          <div className="aspect-video bg-white/[0.04]" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-3/4 bg-white/[0.04] rounded" />
            <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
            <div className="h-1 w-full bg-white/[0.04] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────

export default function BrowseClient() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const searchTimerRef = useRef<NodeJS.Timeout>();
  const [selectedGenre, setSelectedGenre] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleSearchInput = useCallback((val: string) => {
    setSearchInput(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => { setSearchQuery(val); loadCampaigns(); }, 400);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchInput(''); setSearchQuery(''); loadCampaigns();
  }, []);

  // Scroll-to-top
  useEffect(() => {
    const h = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Load campaigns
  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (selectedGenre) p.set('genre', selectedGenre);
      if (searchQuery) p.set('search', searchQuery);
      p.set('limit', '50');
      const res = await fetch(`/api/campaigns?${p.toString()}`, { credentials: 'omit' });
      if (res.ok) {
        const d = await res.json();
        const items = d.campaigns || [];
        setCampaigns(items);
        setTotal(d.total || 0);
        if (items.length < 50) setHasMore(false); // Nothing left to load
      }
    } catch {} finally { setLoading(false); }
  };

  // Initial load + genre/search changes
  useEffect(() => { setPage(1); setHasMore(true); loadCampaigns(); }, [selectedGenre, searchQuery]);

  // Load more (infinite scroll)
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const p = new URLSearchParams();
      p.set('page', String(page + 1)); p.set('limit', '20');
      if (selectedGenre) p.set('genre', selectedGenre);
      if (searchQuery) p.set('search', searchQuery);
      const res = await fetch(`/api/campaigns?${p.toString()}`, { credentials: 'omit' });
      if (res.ok) {
        const d = await res.json(); const more = d.campaigns || [];
        if (more.length === 0) setHasMore(false);
        else { setCampaigns(prev => [...prev, ...more]); setPage(p => p + 1); }
      }
    } catch {} finally { setLoadingMore(false); }
  };

  // IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore();
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, selectedGenre, searchQuery]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (campaigns.length === 0) return;
    let n = focusedIndex;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': e.preventDefault(); n = focusedIndex >= campaigns.length - 1 ? 0 : focusedIndex + 1; break;
      case 'ArrowLeft': case 'ArrowUp': e.preventDefault(); n = focusedIndex <= 0 ? campaigns.length - 1 : focusedIndex - 1; break;
      case 'Enter': e.preventDefault(); if (focusedIndex >= 0) { const t = campaigns[focusedIndex]; window.location.href = `/c/${t.slug || t.id}`; } return;
      case 'Escape': setFocusedIndex(-1); return;
      default: return;
    }
    setFocusedIndex(n);
    const cards = gridRef.current?.querySelectorAll('[data-browse-card]');
    if (cards?.[n]) cards[n].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0F0F23]">
      <Header />
      <OnboardingBanner />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 md:pb-12">
        {/* ── HERO ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/[0.06] via-primary/[0.03] to-emerald-500/[0.04] border border-white/[0.06] p-6 md:p-10 mb-8 mt-6">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/[0.05] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
                Browse campaigns
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Find tracks with active campaigns. Create content, submit, and earn per verified view.
                {total > 0 && <span className="text-emerald-400 font-medium"> <span>{total}+</span> campaigns available.</span>}
              </p>
            </div>
            <div className="w-full md:w-72 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
              <input value={searchInput} onChange={e => handleSearchInput(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full rounded-xl bg-white/[0.06] border border-white/[0.06] pl-9 pr-8 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 focus:bg-white/[0.08] transition-all" />
              {searchInput && <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"><X size={14} /></button>}
            </div>
          </div>
        </div>

        {/* ── COUNT BAR ── */}
        <div className="mb-6">
          <span className="text-[10px] text-muted-foreground/40 font-medium">
            {loading ? 'Loading...' : `${total} campaign${total !== 1 ? 's' : ''}`}
            {searchQuery && <span className="text-primary"> · &quot;{searchQuery}&quot;</span>}
          </span>
        </div>

        {/* ── GRID ── */}
        <div ref={gridRef} tabIndex={0} onKeyDown={handleKeyDown}
          className="outline-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-2xl"
          aria-label="Browse campaigns, use arrow keys to navigate">
          {loading && campaigns.length === 0 ? (
            <BrowseSkeleton />
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16">
              <EmptyState icon={<div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4"><Megaphone size={28} className="text-muted-foreground/30" /></div>}
                title="No campaigns found"
                description={selectedGenre || searchQuery ? 'Try different filters or browse all genres.' : 'No active campaigns yet. Artists can create campaigns from their dashboard.'} />
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 max-w-5xl mx-auto">
              {campaigns.map((c: any, i: number) => (
                <CampaignCard key={c.slug || c.id} track={c} index={i} focused={focusedIndex === i} />
              ))}
            </div>
          )}

          {hasMore && <div ref={sentinelRef} className="h-4 w-full" />}
          {loadingMore && <div className="flex justify-center py-6"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}
          {!hasMore && campaigns.length > 0 && <p className="text-center text-[10px] text-muted-foreground/30 py-6">All campaigns loaded</p>}
        </div>
      </main>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 md:bottom-8 right-6 z-30 w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.1] transition-all active:scale-90 shadow-xl">
            <ChevronUp size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
