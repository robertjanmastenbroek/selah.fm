'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  Music4, Clapperboard, ArrowRight, Shield,
  BadgeCheck, Eye, Upload, DollarSign, Heart, Star, Check
} from 'lucide-react';

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1000) return Math.floor(n / 100) / 10 + 'K';
  if (n >= 100) return Math.floor(n / 10) * 10 + '+';
  return n.toString();
}

function formatMoney(cents: number): string {
  if (cents >= 100_000_000) return '$' + (cents / 100_000_000).toFixed(1) + 'M';
  if (cents >= 100_000) return '$' + Math.floor(cents / 100_000) + 'K';
  return '$' + Math.max(0, Math.floor(cents / 100));
}

export default function RootPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({
    artists: 0, creators: 0, activeCampaigns: 0,
    totalPaidCents: 0, totalDepositedCents: 0, approvedSubmissions: 0
  });
  const [featuredCampaigns, setFeaturedCampaigns] = useState<any[]>([]);
  const [user, setUser] = useState<{ email?: string; avatar?: string; name?: string } | null>(null);

  // Auth state
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const u = data.session.user;
        setUser({
          email: u.email,
          avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0]
        });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) {
        const u = s.user;
        setUser({
          email: u.email,
          avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture,
          name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0]
        });
      } else { setUser(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Stats + featured campaigns
  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => {
      setStats(d);
    }).catch(() => {});
    fetch('/api/campaigns?limit=6&sort=recent').then(r => r.json()).then(d => {
      if (Array.isArray(d.campaigns)) setFeaturedCampaigns(d.campaigns);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) =>
      setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 15, y: (e.clientY / window.innerHeight - 0.5) * 15 });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const hasStats = stats.activeCampaigns > 0 || stats.creators > 0;

  return (
    <div className="relative overflow-hidden min-h-screen" style={{ background: '#080817' }}>
      {/* Grain texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")',
        backgroundSize: '256px 256px' }} />

      {/* Ambient light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute -top-1/3 -left-1/4 w-[900px] h-[900px] rounded-full opacity-25"
          animate={{ x: mousePos.x * -2, y: mousePos.y * -2 }}
          transition={{ type: 'spring', stiffness: 25, damping: 20 }}
          style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.35) 0%, rgba(99,102,241,0.15) 35%, transparent 70%)' }} />
        <motion.div className="absolute top-1/3 -right-1/4 w-[700px] h-[700px] rounded-full opacity-15"
          animate={{ x: mousePos.x * 2, y: mousePos.y * 2 }}
          transition={{ type: 'spring', stiffness: 20, damping: 18 }}
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)' }} />
      </div>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Auth */}
        <motion.div className="absolute top-6 right-6 z-20"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {user ? (
            <Link href="/settings"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-200">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#4338CA]/30 flex items-center justify-center text-white/70 text-[11px] font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <span className="hidden sm:inline max-w-[120px] truncate">{user.name}</span>
            </Link>
          ) : (
            <Link href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-200">
              Sign in <ArrowRight size={12} />
            </Link>
          )}
        </motion.div>

        <motion.div className="w-full max-w-3xl text-center space-y-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>

          <motion.div className="space-y-7"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}>
            {/* Logo + badge */}
            <div className="inline-flex items-center gap-3 mb-2">
              <img src="/images/Selah Logo transparant no text.png" alt="Selah" className="h-10 w-auto" />
              <span className="text-[11px] font-medium text-[#22C55E]/70 bg-[#22C55E]/5 px-2.5 py-1 rounded-full border border-[#22C55E]/10">Open source</span>
            </div>

            <h1 className="text-[44px] md:text-[64px] lg:text-[76px] font-heading tracking-tight leading-[1.03] text-balance">
              <span className="text-white">Your music,</span><br />
              <span className="bg-gradient-to-r from-[#4338CA] via-[#818CF8] to-[#22C55E] bg-clip-text text-transparent">real creators,</span><br />
              <span className="text-white">real views.</span>
            </h1>

            <p className="text-white/50 text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-light">
              Vetted creators make TikToks, Reels, and Shorts with your track.
              You approve every video. You only pay for verified views.
            </p>
          </motion.div>

          {/* Live stats */}
          {hasStats && (
            <motion.div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              {stats.activeCampaigns > 0 && (
                <div className="text-center">
                  <div className="text-[32px] md:text-[40px] font-bold text-white tracking-tight">{formatCount(stats.activeCampaigns)}</div>
                  <div className="text-[10px] text-white/30 mt-1 uppercase tracking-[0.15em] font-medium">Active campaigns</div>
                </div>
              )}
              {stats.creators > 0 && (
                <div className="text-center">
                  <div className="text-[32px] md:text-[40px] font-bold text-white tracking-tight">{formatCount(stats.creators)}</div>
                  <div className="text-[10px] text-white/30 mt-1 uppercase tracking-[0.15em] font-medium">Creators earning</div>
                </div>
              )}
              {stats.totalPaidCents > 0 && (
                <div className="text-center">
                  <div className="text-[32px] md:text-[40px] font-bold text-[#4338CA] tracking-tight">{formatMoney(stats.totalPaidCents)}</div>
                  <div className="text-[10px] text-white/30 mt-1 uppercase tracking-[0.15em] font-medium">Paid to creators</div>
                </div>
              )}
            </motion.div>
          )}

          {/* Primary CTA — one button */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Link href="/welcome-artists"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-[15px] font-bold text-white
                         transition-all duration-200 shadow-lg shadow-[#4338CA]/20
                         bg-gradient-to-b from-[#4338CA] to-[#3730A3]
                         hover:from-[#4F46E5] hover:to-[#4338CA]
                         active:scale-[0.97]">
              Promote your music <ArrowRight size={16} />
            </Link>
            <p className="text-[11px] text-white/20 mt-3">No upfront cost · Free to start</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="relative z-10 px-4 py-28 max-w-5xl mx-auto">
        <motion.div className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-semibold mb-5">How it works</p>
          <h2 className="text-4xl md:text-5xl font-heading tracking-tight mb-4">Three steps. Full control.</h2>
          <p className="text-white/35 max-w-md mx-auto text-sm">No complicated dashboards. No hidden fees.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10 md:gap-20">
          {/* For artists */}
          <motion.div className="space-y-6"
            initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white"
                style={{ background: 'linear-gradient(135deg, #4338CA, #6366F1)' }}>
                <Music4 size={20} />
              </div>
              <div>
                <h3 className="text-lg font-heading text-white/90">For artists</h3>
                <p className="text-[11px] text-white/25">Promote your music</p>
              </div>
            </div>
            {[
              { step: '01', title: 'Create your campaign', desc: 'Upload your track, set your rate and budget. Takes 2 minutes.' },
              { step: '02', title: 'Creators make content', desc: 'Vetted creators browse campaigns and submit videos with your music.' },
              { step: '03', title: 'Approve and pay', desc: 'Review every video. Only pay for verified views you approve.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="text-[10px] font-mono text-[#4338CA]/40 mt-1 shrink-0 group-hover:text-[#4338CA]/70 transition-colors">{s.step}</span>
                <div>
                  <h4 className="font-semibold text-sm text-white/70 mb-1">{s.title}</h4>
                  <p className="text-[12px] text-white/30 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
            <Link href="/welcome-artists"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#818CF8] hover:text-[#A5B4FC] transition-colors pt-3">
              Start as artist <ArrowRight size={13} />
            </Link>
          </motion.div>

          {/* For creators */}
          <motion.div className="space-y-6"
            initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-black"
                style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}>
                <Clapperboard size={20} />
              </div>
              <div>
                <h3 className="text-lg font-heading text-white/90">For creators</h3>
                <p className="text-[11px] text-white/25">Earn by making content</p>
              </div>
            </div>
            {[
              { step: '01', title: 'Browse campaigns', desc: 'Find tracks you love with budgets that match your style.' },
              { step: '02', title: 'Create and submit', desc: 'Make a TikTok, Reel, or Short. Paste the link and submit.' },
              { step: '03', title: 'Get paid per view', desc: 'Earn for every verified view. Transparent CPM rates, real-time tracking.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="text-[10px] font-mono text-[#22C55E]/40 mt-1 shrink-0 group-hover:text-[#22C55E]/70 transition-colors">{s.step}</span>
                <div>
                  <h4 className="font-semibold text-sm text-white/70 mb-1">{s.title}</h4>
                  <p className="text-[12px] text-white/30 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
            <Link href="/welcome-creators"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#22C55E]/70 hover:text-[#22C55E] transition-colors pt-3">
              Start as creator <ArrowRight size={13} />
            </Link>
          </motion.div>
        </div>

        {/* Trust bar */}
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-16"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}>
          {[
            { icon: BadgeCheck, label: 'Verified views' },
            { icon: Shield, label: 'You own everything' },
            { icon: Heart, label: 'Built by musicians' },
            { icon: DollarSign, label: 'Pay per view' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-white/[0.03] p-4 text-center backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.01)' }}>
              <item.icon size={16} className="mx-auto mb-2 text-white/15" />
              <p className="text-[10px] text-white/25 font-medium">{item.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════ FEATURED CAMPAIGNS ═══════════════ */}
      {featuredCampaigns.length > 0 && (
        <section className="relative z-10 px-4 py-28 max-w-6xl mx-auto">
          <motion.div className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-semibold mb-5">Live now</p>
            <h2 className="text-4xl md:text-5xl font-heading tracking-tight mb-4">Featured campaigns</h2>
            <p className="text-white/35 max-w-md mx-auto text-sm">Artists looking for creators right now.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCampaigns.slice(0, 6).map((campaign: any) => (
              <Link key={campaign.id} href={`/c/${campaign.id}`}
                className="group rounded-2xl border border-white/[0.04] p-5 backdrop-blur-sm
                           transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.01]
                           bg-gradient-to-b from-white/[0.015] to-transparent">
                {/* Cover art */}
                {campaign.cover_art_url && (
                  <div className="aspect-square rounded-lg overflow-hidden mb-4 bg-white/[0.02]">
                    <img src={campaign.cover_art_url} alt={campaign.title}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                  </div>
                )}

                <h3 className="font-semibold text-sm text-white/80 group-hover:text-white transition-colors mb-1">
                  {campaign.title || 'Untitled Campaign'}
                </h3>
                <p className="text-[11px] text-white/25 line-clamp-2 mb-3">
                  {campaign.description || campaign.track_name || ''}
                </p>

                {/* Stats footer */}
                <div className="flex items-center gap-4 text-[11px] text-white/25">
                  {campaign.budget_cents > 0 && (
                    <span className="flex items-center gap-1">
                      <DollarSign size={10} />
                      {formatMoney(campaign.budget_cents)}
                    </span>
                  )}
                  {campaign.approved_submissions > 0 && (
                    <span className="flex items-center gap-1">
                      <Check size={10} />
                      {campaign.approved_submissions} videos
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <motion.div className="text-center mt-10"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <Link href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-semibold
                         border border-white/[0.08] text-white/60 hover:text-white hover:border-white/[0.15]
                         transition-all duration-200">
              Browse all campaigns <ArrowRight size={14} />
            </Link>
          </motion.div>
        </section>
      )}

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative z-10 border-t border-white/[0.03] px-4 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/images/Selah Logo transparant no text.png" alt="Selah" className="h-6 w-auto" />
            <span className="text-[11px] text-white/20">Selah.fm — Open source music promotion</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/open-source" className="text-[11px] text-white/20 hover:text-white/50 transition-colors">GitHub</Link>
            <Link href="/privacy" className="text-[11px] text-white/20 hover:text-white/50 transition-colors">Privacy</Link>
            <Link href="/tos" className="text-[11px] text-white/20 hover:text-white/50 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
