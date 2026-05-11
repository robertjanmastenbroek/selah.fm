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
import { Megaphone } from 'lucide-react';
import { PlatformBadge } from '@/components/SocialIcons';

interface Campaign { id: string; track_title: string; cover_art_url: string; cpm_rate_cents: number; total_budget_cents: number; budget_remaining_cents: number; platforms: string[]; artist_name?: string; artist_avatar?: string; }

function buildQuery(filters: Record<string, any>) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.platform) params.set('platform', filters.platform);
  if (filters.minCpm) params.set('minCpm', String(filters.minCpm));
  if (filters.offset) params.set('offset', String(filters.offset || 0));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

const platformOptions = [
  { id: 'tiktok', label: 'TikTok', color: '#ff0050', desc: 'Short video' },
  { id: 'instagram', label: 'Reels', color: '#E1306C', desc: 'Instagram' },
  { id: 'youtube', label: 'Shorts', color: '#FF0000', desc: 'YouTube' },
];

// ── Circle Progress (light-blue → dark-blue gradient) ──────
function lerpColor(a: number, b: number, t: number) { return Math.round(a + (b - a) * t); }
function pctColor(pct: number) {
  const t = Math.min(pct, 100) / 100;
  return `rgb(${lerpColor(0x5B,0x1E,t)},${lerpColor(0x7F,0x3A,t)},${lerpColor(0xFF,0x8A,t)})`;
}

function CircleProgress({ pct, size = 40 }: { pct: number; size?: number }) {
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
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      setTotal(data.total || 0);
    } catch { } finally { setLoading(false); }
  };

  const handleFilter = (f: any) => { setFilters(f); loadCampaigns(f); };

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A' }}>
      <Header />
      <main className="page-container">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Discover campaigns</h1>
            <p className="text-muted-foreground text-sm">{total} campaigns available</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all duration-200 hover:shadow-[0_0_24px_rgba(91,127,255,0.25)] active:scale-[0.97]">
              <Megaphone size={16} />
              Create campaign
            </Link>
            <CampaignSearch onFilter={handleFilter} />
          </div>
        </div>

        {loading && campaigns.length === 0 ? (
          <div className="campaign-grid">{[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]">
              <div className="p-5 space-y-3">
                <Skeleton className="h-40 w-full rounded-t-2xl" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}</div>
        ) : campaigns.length === 0 ? (
          Object.keys(filters).length > 0 ? (
            <EmptyState
              icon={<span className="text-4xl">🔍</span>}
              title="No matching campaigns"
              description="Try adjusting your filters or search terms."
              action={{ label: 'Clear filters', onClick: () => { setFilters({}); loadCampaigns({}); } }}
            />
          ) : (
            <EmptyState
              icon={<span className="text-4xl">🎵</span>}
              title="No campaigns yet"
              description="Be the first to create one — and share it with your fans."
              action={{ label: 'Create a campaign', href: '/dashboard' }}
            />
          )
        ) : (
          <div className="campaign-grid">
            {campaigns.map((c, i) => {
              const cpm = c.cpm_rate_cents / 100;
              const budget = c.total_budget_cents / 100;
              const remaining = c.budget_remaining_cents / 100;
              const pct = budget > 0 ? ((budget - remaining) / budget) * 100 : 0;
              return (
                <Link key={c.id} href={`/c/${c.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                    whileHover={{ y: -2 }}
                    className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden cursor-pointer transition-colors hover:border-primary/10"
                  >
                    {/* Cover image */}
                    <CampaignCover src={c.cover_art_url} title={c.track_title} className="h-40" />

                    {/* Card body */}
                    <div className="p-4 space-y-3">
                      {/* Track title + platform badges */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{c.track_title}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          {(c.platforms || []).map((p: string) => <PlatformBadge key={p} platform={p} />)}
                        </div>
                      </div>

                      {/* Budget progress + artist */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <CircleProgress pct={pct} size={32} />
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            <span className="font-semibold text-foreground/70">${(budget - remaining).toFixed(0)}</span> of ${budget.toFixed(0)} budget used
                          </div>
                        </div>
                        {c.artist_name && (
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <div className="w-5 h-5 rounded-full bg-white/[0.04] flex items-center justify-center text-[8px] font-bold text-muted-foreground overflow-hidden">
                              {c.artist_avatar ? (
                                <img src={c.artist_avatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                c.artist_name[0]?.toUpperCase()
                              )}
                            </div>
                          </div>
                        )}
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
