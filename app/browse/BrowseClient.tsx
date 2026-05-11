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
import { Megaphone, Send, DollarSign, X } from 'lucide-react';
import { trackSubmitContent } from '@/lib/analytics';
import { PlatformBadge } from '@/components/SocialIcons';

interface Campaign { id: string; track_title: string; cover_art_url: string; cpm_rate_cents: number; total_budget_cents: number; budget_remaining_cents: number; platforms: string[]; }

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

// ── Circle Progress ─────────────────────────────────────────
function CircleProgress({ pct, size = 40 }: { pct: number; size?: number }) {
  const stroke = 4, radius = (size - stroke) / 2, circumference = radius * 2 * Math.PI, offset = circumference - (Math.min(pct, 100) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
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
  const [submitModal, setSubmitModal] = useState<Campaign | null>(null);
  const [submitPlatform, setSubmitPlatform] = useState('tiktok');
  const [submitUrl, setSubmitUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

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

  const openSubmitModal = (e: React.MouseEvent, c: Campaign) => {
    e.stopPropagation();
    e.preventDefault();
    setSubmitModal(c);
    setSubmitPlatform('tiktok');
    setSubmitUrl('');
  };

  const handleSubmit = async () => {
    if (!submitModal || !submitUrl) return;
    setSubmitting(true);
    try {
      if (!submitUrl.startsWith('https://')) {
        addToast('Please paste a valid HTTPS link from TikTok, Instagram, YouTube, or Facebook', 'error');
        setSubmitting(false);
        return;
      }
      const res = await fetch('/api/submissions', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: submitModal.id, contentUrl: submitUrl, platform: submitPlatform }),
      });
      if (res.ok) {
        trackSubmitContent(submitPlatform);
        addToast('Submitted! Artist will review your video.', 'success');
        setSubmitModal(null);
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to submit', 'error');
      }
    } catch { addToast('Network error — try again', 'error'); }
    setSubmitting(false);
  };

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
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
            {Object.keys(filters).length === 0 && (
              <img src="/images/browse-mockup.png" alt="Browse campaigns" className="mx-auto mb-6 w-64 h-48 object-contain opacity-80 rounded-xl" loading="lazy" />
            )}
            <h2 className="text-xl font-semibold mb-2">{Object.keys(filters).length > 0 ? 'No matching campaigns' : 'No campaigns yet'}</h2>
            <p className="text-muted-foreground text-sm mb-6">{Object.keys(filters).length > 0 ? 'Try adjusting your filters.' : "Be the first to create one — and share it with your fans!"}</p>
            {Object.keys(filters).length > 0 ? <Button variant="outline" onClick={() => { setFilters({}); loadCampaigns({}); }}>Clear filters</Button> : <Link href="/dashboard"><Button>Create a campaign</Button></Link>}
          </motion.div>
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

                      {/* Circle progress + CPM (no horizontal bar) */}
                      <div className="flex items-center gap-3">
                        <CircleProgress pct={pct} size={40} />
                        <div>
                          <span className="text-xs font-semibold text-muted-foreground">${cpm.toFixed(2)} CPM</span>
                        </div>
                      </div>

                      {/* Submit quick-action */}
                      <button
                        onClick={(e) => openSubmitModal(e, c)}
                        className="w-full py-2 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/15 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Send size={12} /> Submit Video
                      </button>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Submission Modal ─────────────────────────────────── */}
        <AnimatePresence>
          {submitModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setSubmitModal(null)}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={e => e.stopPropagation()}
                className="relative z-10 w-full max-w-md rounded-2xl bg-[#0D0D0D] border border-white/[0.08] shadow-2xl overflow-hidden"
              >
                <div className="p-5 border-b border-white/[0.06] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                    <CampaignCover src={submitModal.cover_art_url} title="" className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{submitModal.track_title}</h3>
                    <p className="text-xs text-muted-foreground">${(submitModal.cpm_rate_cents / 100).toFixed(2)} CPM · Submit your video</p>
                  </div>
                  <button onClick={() => setSubmitModal(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X size={18} />
                  </button>
                </div>
                <div className="p-5 space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Choose platform</label>
                    <div className="grid grid-cols-3 gap-2">
                      {platformOptions.map(p => {
                        const active = submitPlatform === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSubmitPlatform(p.id)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                              active
                                ? 'border-primary bg-primary/[0.06]'
                                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: p.color + '15' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill={p.color}>
                                {p.id === 'tiktok' && <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>}
                                {p.id === 'instagram' && <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke={p.color} strokeWidth="2"/><circle cx="12" cy="12" r="5" fill="none" stroke={p.color} strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.5" fill={p.color}/></>}
                                {p.id === 'youtube' && <><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29.94 29.94 0 0 0 1 12a29.94 29.94 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29.94 29.94 0 0 0 23 12a29.94 29.94 0 0 0-.46-5.58z" fill="none" stroke={p.color} strokeWidth="2"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill={p.color}/></>}
                              </svg>
                            </div>
                            <span className="text-xs font-medium">{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Paste your video link</label>
                    <Input value={submitUrl} onChange={e => setSubmitUrl(e.target.value)} placeholder="https://www.tiktok.com/@user/video/..." className="text-sm" autoFocus />
                  </div>
                  {submitUrl && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4 flex items-center gap-3">
                      <DollarSign size={18} className="text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-400">${((submitModal.cpm_rate_cents / 100) * 0.8).toFixed(2)} per 1K views</p>
                        <p className="text-[10px] text-emerald-400/70">You keep 80% · Paid after approval</p>
                      </div>
                    </motion.div>
                  )}
                  <Button onClick={handleSubmit} disabled={!submitUrl || submitting} className="w-full py-5 text-sm font-bold rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary transition-all hover:shadow-[0_0_24px_rgba(91,127,255,0.25)]">
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Send size={16} className="mr-2" />Submit for ${((submitModal.cpm_rate_cents / 100) * 0.8).toFixed(2)}/1K views</>
                    )}
                  </Button>
                  <p className="text-[10px] text-muted-foreground/60 text-center">The artist will review your video and approve it before paying.</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
