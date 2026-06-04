'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import OnboardingBanner from '@/components/OnboardingBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/States';
import { Search, Users2, Sparkles, X, Film, DollarSign, Eye } from 'lucide-react';
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

export default function BrowseClient() {
  const [tab, setTab] = useState<Tab>('artists');

  // Artist state
  const [artists, setArtists] = useState<any[]>([]);
  const [totalArtists, setTotalArtists] = useState(0);
  const [loadingArtists, setLoadingArtists] = useState(true);

  // Campaign state
  const [tracks, setTracks] = useState<any[]>([]);
  const [totalTracks, setTotalTracks] = useState(0);
  const [loadingTracks, setLoadingTracks] = useState(true);

  // Trending state
  const [trending, setTrending] = useState<any[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  // Infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedSort, setSelectedSort] = useState('popular');
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check if user is new
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setIsNewUser(true);
          setShowWelcome(!localStorage.getItem('selah_welcome_dismissed'));
        }
      })
      .catch(() => {});
  }, []);

  // Load artists
  const loadArtists = async (search?: string) => {
    setLoadingArtists(true);
    try {
      const p = new URLSearchParams();
      if (selectedGenre) p.set('genre', selectedGenre);
      if (search || searchQuery) p.set('search', search || searchQuery);
      p.set('sort', selectedSort);
      p.set('limit', '50');
      const res = await fetch(`/api/artists?${p.toString()}`, { credentials: 'omit' });
      if (res.ok) {
        const d = await res.json();
        setArtists(d.artists || []);
        setTotalArtists(d.total || 0);
      }
    } catch {} finally { setLoadingArtists(false); }
  };

  // Load trending
  const loadTrending = async () => {
    setLoadingTrending(true);
    try {
      const res = await fetch('/api/discover?limit=30', { credentials: 'omit' });
      if (res.ok) { const d = await res.json(); setTrending(d.submissions || d.results || d || []); }
    } catch {} finally { setLoadingTrending(false); }
  };

  // Load more (infinite scroll)
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const p = new URLSearchParams();
      p.set('page', String(page + 1));
      p.set('limit', '20');
      if (selectedGenre) p.set('genre', selectedGenre);
      if (searchQuery) p.set('search', searchQuery);
      const endpoint = tab === 'artists' ? '/api/artists' : '/api/campaigns';
      const res = await fetch(`${endpoint}?${p.toString()}`, { credentials: 'omit' });
      if (res.ok) {
        const d = await res.json();
        const newItems = d.artists || d.campaigns || [];
        if (newItems.length === 0) { setHasMore(false); }
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
        e.preventDefault();
        newIndex = focusedIndex >= count - 1 ? 0 : focusedIndex + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = focusedIndex <= 0 ? count - 1 : focusedIndex - 1;
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < count) {
          const item = items[focusedIndex];
          const href = tab === 'trending'
            ? `/artist/${item.artist_slug || item.slug}/tracks/${item.track_id || item.id}`
            : tab === 'artists'
              ? `/artist/${item.slug}`
              : `/c/${item.slug || item.id}`;
          window.location.href = href;
        }
        return;
      case 'Escape':
        setFocusedIndex(-1);
        return;
      default: return;
    }
    setFocusedIndex(newIndex);
    // Scroll focused card into view
    const cards = gridRef.current?.querySelectorAll('[data-browse-card]');
    if (cards?.[newIndex]) cards[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  // Load campaigns
  const loadTracks = async () => {
    setLoadingTracks(true);
    try {
      const p = new URLSearchParams();
      if (selectedGenre) p.set('genre', selectedGenre);
      if (searchQuery) p.set('search', searchQuery);
      p.set('sort', selectedSort);
      p.set('limit', '50');
      const res = await fetch(`/api/campaigns?${p.toString()}`, { credentials: 'omit' });
      if (res.ok) {
        const d = await res.json();
        setTracks(d.campaigns || []);
        setTotalTracks(d.total || 0);
      }
    } catch {} finally { setLoadingTracks(false); }
  };

  // Reload on filter change
  useEffect(() => { if (tab === 'trending') { loadTrending(); return; } loadArtists(); }, [selectedGenre, selectedSort]);
  useEffect(() => { if (tab === 'trending') return; loadTracks(); }, [selectedGenre, selectedSort, tab]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (tab === 'artists') loadArtists(q);
    else loadTracks();
  };

  const loading = tab === 'trending' ? loadingTrending : tab === 'artists' ? loadingArtists : loadingTracks;
  const items = tab === 'trending' ? trending : tab === 'artists' ? artists : tracks;
  const total = tab === 'trending' ? trending.length : tab === 'artists' ? totalArtists : totalTracks;
  const sortOptions = tab === 'artists' ? SORT_ARTISTS : SORT_CAMPAIGNS;

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <OnboardingBanner />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Header + Tabs */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              Browse
            </h1>
            <p className="text-muted-foreground text-sm">{total} {tab}{total !== 1 ? 's' : ''} available</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input ref={searchInputRef} placeholder={`Search ${tab}...`}
                className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none w-48"
                onKeyDown={e => { if (e.key === 'Enter') handleSearch((e.target as HTMLInputElement).value); }} />
              <button onClick={() => handleSearch(searchInputRef.current?.value || '')}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] text-muted-foreground transition-colors">
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 w-fit">
          <button onClick={() => { setTab('trending'); setSelectedSort('popular'); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === 'trending' ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Sparkles size={14} />
            Trending
          </button>
          <button onClick={() => { setTab('artists'); setSelectedSort('popular'); setPage(1); setHasMore(true); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === 'artists' ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Users2 size={14} />
            Artists
          </button>
          <button onClick={() => { setTab('tracks'); setSelectedSort('popular'); setPage(1); setHasMore(true); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === 'tracks' ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Film size={14} />
            Tracks
          </button>
        </div>

        {/* First-run welcome */}
        {isNewUser && showWelcome && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-green-500/5 border border-emerald-500/10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Sparkles size={24} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm mb-1">Welcome to Selah! Start earning in 3 steps</h3>
              <ol className="text-xs text-muted-foreground space-y-1">
                <li>1. Find an artist or track you like</li>
                <li>2. Pick a track and create a TikTok, Reel, or Short</li>
                <li>3. Submit it — earn per verified view</li>
              </ol>
              <button onClick={() => { setShowWelcome(false); localStorage.setItem('selah_welcome_dismissed', 'true'); }}
                className="mt-3 text-xs text-primary hover:underline font-medium">Got it, let me browse →</button>
            </div>
            <button onClick={() => { setShowWelcome(false); localStorage.setItem('selah_welcome_dismissed', 'true'); }}
              className="text-muted-foreground/40 hover:text-foreground transition-colors shrink-0"><X size={16} /></button>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setSelectedGenre(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                selectedGenre === '' ? 'border-primary bg-primary/[0.08] text-primary' : 'border-white/[0.06] text-muted-foreground hover:border-white/[0.12]'
              }`}>All genres</button>
            {GENRES.map(g => (
              <button key={g} onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedGenre === g ? 'border-primary bg-primary/[0.08] text-primary' : 'border-white/[0.06] text-muted-foreground hover:border-white/[0.12]'
                }`}>{g.charAt(0).toUpperCase() + g.slice(1)}</button>
            ))}
          </div>
          {selectedGenre && (
            <a href={`/browse/genre/${selectedGenre}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary/80 hover:text-primary border border-primary/20 hover:border-primary/40 bg-primary/[0.04] hover:bg-primary/[0.08] transition-all">
              Browse all {selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1)} artists →
            </a>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Sort:</span>
            <select value={selectedSort} onChange={e => setSelectedSort(e.target.value)}
              className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-foreground focus:border-primary/30 focus:outline-none appearance-none cursor-pointer">
              {sortOptions.map(o => <option key={o.value} value={o.value} className="bg-[#1C1C3A]">{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid — keyboard navigable */}
        <div ref={gridRef} tabIndex={0} onKeyDown={handleKeyDown}
          className="outline-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-2xl"
          aria-label={`Browse ${tab}, use arrow keys to navigate`}>
        {loading && items.length === 0 ? (
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <Skeleton className="aspect-square w-full rounded-t-2xl bg-white/[0.03]" />
                <div className="p-4 space-y-3"><Skeleton className="h-4 w-2/3 bg-white/[0.03]" /><Skeleton className="h-3 w-1/3 bg-white/[0.03]" /></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <EmptyState
              icon={<span className="text-4xl">{tab === 'trending' ? '🔥' : tab === 'artists' ? '🎵' : '📢'}</span>}
              title={tab === 'trending' ? 'No trending submissions' : `No ${tab} found`}
              description={
                tab === 'trending'
                  ? 'Be the first to submit a video!'
                  : selectedGenre || searchQuery
                  ? 'Try different filters or browse all genres.'
                  : tab === 'artists'
                  ? 'Artists are added daily.'
                  : 'Tracks are added by artists. Browse artists to find active tracks.'
              } />
          </div>
        ) : tab === 'trending' ? (
          <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {items.map((s: any, i: number) => {
              const href = s.artist_slug ? `/artist/${s.artist_slug}/tracks/${s.track_id || s.id}` : `/c/${s.campaign_slug || s.id}`;
              return (
                <Link key={s.id || i} href={href} data-browse-card
                  className={`group rounded-2xl bg-white/[0.03] border overflow-hidden transition-all hover:border-primary/20 ${focusedIndex === i ? 'border-primary/40 ring-1 ring-primary/30' : 'border-white/[0.06]'}`}>
                  <div className="aspect-video bg-gradient-to-br from-amber-500/10 to-orange-500/5 relative overflow-hidden">
                    {s.cover_art_url ? (
                      <img src={s.cover_art_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🔥</div>
                    )}
                  </div>
                  <div className="p-4 space-y-1.5">
                    <p className="text-sm font-semibold truncate group-hover:text-primary">{s.track_title || s.title || 'Track'}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{s.artist_name || s.artist}</p>
                    {s.views_verified > 0 && (
                      <p className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                        <Eye size={10} />{parseInt(s.views_verified).toLocaleString()} views
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : tab === 'artists' ? (
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {items.map((a: any, i: number) => (<div key={a.id} data-browse-card className={focusedIndex === i ? 'ring-1 ring-primary/30 rounded-2xl' : ''}><ArtistCard artist={a} /></div>))}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4" style={{ columns: '2 sm:columns-3 lg:columns-4', columnGap: '0.75rem' }}>
            {items.map((c: any, i: number) => {
              const cpm = c.cpm_rate_cents ? (c.cpm_rate_cents / 100).toFixed(2) : null;
              const budget = c.total_budget_cents ? (c.total_budget_cents / 100).toFixed(0) : null;
              const subs = parseInt(c.approved_submissions || '0');
              const views = parseInt(c.total_verified_views || '0');
              return (
                <Link key={c.slug || c.id} href={`/c/${c.slug || c.id}`} data-browse-card
                  className={`group rounded-2xl bg-white/[0.03] border overflow-hidden transition-all hover:border-primary/20 hover:bg-white/[0.05] ${focusedIndex === i ? 'border-primary/40 ring-1 ring-primary/30' : 'border-white/[0.06]'}`}>
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-emerald-500/5 relative overflow-hidden">
                    {c.cover_art_url ? (
                      <img src={c.cover_art_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film size={32} className="text-white/10" />
                      </div>
                    )}
                    {cpm && (
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        ${(parseFloat(cpm) * 1000).toFixed(0)}/1M
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {c.title || c.track_title || 'Untitled'}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="truncate">{c.artist_name || 'Artist'}</span>
                      {budget && <><span className="text-muted-foreground/30">·</span><span>${budget} budget</span></>}
                    </div>

                    {/* Progress bar */}
                    {c.total_budget_cents > 0 && (() => {
                      const used = c.total_budget_cents - (c.budget_remaining_cents || 0);
                      const pct = Math.min(100, Math.round((used / c.total_budget_cents) * 100));
                      return (
                        <div className="mt-2">
                          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all" style={{width:`${pct}%`}} />
                          </div>
                          <div className="flex justify-between text-[9px] text-muted-foreground/40 mt-0.5">
                            <span>{pct}% used</span>
                            {pct > 80 && <span className="text-amber-400">⚠️ Nearly full</span>}
                            {c.approved_submissions > 0 && <span>{c.approved_submissions} submission{c.approved_submissions !== 1 ? 's' : ''}</span>}
                          </div>
                        </div>
                      );
                    })()}

                    {(subs > 0 || views > 0) && (
                      <div className="flex items-center gap-3 text-[9px] text-muted-foreground/50 pt-1 border-t border-white/[0.04]">
                        {subs > 0 && <span className="flex items-center gap-1"><Film size={10} />{subs} submission{subs !== 1 ? 's' : ''}</span>}
                        {views > 0 && <span className="flex items-center gap-1"><Eye size={10} />{views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views} views</span>}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        {tab !== 'trending' && (
          <div ref={sentinelRef} className="h-4 w-full" />
        )}
        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <p className="text-center text-[10px] text-muted-foreground/40 py-4">No more results</p>
        )}
        </div>
      </main>
    </div>
  );
}
