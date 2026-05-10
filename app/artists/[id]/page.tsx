'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import CreatorAvatar from '@/components/CreatorAvatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import CampaignCover from '@/components/CampaignCover';
import { PlatformBadge, TikTok, Instagram, YouTube } from '@/components/SocialIcons';
import { Megaphone, Eye, FileText, DollarSign, ArrowRight, Music4 } from 'lucide-react';
import { MessageButton } from '@/components/MessageButton';
import { RatingDisplay } from '@/components/RatingPrompt';

const BG = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';

export default function ArtistProfilePage() {
  const { id } = useParams();
  const [artist, setArtist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState({ average: 0, count: 0 });

  useEffect(() => {
    fetch(`/api/artists/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setArtist(null); else setArtist(d); setLoading(false); })
      .catch(() => setLoading(false));

    // Fetch rating
    fetch(`/api/ratings?userId=${id}`)
      .then(r => r.json())
      .then(d => setRating({ average: d.average || 0, count: d.count || 0 }))
      .catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Header />
        <main className="page-container max-w-3xl">
          <Skeleton className="h-48 w-full rounded-2xl mb-4" />
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen" style={{ background: BG }}>
        <Header />
        <main className="page-container max-w-3xl text-center py-20">
          <h2 className="text-xl font-bold mb-2">Artist not found</h2>
        </main>
        <BottomNav />
      </div>
    );
  }

  const spent = (artist.total_spent_cents || 0) / 100;
  const budget = (artist.total_budget_cents || 0) / 100;
  const views = artist.total_views || 0;
  const active = artist.active_campaigns || 0;

  return (
    <div className="min-h-screen pb-20" style={{ background: BG }}>
      <Header />
      <main className="page-container max-w-3xl">
        {/* Profile header */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
            <div className="p-6 -mt-12 relative">
              <CreatorAvatar name={artist.display_name || 'Artist'} size="xl" />
              <div className="mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{artist.display_name}</h1>
                  {rating.count > 0 && <RatingDisplay value={rating.average} count={rating.count} />}
                  <span className="flex items-center gap-1">
                    {artist.tiktok_handle && <span className="text-[#ff0050]/70"><TikTok size={14} /></span>}
                    {artist.instagram_handle && <span className="text-[#E1306C]/70"><Instagram size={14} /></span>}
                    {artist.youtube_handle && <span className="text-[#FF0000]/70"><YouTube size={14} /></span>}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {artist.tiktok_handle && <Badge variant="outline" className="text-[10px]">{artist.tiktok_handle}</Badge>}
                  {artist.instagram_handle && <Badge variant="outline" className="text-[10px]">{artist.instagram_handle}</Badge>}
                  {artist.youtube_handle && <Badge variant="outline" className="text-[10px]">{artist.youtube_handle}</Badge>}
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{active} active</Badge>
                  <div className="mt-2"><MessageButton userId={artist.id} name={artist.display_name} /></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {[
            { value: `$${spent.toFixed(0)}`, label: 'Total Spent', icon: DollarSign },
            { value: `$${budget.toFixed(0)}`, label: 'Budget', icon: Megaphone },
            { value: views >= 1000 ? `${(views / 1000).toFixed(1)}K` : views, label: 'Views', icon: Eye },
            { value: artist.total_submissions, label: 'Submissions', icon: FileText },
          ].map(s => {
            const I = s.icon;
            return (
              <div key={s.label} className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-4 text-center">
                <I size={18} className="mx-auto mb-2 text-primary/60" strokeWidth={1.5} />
                <div className="text-xl font-bold text-primary">{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            );
          })}
        </motion.div>

        {/* Bio */}
        {artist.bio && (
          <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Music4 size={16} strokeWidth={1.5} className="text-primary/60" />About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{artist.bio}</p>
            </div>
          </motion.div>
        )}

        {/* Genres */}
        {artist.genres && (
          <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
              <h3 className="text-sm font-semibold mb-3">Genres</h3>
              <div className="flex gap-1 flex-wrap">{(artist.genres || '').split(',').map((g: string) => <Badge key={g} variant="secondary" className="text-[10px]">{g.trim()}</Badge>)}</div>
            </div>
          </motion.div>
        )}

        {/* Active Campaigns */}
        <motion.div className="mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h3 className="font-semibold text-lg mb-4">Active Campaigns ({active})</h3>
          {artist.campaigns && artist.campaigns.length > 0 ? (
            <div className="space-y-3">
              {artist.campaigns.map((c: any) => {
                const spentCampaign = (c.total_budget_cents - c.budget_remaining_cents) / 100;
                const pct = c.total_budget_cents > 0 ? ((spentCampaign / (c.total_budget_cents / 100)) * 100) : 0;
                return (
                  <Link key={c.id} href={`/c/${c.id}`} className="block rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4 p-4">
                      <CampaignCover src={c.cover_art_url} title={c.track_title} className="w-16 h-16 rounded-xl shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{c.track_title}</span>
                          <div className="flex gap-0.5">{(c.platforms || []).slice(0, 2).map((p: string) => <PlatformBadge key={p} platform={p} />)}</div>
                        </div>
                        <p className="text-xs text-muted-foreground">${(c.cpm_rate_cents / 100).toFixed(2)} CPM · ${(c.total_budget_cents / 100).toFixed(0)} budget</p>
                        <Progress value={Math.min(pct, 100)} className="h-1 mt-2" />
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-8 text-center">
              <Megaphone size={32} className="mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No active campaigns right now.</p>
            </div>
          )}
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
