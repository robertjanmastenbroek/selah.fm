'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import CampaignCover from '@/components/CampaignCover';
import OnboardingBanner from '@/components/OnboardingBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/States';
import { Megaphone, Search, Music4, Users2 } from 'lucide-react';
import { PlatformBadge } from '@/components/SocialIcons';
import ArtistCard from '@/components/ArtistCard';

interface Campaign { id: string; slug?: string; track_title: string; cover_art_url: string; cpm_rate_cents: number; total_budget_cents: number; budget_remaining_cents: number; platforms: string[]; artist_name?: string; artist_id?: string; artist_is_creator?: boolean; artist_avatar?: string; }

const GENRES = ['pop', 'rock', 'hip-hop', 'electronic', 'r&b', 'country', 'latin', 'jazz', 'classical', 'indie', 'folk', 'metal', 'punk', 'reggae', 'blues', 'soul', 'funk', 'world', 'alternative', 'dance'];
const PLATFORMS = ['tiktok', 'instagram', 'youtube'];
const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'highest_cpm', label: 'Highest CPM' },
  { value: 'most_funded', label: 'Most Funded' },
  { value: 'most_views', label: 'Most Views' },
];

function buildQuery(filters: Record<string, string>) {
  const p = new URLSearchParams();
  if (filters.q) p.set('q', filters.q);
  if (filters.genre) p.set('genre', filters.genre);
  if (filters.platform) p.set('platform', filters.platform);
  if (filters.cpm_min) p.set('cpm_min', filters.cpm_min);
  if (filters.cpm_max) p.set('cpm_max', filters.cpm_max);
  p.set('sort', filters.sort || 'popular');
  p.set('limit', '100');
  const qs = p.toString();
  return qs ? `?${qs}` : '?limit=100&sort=popular';
}

function lerpColor(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
function pctColor(pct: number) {
  const t = Math.min(pct, 100) / 100;
  return `rgb(${lerpColor(0x43, 0x22, t)},${lerpColor(0x38, 0xC5, t)},${lerpColor(0xCA, 0x5E, t)})`;
}
function CircleProgress({ pct, size = 36 }: { pct: number; size?: number }) {
  const stroke = 4, radius = (size - stroke) / 2, circumference = radius * 2 * Math.PI, offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={pctColor(pct)} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span className="absolute text-[11px] font-bold">{Math.round(pct)}%</span>
    </div>
  );
}

function CampaignGrid({ campaigns, loading }: { campaigns: Campaign[]; loading: boolean }) {
  if (loading && campaigns.length === 0) {
    return (
      <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <Skeleton className="h-40 w-full rounded-t-2xl bg-white/[0.03]" />
            <div className="p-4 space-y-3"><Skeleton className="h-5 w-2/3 bg-white/[0.03]" /><Skeleton className="h-4 w-1/3 bg-white/[0.03]" /></div>
          </div>
        ))}
      </div>
    );
  }
  if (campaigns.length === 0) return null;
  return (
    <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {campaigns.map((c, i) => {
        const cpm = c.cpm_rate_cents / 100;
        const budget = (c.total_budget_cents || 0) / 100;
        const remaining = (c.budget_remaining_cents || 0) / 100;
        const pct = budget > 0 ? ((budget - remaining) / budget) * 100 : 0;
        return (
          <Link key={c.id} href={`/c/${c.slug || c.id}`} className="h-full">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }} whileHover={{ y: -2 }}
              className="h-full flex flex-col rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden cursor-pointer transition-all duration-200 hover:border-[#4338CA]/15 hover:bg-white/[0.04]">
              <CampaignCover src={c.cover_art_url} title={c.track_title} className="h-40 shrink-0" />
              <div className="flex-1 flex flex-col justify-between p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {c.artist_name && <p className="text-[11px] text-muted-foreground line-clamp-1 mb-0.5">{c.artist_name}</p>}
                    <h3 className="text-sm leading-snug line-clamp-2 font-semibold min-h-[2.5rem]" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>{c.track_title}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">{(c.platforms || []).map((p: string) => <PlatformBadge key={p} platform={p} />)}</div>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <CircleProgress pct={pct} size={32} />
                    <div className="text-[10px] text-muted-foreground leading-tight">
                      <span className="font-semibold text-foreground/70">${(budget - remaining).toFixed(0)}</span>
                      {budget > 0 && <span> of ${budget.toFixed(0)}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-[#22C55E] font-semibold">${(cpm * 1000).toFixed(0)}/1M views</span>
                </div>
              </div>
            </motion.div>
          </Link>
        );
      })}
    </div>
  );
}

export default function BrowseClient({ initialCampaigns = [], initialTotal = 0 }: { initialCampaigns?: Campaign[]; initialTotal?: number }) {
  const [tab, setTab] = useState<'campaigns' | 'artists'>('artists');
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [artists, setArtists] = useState<any[]>([]);
  const [total, setTotal] = useState(initialTotal);
  const [artistTotal, setArtistTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, any>>({ genre: '', platform: '', sort: 'popular' });
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedSort, setSelectedSort] = useState('popular');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tab === 'campaigns') {
      if (initialCampaigns.length === 0) loadCampaigns({ sort: 'popular' });
      else setLoading(false);
    } else loadArtists();
  }, [tab]);

  const loadCampaigns = async (f = filters) => {
    setLoading(true);
    try { const url = `/api/campaigns${buildQuery(f)}`; const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`); const data = await res.json();
      setCampaigns(data.campaigns || []); setTotal(data.total || 0);
    } catch {} finally { setLoading(false); }
  };
  const loadArtists = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams(); if (selectedGenre) p.set('genre', selectedGenre); if (filters.q) p.set('search', filters.q);
      p.set('sort', selectedSort); p.set('limit', '50');
      const res = await fetch(`/api/artists?${p.toString()}`, { credentials: 'omit' });
      if (res.ok) { const d = await res.json(); setArtists(d.artists || []); setArtistTotal(d.total || 0); }
    } catch {} finally { setLoading(false); }
  };
  const refresh = () => { if (tab === 'campaigns') loadCampaigns(); else loadArtists(); };
  const handleSearch = (q: string) => {
    const nf = { ...filters, q, genre: selectedGenre, platform: selectedPlatform, sort: selectedSort };
    if (!q) { const { q: _, ...rest } = nf; setFilters(rest); setTimeout(refresh, 0); return; }
    setFilters(nf); setTimeout(refresh, 0);
  };
  const switchTab = (t: typeof tab) => { setTab(t); setLoading(true); setTimeout(() => { if (t === 'campaigns') loadCampaigns(); else loadArtists(); }, 0); };

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <OnboardingBanner />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-xl p-0.5 mb-6 w-fit">
          {(['campaigns', 'artists'] as const).map(t => (
            <button key={t} onClick={() => switchTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'campaigns' ? <><Music4 size={14} className="inline mr-1.5" />Campaigns</> : <><Users2 size={14} className="inline mr-1.5" />Artists</>}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              {tab === 'campaigns' ? 'Discover campaigns' : 'Browse artists'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {tab === 'campaigns' ? `${total} campaign${total !== 1 ? 's' : ''} available` : `${artistTotal} artist${artistTotal !== 1 ? 's' : ''} available`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_24px_rgba(67,56,202,0.35)] active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #4338CA, #4338CA)' }}>
              <Megaphone size={16} /> Create campaign
            </Link>
            <div className="flex items-center gap-2">
              <input ref={searchInputRef} placeholder="Search..." className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none w-48"
                onKeyDown={e => { if (e.key === 'Enter') handleSearch((e.target as HTMLInputElement).value); }} />
              <button onClick={() => handleSearch(searchInputRef.current?.value || '')} className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.06] text-muted-foreground transition-colors"><Search size={16} /></button>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setSelectedGenre(''); setTimeout(refresh, 0); }}
              className={`filter-chip ${selectedGenre === '' ? 'filter-chip-active' : ''}`}>All genres</button>
            {GENRES.map(g => (
              <button key={g} onClick={() => { setSelectedGenre(g); setTimeout(refresh, 0); }}
                className={`filter-chip ${selectedGenre === g ? 'filter-chip-active' : ''}`}>{g.charAt(0).toUpperCase() + g.slice(1)}</button>
            ))}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Platform:</span>
              <button onClick={() => { setSelectedPlatform(''); setTimeout(refresh, 0); }}
                className={`filter-chip text-[10px] ${selectedPlatform === '' ? 'filter-chip-active' : ''}`}>All</button>
              {PLATFORMS.map(p => (
                <button key={p} onClick={() => { setSelectedPlatform(p); setTimeout(refresh, 0); }}
                  className={`filter-chip text-[10px] ${selectedPlatform === p ? 'filter-chip-active' : ''}`}>{p.charAt(0).toUpperCase() + p.slice(1)}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Sort:</span>
              <select value={selectedSort} onChange={e => { setSelectedSort(e.target.value); setTimeout(refresh, 0); }}
                className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-foreground focus:border-primary/30 focus:outline-none appearance-none cursor-pointer">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[#1C1C3A]">{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {tab === 'artists' ? (
          loading && artists.length === 0 ? (
            <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                  <Skeleton className="aspect-square w-full rounded-t-2xl bg-white/[0.03]" />
                  <div className="p-4 space-y-3"><Skeleton className="h-4 w-2/3 bg-white/[0.03]" /><Skeleton className="h-3 w-1/3 bg-white/[0.03]" /></div>
                </div>
              ))}
            </div>
          ) : artists.length === 0 ? (
            <>
            <EmptyState icon={<span className="text-4xl">🎵</span>} title="No artists found"
              description={selectedGenre || filters.q ? 'Try different filters or browse all genres — new campaigns added daily.' : 'Artists are added daily.'} />
            {/* Auto-switch to campaigns tab with message */}
            <div className="mt-4 text-center">
              <button onClick={() => switchTab('campaigns')}
                className="text-xs text-primary hover:underline font-medium">
                → Browse campaigns instead
              </button>
            </div>
            </>
          ) : (
            <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {artists.map((a: any) => (<ArtistCard key={a.id} artist={a} />))}
            </div>
          )
        ) : (
          <>
            <CampaignGrid campaigns={campaigns} loading={loading} />
            {!loading && campaigns.length === 0 && (
              <EmptyState icon={<span className="text-4xl">🔍</span>} title="No campaigns match your filters"
                description={selectedGenre || selectedPlatform || filters.q ? 'Try adjusting your filters.' : 'No campaigns yet.'} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
