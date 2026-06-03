'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import OnboardingBanner from '@/components/OnboardingBanner';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/States';
import { Search, Users2, Sparkles, X } from 'lucide-react';
import ArtistCard from '@/components/ArtistCard';

const GENRES = ['pop', 'rock', 'hip-hop', 'electronic', 'r&b', 'country', 'latin', 'jazz', 'classical', 'indie', 'folk', 'metal', 'punk', 'reggae', 'blues', 'soul', 'funk', 'world', 'alternative', 'dance'];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'listeners', label: 'Most Listeners' },
  { value: 'name', label: 'Name' },
];

export default function BrowseClient() {
  const [artists, setArtists] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
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

  const loadArtists = async (search?: string) => {
    setLoading(true);
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
        setTotal(d.total || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadArtists(); }, [selectedGenre, selectedSort]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    loadArtists(q);
  };

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <OnboardingBanner />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              Browse artists
            </h1>
            <p className="text-muted-foreground text-sm">{total} artist{total !== 1 ? 's' : ''} available</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <input ref={searchInputRef} placeholder="Search artists..."
                className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none w-48"
                onKeyDown={e => { if (e.key === 'Enter') handleSearch((e.target as HTMLInputElement).value); }} />
              <button onClick={() => handleSearch(searchInputRef.current?.value || '')}
                className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] text-muted-foreground transition-colors">
                <Search size={16} />
              </button>
            </div>
          </div>
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
                <li>1. Find an artist you like below</li>
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
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Sort:</span>
            <select value={selectedSort} onChange={e => setSelectedSort(e.target.value)}
              className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-foreground focus:border-primary/30 focus:outline-none appearance-none cursor-pointer">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[#1C1C3A]">{o.label}</option>)}
            </select>
            <Link href="/campaigns" className="text-[11px] text-muted-foreground/40 hover:text-primary/60 ml-auto transition-colors">
              Legacy campaigns →
            </Link>
          </div>
        </div>

        {/* Artist grid */}
        {loading && artists.length === 0 ? (
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <Skeleton className="aspect-square w-full rounded-t-2xl bg-white/[0.03]" />
                <div className="p-4 space-y-3"><Skeleton className="h-4 w-2/3 bg-white/[0.03]" /><Skeleton className="h-3 w-1/3 bg-white/[0.03]" /></div>
              </div>
            ))}
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-16">
            <EmptyState icon={<span className="text-4xl">🎵</span>} title="No artists found"
              description={selectedGenre || searchQuery ? 'Try different filters or browse all genres.' : 'Artists are added daily.'} />
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {artists.map((a: any) => (<ArtistCard key={a.id} artist={a} />))}
          </div>
        )}
      </main>
    </div>
  );
}
