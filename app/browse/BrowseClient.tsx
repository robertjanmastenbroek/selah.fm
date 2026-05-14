'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import CampaignSearch from '@/components/CampaignSearch';
import CampaignCover from '@/components/CampaignCover';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/States';
import { Megaphone, Search } from 'lucide-react';
import { PlatformBadge } from '@/components/SocialIcons';

interface Campaign { id: string; slug?: string; track_title: string; cover_art_url: string; cpm_rate_cents: number; total_budget_cents: number; budget_remaining_cents: number; platforms: string[]; artist_name?: string; artist_avatar?: string; }

function buildQuery(filters: Record<string, any>) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.minCpm) params.set('minCpm', String(filters.minCpm));
  if (filters.offset) params.set('offset', String(filters.offset || 0));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ── Circle Progress ──────────────────────────────────────────
function lerpColor(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
function pctColor(pct: number) {
  const t = Math.min(pct, 100) / 100;
  const r = lerpColor(0x43, 0x22, t);
  const g = lerpColor(0x38, 0xC5, t);
  const b = lerpColor(0xCA, 0x5E, t);
  return `rgb(${r},${g},${b})`;
}

function CircleProgress({ pct, size = 36 }: { pct: number; size?: number }) {
  const stroke = 4, radius = (size - stroke) / 2, circumference = radius * 2 * Math.PI, offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  const color = pctColor(pct);
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <span className="absolute text-[11px] font-bold">{Math.round(pct)}%</span>
    </div>
  );
}

export default function BrowseClient({ initialCampaigns, initialTotal }: { initialCampaigns: Campaign[]; initialTotal: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const router = useRouter();

  const loadCampaigns = async (f: Record<string, any> = filters) => {
    setLoading(true);
    try {
      const url = `/api/campaigns${buildQuery(f)}`;
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      setTotal(data.total || 0);
    } catch { } finally { setLoading(false); }
  };

  const handleFilter = (f: any) => { setFilters(f); loadCampaigns(f); };

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* ── Hero + search ── */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              Discover campaigns
            </h1>
            <p className="text-muted-foreground text-sm">
              {total} campaign{total !== 1 ? 's' : ''} available
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm
                transition-all duration-200 hover:shadow-[0_0_24px_rgba(67,56,202,0.35)] active:scale-[0.97]"
              style={{ background: 'linear-gradient(135deg, #4338CA, #4338CA)' }}>
              <Megaphone size={16} /> Create campaign
            </Link>
            <CampaignSearch onFilter={handleFilter} />
          </div>
        </div>

        {/* ── Campaign grid ── */}
        {loading && campaigns.length === 0 ? (
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <Skeleton className="h-40 w-full rounded-t-2xl bg-white/[0.03]" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-2/3 bg-white/[0.03]" />
                  <Skeleton className="h-4 w-1/3 bg-white/[0.03]" />
                </div>
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          Object.keys(filters).length > 0 ? (
            <EmptyState icon={<span className="text-4xl">🔍</span>} title="No matching campaigns"
              description="Try adjusting your filters or search terms."
              action={{ label: 'Clear filters', onClick: () => { setFilters({}); loadCampaigns({}); } }} />
          ) : (
            <EmptyState icon={<span className="text-4xl">🎵</span>} title="No campaigns yet"
              description="Be the first to create one — and share it with your fans."
              action={{ label: 'Create a campaign', href: '/dashboard' }} />
          )
        ) : (
          <div className="grid gap-4 sm:gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {campaigns.map((c, i) => {
              const cpm = c.cpm_rate_cents / 100;
              const budget = (c.total_budget_cents || 0) / 100;
              const remaining = (c.budget_remaining_cents || 0) / 100;
              const pct = budget > 0 ? ((budget - remaining) / budget) * 100 : 0;
              return (
                <Link key={c.id} href={`/c/${c.slug || c.id}`} className="h-full">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    whileHover={{ y: -2 }}
                    className="h-full flex flex-col rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden cursor-pointer
                      transition-all duration-200 hover:border-[#4338CA]/15 hover:bg-white/[0.04]"
                  >
                    {/* Cover image */}
                    <CampaignCover src={c.cover_art_url} title={c.track_title} className="h-40 shrink-0" />

                    {/* Card body — fills remaining space, bottom section pinned to end */}
                    <div className="flex-1 flex flex-col justify-between p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {c.artist_name && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mb-0.5">{c.artist_name}</p>
                          )}
                          {/* Reserve space for 2 lines so all cards have the same title height */}
                          <h3 className="text-sm leading-snug line-clamp-2 font-semibold min-h-[2.5rem]"
                            style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
                            {c.track_title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                          {(c.platforms || []).map((p: string) => <PlatformBadge key={p} platform={p} />)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <CircleProgress pct={pct} size={32} />
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            <span className="font-semibold text-foreground/70">${(budget - remaining).toFixed(0)}</span>
                            {budget > 0 && <span> of ${budget.toFixed(0)}</span>}
                          </div>
                        </div>
                        <span className="text-[10px] text-[#22C55E] font-semibold">${cpm.toFixed(2)} CPM</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}