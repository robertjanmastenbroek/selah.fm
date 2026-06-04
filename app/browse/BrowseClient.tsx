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

type Tab = 'artists' | 'campaigns';

export default function BrowseClient() {
  const [tab, setTab] = useState<Tab>('artists');

  // Artist state
  const [artists, setArtists] = useState<any[]>([]);
  const [totalArtists, setTotalArtists] = useState(0);
  const [loadingArtists, setLoadingArtists] = useState(true);

  // Campaign state
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

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

  // Load campaigns
  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const p = new URLSearchParams();
      if (selectedGenre) p.set('genre', selectedGenre);
      if (searchQuery) p.set('search', searchQuery);
      p.set('sort', selectedSort);
      p.set('limit', '50');
      const res = await fetch(`/api/campaigns?${p.toString()}`, { credentials: 'omit' });
      if (res.ok) {
        const d = await res.json();
        setCampaigns(d.campaigns || []);
        setTotalCampaigns(d.total || 0);
      }
    } catch {} finally { setLoadingCampaigns(false); }
  };

  // Reload on filter change
  useEffect(() => { loadArtists(); }, [selectedGenre, selectedSort]);
  useEffect(() => { loadCampaigns(); }, [selectedGenre, selectedSort, tab]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (tab === 'artists') loadArtists(q);
    else loadCampaigns();
  };

  const loading = tab === 'artists' ? loadingArtists : loadingCampaigns;
  const items = tab === 'artists' ? artists : campaigns;
  const total = tab === 'artists' ? totalArtists : totalCampaigns;
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
          <button onClick={() => { setTab('artists'); setSelectedSort('popular'); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === 'artists' ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Users2 size={14} />
            Artists
          </button>
          <button onClick={() => { setTab('campaigns'); setSelectedSort('popular'); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === 'campaigns' ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Film size={14} />
            Campaigns
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
                <li>1. Find an artist or campaign you like</li>
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

        {/* Grid */}
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
              icon={<span className="text-4xl">{tab === 'artists' ? '🎵' : '📢'}</span>}
              title={`No ${tab} found`}
              description={
                selectedGenre || searchQuery
                  ? 'Try different filters or browse all genres.'
                  : tab === 'artists'
                  ? 'Artists are added daily.'
                  : 'Campaigns are created by artists. Browse artists to find active campaigns.'
              } />
            {tab === 'campaigns' && (
              <Link href="/browse" className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-all">
                Browse artists →
              </Link>
            )}
          </div>
        ) : tab === 'artists' ? (
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {items.map((a: any) => (<ArtistCard key={a.id} artist={a} />))}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {items.map((c: any) => {
              const cpm = c.cpm_rate_cents ? (c.cpm_rate_cents / 100).toFixed(2) : null;
              const budget = c.total_budget_cents ? (c.total_budget_cents / 100).toFixed(0) : null;
              const subs = parseInt(c.approved_submissions || '0');
              const views = parseInt(c.total_verified_views || '0');
              return (
                <Link key={c.slug || c.id} href={`/c/${c.slug || c.id}`}
                  className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-primary/20 hover:bg-white/[0.05] transition-all">
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
      </main>
    </div>
  );
}
