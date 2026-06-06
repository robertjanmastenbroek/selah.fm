'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import OnboardingBanner from '@/components/OnboardingBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/States';
import {
  Search, Users, Sparkles, X, Film, DollarSign, Eye,
  Music, TrendingUp, ChevronUp, ArrowUpRight, SlidersHorizontal,
  RotateCcw, Hash, Award, Clock,
} from 'lucide-react';
import ArtistCard from '@/components/ArtistCard';

const GENRES = ['pop', 'rock', 'hip-hop', 'electronic', 'r&b', 'country', 'latin', 'jazz', 'classical', 'indie', 'folk', 'metal', 'punk', 'reggae', 'blues', 'soul', 'funk', 'world', 'alternative', 'dance'];

const SORT_ARTISTS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'listeners', label: 'Most Listeners' },
  { value: 'name', label: 'Name' },
];

const SORT_CAMPAIGNS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'highest_cpm', label: 'Highest CPM' },
  { value: 'most_funded', label: 'Most Funded' },
];

type Tab = 'trending' | 'artists' | 'tracks';

// ── Helpers ──────────────────────────────────────────────────────
function formatViews(v: number) { return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v); }
function formatDollars(c: number) { return `$${(c / 100).toFixed(0)}`; }

const tabConfig: { id: Tab; label: string; icon: any }[] = [
  { id: 'trending', label: 'Trending', icon: Sparkles },
  { id: 'artists', label: 'Artists', icon: Users },
  { id: 'tracks', label: 'Tracks', icon: Film },
];

// ── REUSABLE CARD COMPONENTS ────────────────────────────────────

function TrendingCard({ item, index, focused }: { item: any; index: number; focused: boolean }) {
  // Link to track page (SEO-friendly URL)
  const trackSlug = (item.track_title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || item.id;
  const href = item.artist_slug ? `/artist/${item.artist_slug}/tracks/${trackSlug}` : `/c/${item.campaign_slug || item.id}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Link href={href} data-browse-card
        className={`group relative block rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border overflow-hidden transition-all hover:border-amber-500/30 ${
          focused ? 'border-amber-400/50 ring-1 ring-amber-400/30' : 'border-white/[0.06]'
        }`}
      >
        <div className="aspect-video bg-gradient-to-br from-amber-500/10 to-orange-500/5 relative overflow-hidden">
          {item.cover_art_url ? (
            <img src={item.cover_art_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TrendingUp size={28} className="text-amber-500/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F23]/60 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
            <span className="text-[10px] font-medium text-white/80 truncate">{item.artist_name || 'Artist'}</span>
            {item.views_verified > 0 && (
              <span className="flex items-center gap-1 text-[9px] text-amber-400/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                <Eye size={10} /> {parseInt(item.views_verified).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm font-semibold truncate group-hover:text-amber-400 transition-colors">
            {item.track_title || item.title || 'Track'}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground/50">Click to view →</span>
            <ArrowUpRight size={10} className="text-muted-foreground/30 group-hover:text-amber-400 transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function ArtistCardWrapper({ artist, index, focused }: { artist: any; index: number; focused: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      data-browse-card
      className={focused ? 'ring-1 ring-primary/30 rounded-2xl' : ''}
    >
      <ArtistCard artist={artist} />
    </motion.div>
  );
}

function TrackCard({ track, index, focused }: { track: any; index: number; focused: boolean }) {
  const cpm = track.cpm_rate_cents ? (track.cpm_rate_cents / 100).toFixed(2) : null;
  const budget = track.total_budget_cents ? (track.total_budget_cents / 100).toFixed(0) : null;
  const subs = parseInt(track.approved_submissions || '0');
  const views = parseInt(track.total_verified_views || '0');
  const budgetUsed = track.total_budget_cents > 0 ? Math.min(100, Math.round((((track.total_budget_cents || 0) - (track.budget_remaining_cents || 0)) / track.total_budget_cents) * 100)) : 0;
  // Build SEO-friendly track page URL
  const trackTitleSlug = (track.track_title || track.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || track.id;
  const trackUrl = track.artist_slug ? `/artist/${track.artist_slug}/tracks/${trackTitleSlug}` : `/c/${track.slug || track.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Link href={trackUrl} data-browse-card
        className={`group relative block rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border overflow-hidden transition-all hover:border-primary/30 ${
          focused ? 'border-primary/40 ring-1 ring-primary/30' : 'border-white/[0.06]'
        }`}
      >
        {/* Cover image */}
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-emerald-500/5 relative overflow-hidden">
          {track.cover_art_url ? (
            <img src={track.cover_art_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film size={28} className="text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F23]/40 to-transparent" />
          {cpm && (
            <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
              ${(parseFloat(cpm) * 1000).toFixed(0)}/1M
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

          {/* Budget bar */}
          {track.total_budget_cents > 0 && (
            <div className="space-y-1">
              <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetUsed}%` }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                />
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground/40">
                <span>{budgetUsed}% used</span>
                {budget && <span>${budget} budget</span>}
              </div>
            </div>
          )}

          {/* Stats row */}
          {(subs > 0 || views > 0) && (
            <div className="flex items-center gap-3 text-[9px] text-muted-foreground/50 pt-1 border-t border-white/[0.04]">
              {subs > 0 && (
                <span className="flex items-center gap-1">
                  <Film size={10} /> {subs} sub{subs !== 1 ? 's' : ''}
                </span>
              )}
              {views > 0 && (
                <span className="flex items-center gap-1">
                  <Eye size={10} /> {formatViews(views)} views
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// ── SKELETON GRID ───────────────────────────────────────────────

function BrowseSkeleton() {
  return (
    <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
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

// ── MAIN COMPONENT ──────────────────────────────────────────────

export default function BrowseClient() {
  const tb = useTranslations('browse');
  const [tab, setTab] = useState<Tab>('artists');
  const [artists, setArtists] = useState<any[]>([]);
  const [totalArtists, setTotalArtists] = useState(0);
  const [loadingArtists, setLoadingArtists] = useState(true);
  const [tracks, setTracks] = useState<any[]>([]);
  const [totalTracks, setTotalTracks] = useState(0);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [trending, setTrending] = useState<any[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
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
  const [selectedSort, setSelectedSort] = useState('popular');
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Debounced search
  const handleSearchInput = useCallback((val: string) => {
    setSearchInput(val);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(val);
      if (tab === 'artists') loadArtists(val);
      else loadTracks();
    }, 300);
  }, [tab]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    if (tab === 'artists') loadArtists('');
    else loadTracks();
  }, [tab]);

  // Check if user is new
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.user) { setIsNewUser(true); setShowWelcome(!localStorage.getItem('selah_welcome_dismissed')); }
      }).catch(() => {});
  }, []);

  // Scroll-to-top button visibility
  useEffect(() => {
    const handler = () => setShowScrollTop(window.scrollY > 800);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Load data
  const loadArtists = async (search?: string) => {
    setLoadingArtists(true);
    try {
      const p = new URLSearchParams();
      if (selectedGenre) p.set('genre', selectedGenre);
      if (search || searchQuery) p.set('search', search || searchQuery);
      p.set('sort', selectedSort); p.set('limit', '50');
      const res = await fetch(`/api/artists?${p.toString()}`, { credentials: 'omit' });
      if (res.ok) { const d = await res.json(); setArtists(d.artists || []); setTotalArtists(d.total || 0); }
    } catch {} finally { setLoadingArtists(false); }
  };

  const loadTrending = async () => {
    setLoadingTrending(true);
    try {
      const res = await fetch('/api/discover?limit=30', { credentials: 'omit' });
      if (res.ok) { const d = await res.json(); setTrending(d.submissions || d.results || d || []); }
    } catch {} finally { setLoadingTrending(false); }
  };

  const loadTracks = async () => {
    setLoadingTracks(true);
    try {
      const p = new URLSearchParams();
      if (selectedGenre) p.set('genre', selectedGenre);
      if (searchQuery) p.set('search', searchQuery);
      p.set('sort', selectedSort); p.set('limit', '50');
      const res = await fetch(`/api/tracks?${p.toString()}`, { credentials: 'omit' });
      if (res.ok) { const d = await res.json(); setTracks(d.tracks || []); setTotalTracks(d.total || 0); }
    } catch {} finally { setLoadingTracks(false); }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const p = new URLSearchParams();
      p.set('page', String(page + 1)); p.set('limit', '20');
      if (selectedGenre) p.set('genre', selectedGenre);
      if (searchQuery) p.set('search', searchQuery);
      const endpoint = tab === 'artists' ? '/api/artists' : '/api/tracks';
      const res = await fetch(`${endpoint}?${p.toString()}`, { credentials: 'omit' });
      if (res.ok) {
        const d = await res.json();
        const newItems = d.artists || d.tracks || [];
        if (newItems.length === 0) setHasMore(false);
        else {
          if (tab === 'artists') setArtists(prev => [...prev, ...newItems]);
          else setTracks(prev => [...prev, ...newItems]);
          setPage(prev => prev + 1);
        }
      }
    } catch {} finally { setLoadingMore(false); }
  };

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (tab === 'trending') return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore();
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [tab, hasMore, loadingMore, page, selectedGenre, searchQuery]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = tab === 'trending' ? trending : tab === 'artists' ? artists : tracks;
    const count = items.length;
    if (count === 0) return;
    let newIndex = focusedIndex;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault(); newIndex = focusedIndex >= count - 1 ? 0 : focusedIndex + 1; break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault(); newIndex = focusedIndex <= 0 ? count - 1 : focusedIndex - 1; break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < count) {
          const item = items[focusedIndex];
          const href = tab === 'trending'
            ? (item.campaign_slug ? `/c/${item.campaign_slug}` : `/artist/${item.artist_slug || item.slug}`)
            : tab === 'artists' ? `/artist/${item.slug}` : `/artist/${item.artist_slug}/tracks/${((item.track_title || item.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || item.slug || item.id)}`;
          window.location.href = href;
        }
        return;
      case 'Escape': setFocusedIndex(-1); return;
      default: return;
    }
    setFocusedIndex(newIndex);
    const cards = gridRef.current?.querySelectorAll('[data-browse-card]');
    if (cards?.[newIndex]) cards[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  useEffect(() => {
    if (tab === 'trending') loadTrending();
    else if (tab === 'artists') loadArtists();
    // tracks tab handled by second effect
  }, [tab, selectedGenre, selectedSort]);
  useEffect(() => {
    if (tab === 'trending') return;
    if (tab === 'tracks') loadTracks();
    // artists tab handled by first effect
  }, [selectedGenre, selectedSort, tab]);

  const loading = tab === 'trending' ? loadingTrending : tab === 'artists' ? loadingArtists : loadingTracks;
  const items = tab === 'trending' ? trending : tab === 'artists' ? artists : tracks;
  const total = tab === 'trending' ? trending.length : tab === 'artists' ? totalArtists : totalTracks;
  const sortOptions = tab === 'artists' ? SORT_ARTISTS : SORT_CAMPAIGNS;

  return (
    <div className="min-h-screen bg-[#0F0F23]">
      <Header />
      <OnboardingBanner />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 md:pb-12">
        {/* ── HERO ──────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/[0.06] via-primary/[0.03] to-emerald-500/[0.04] border border-white/[0.06] p-6 md:p-10 mb-8 mt-6">
          {/* Gradient orbs */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/[0.05] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
                Discover music
              </h1>
              <p className="text-sm text-muted-foreground max-w-lg">
                Browse artists and tracks, create content, and earn per verified view.
                {(totalArtists > 0 || totalTracks > 0) && (
                  <span className="text-emerald-400 font-medium"> <span>{tab === 'artists' ? totalArtists : totalTracks}+</span> {tab === 'artists' ? 'artists' : 'tracks'} available.</span>
                )}
              </p>
            </div>

            {/* Search bar */}
            <div className="w-full md:w-72 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
              <input
                value={searchInput}
                onChange={e => handleSearchInput(e.target.value)}
                placeholder={`Search ${tab}...`}
                className="w-full rounded-xl bg-white/[0.06] border border-white/[0.06] pl-9 pr-8 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 focus:bg-white/[0.08] transition-all"
              />
              {searchInput && (
                <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Quick action pills — only on hero */}
          <div className="flex flex-wrap gap-2 mt-5 relative z-10">
            {['pop', 'electronic', 'hip-hop', 'indie', 'r&b'].map(g => (
              <button key={g} onClick={() => { setSelectedGenre(g === selectedGenre ? '' : g); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all active:scale-95 ${
                  selectedGenre === g ? 'border-primary bg-primary/[0.08] text-primary' : 'border-white/[0.06] text-muted-foreground/60 hover:text-foreground hover:border-white/[0.12]'
                }`}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
            <Link href={`/browse/genre/${selectedGenre || 'pop'}`}
              className="px-3 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground/40 hover:text-foreground border border-dashed border-white/[0.06] hover:border-white/[0.12] transition-all flex items-center gap-1">
              All genres <ArrowUpRight size={10} />
            </Link>
          </div>
        </div>

        {/* ── NEW USER WELCOME ─────────────────────────────── */}
        <AnimatePresence>
          {isNewUser && showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-green-500/5 border border-emerald-500/10 flex items-start gap-4 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/[0.04] rounded-full blur-2xl pointer-events-none" />
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 relative z-10">
                <Sparkles size={20} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <h3 className="font-bold text-sm mb-1.5">Welcome to Selah! Start earning in 3 steps</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-primary/[0.08] flex items-center justify-center text-[8px] font-bold text-primary">1</span> Find an artist or track</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-primary/[0.08] flex items-center justify-center text-[8px] font-bold text-primary">2</span> Create a TikTok, Reel, or Short</span>
                  <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-primary/[0.08] flex items-center justify-center text-[8px] font-bold text-primary">3</span> Submit → earn per view</span>
                </div>
                <button onClick={() => { setShowWelcome(false); localStorage.setItem('selah_welcome_dismissed', 'true'); }}
                  className="mt-2 text-xs text-primary hover:underline font-medium">Got it, let me browse →</button>
              </div>
              <button onClick={() => { setShowWelcome(false); localStorage.setItem('selah_welcome_dismissed', 'true'); }}
                className="text-muted-foreground/40 hover:text-foreground transition-colors shrink-0 relative z-10">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TABS ──────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-5 bg-white/[0.03] rounded-xl p-1 w-fit relative">
          {tabConfig.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setSelectedSort('popular'); setPage(1); setHasMore(true); setFocusedIndex(-1); }}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all z-10 ${
                  active ? 'text-black' : 'text-muted-foreground hover:text-foreground'
                }`}>
                {active && (
                  <motion.div layoutId="browse-tab" className="absolute inset-0 rounded-lg bg-white"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                )}
                <Icon size={14} className="relative z-10" />
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── CONTROLS BAR ──────────────────────────────────── */}
        <div className="mb-6 space-y-3">
          {/* Genre pills */}
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSelectedGenre('')}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all active:scale-95 ${
                selectedGenre === '' ? 'border-primary bg-primary/[0.08] text-primary' : 'border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]'
              }`}>
              All
            </button>
            {GENRES.slice(0, 10).map(g => (
              <button key={g} onClick={() => setSelectedGenre(g === selectedGenre ? '' : g)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all active:scale-95 ${
                  selectedGenre === g ? 'border-primary bg-primary/[0.08] text-primary' : 'border-white/[0.06] text-muted-foreground/60 hover:text-foreground hover:border-white/[0.12]'
                }`}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
            {GENRES.length > 10 && (
              <span className="px-2.5 py-1.5 text-[10px] text-muted-foreground/30">+{GENRES.length - 10}</span>
            )}
          </div>

          {/* Filter summary bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/40 font-medium">
                {loading ? 'Loading...' : `${total} ${tab}${total !== 1 ? 's' : ''}`}
                {selectedGenre && <span className="text-primary"> · {selectedGenre}</span>}
                {searchQuery && <span className="text-primary"> · &quot;{searchQuery}&quot;</span>}
              </span>
              {(selectedGenre || searchQuery) && (
                <button onClick={() => { setSelectedGenre(''); clearSearch(); }}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors active:scale-95">
                  <RotateCcw size={10} /> Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={12} className="text-muted-foreground/40" />
              <select value={selectedSort} onChange={e => setSelectedSort(e.target.value)}
                className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5 text-[10px] text-foreground focus:outline-none focus:border-primary/30 appearance-none cursor-pointer">
                {sortOptions.map(o => <option key={o.value} value={o.value} className="bg-[#1C1C3A]">{o.value === 'popular' ? tb('sortPopular') : o.value === 'newest' ? tb('sortNewest') : o.value === 'listeners' ? tb('sortListeners') : o.value === 'name' ? tb('sortName') : o.value === 'highest_cpm' ? 'Highest CPM' : o.value === 'most_funded' ? 'Most Funded' : o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── GRID ──────────────────────────────────────────── */}
        <div
          ref={gridRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="outline-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-2xl"
          aria-label={`Browse ${tab}, use arrow keys to navigate`}
        >
          {loading && items.length === 0 ? (
            <BrowseSkeleton />
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <EmptyState
                icon={
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    {tab === 'trending' ? <TrendingUp size={28} className="text-muted-foreground/30" /> :
                     tab === 'artists' ? <Users size={28} className="text-muted-foreground/30" /> :
                     <Film size={28} className="text-muted-foreground/30" />}
                  </div>
                }
                title={tab === 'trending' ? 'No trending submissions' : `No ${tab} found`}
                description={
                  tab === 'trending' ? 'Be the first to submit a video!' :
                  selectedGenre || searchQuery ? 'Try different filters or browse all genres.' :
                  tab === 'artists' ? 'Artists are added daily.' :
                  'Tracks are added by artists. Browse artists to find active tracks.'
                }
              />
            </div>
          ) : tab === 'trending' ? (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((s: any, i: number) => (
                <TrendingCard key={s.id || i} item={s} index={i} focused={focusedIndex === i} />
              ))}
            </div>
          ) : tab === 'artists' ? (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((a: any, i: number) => (
                <ArtistCardWrapper key={a.id} artist={a} index={i} focused={focusedIndex === i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((c: any, i: number) => (
                <TrackCard key={c.slug || c.id} track={c} index={i} focused={focusedIndex === i} />
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          {tab !== 'trending' && <div ref={sentinelRef} className="h-4 w-full" />}
          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}
          {!hasMore && items.length > 0 && (
            <p className="text-center text-[10px] text-muted-foreground/30 py-6">You've reached the end</p>
          )}
        </div>
      </main>

      {/* ── SCROLL TO TOP ───────────────────────────────────── */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 md:bottom-8 right-6 z-30 w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-xl flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.1] transition-all active:scale-90 shadow-xl"
          >
            <ChevronUp size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
