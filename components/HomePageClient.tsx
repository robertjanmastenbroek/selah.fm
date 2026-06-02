'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Search, Music4, Clapperboard, ArrowRight, X, Check, Star, TrendingUp, Shield, BadgeCheck, Sparkles, MessageCircle, BarChart3, Eye, Upload, DollarSign, Heart, Globe } from 'lucide-react';

function formatCount(n: number): string {
  if (n >= 1000) return Math.floor(n / 100) / 10 + 'K';
  if (n >= 100) return Math.floor(n / 10) * 10 + '+';
  return n.toString();
}

function formatMoney(cents: number): string {
  if (cents >= 100) return '$' + (cents / 100).toFixed(0);
  return '$' + (cents / 100).toFixed(0);
}

export default function RootPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({ artists: 0, creators: 0, activeCampaigns: 0, totalPaidCents: 0, totalViews: 0, donors: 0, totalDonatedCents: 0, totalDepositedCents: 0, approvedSubmissions: 0, processingCents: 0 });
  const [featuredCampaigns, setFeaturedCampaigns] = useState<any[]>([]);
  const [totalActive, setTotalActive] = useState(0);
  const [user, setUser] = useState<{ email?: string; avatar?: string; name?: string } | null>(null);

  // Check auth state on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        const u = data.session.user;
        setUser({ email: u.email, avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture, name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) {
        const u = s.user;
        setUser({ email: u.email, avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture, name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0] });
      } else { setUser(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch stats
    fetch('/api/stats').then(r => r.json()).then(d => {
      setStats(d);
      setTotalActive(d.activeCampaigns || 0);
    }).catch(() => {});
    // Fetch featured campaigns for the grid (stats API handles the count)
    fetch('/api/campaigns?limit=6&sort=recent').then(r => r.json()).then(d => {
      if (Array.isArray(d.campaigns) && d.campaigns.length > 0) {
        setFeaturedCampaigns(d.campaigns);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 15, y: (e.clientY / window.innerHeight - 0.5) * 15 });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const hasStats = stats.activeCampaigns > 0 || stats.creators > 0;

  return (
    <div className="relative overflow-hidden" style={{ background: '#080817' }}>
      {/* Grain texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")', backgroundSize: '256px 256px' }} />

      {/* Ambient light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute -top-1/3 -left-1/4 w-[900px] h-[900px] rounded-full opacity-25" animate={{ x: mousePos.x * -2, y: mousePos.y * -2 }} transition={{ type: 'spring', stiffness: 25, damping: 20 }} style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.35) 0%, rgba(99,102,241,0.15) 35%, transparent 70%)' }} />
        <motion.div className="absolute top-1/3 -right-1/4 w-[700px] h-[700px] rounded-full opacity-15" animate={{ x: mousePos.x * 2, y: mousePos.y * 2 }} transition={{ type: 'spring', stiffness: 20, damping: 18 }} style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.2) 0%, transparent 70%)' }} />
      </div>

      {/* ════════════ HERO ════════════ */}
      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Auth: profile icon or sign in */}
        <motion.div className="absolute top-6 right-6 z-20" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
          <Link href="/login" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all duration-200">
            Sign in <ArrowRight size={12} />
          </Link>
          )}
        </motion.div>

        <motion.div className="w-full max-w-3xl text-center space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }}>
          <motion.div className="space-y-7" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}>
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

            <p className="text-white/30 text-sm max-w-md mx-auto">
              No bots. No black-box ads. No monthly retainers. Just real content from real people.
            </p>
          </motion.div>

          {/* Live stats */}
          {hasStats && (
            <motion.div className="flex items-center justify-center gap-8 flex-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              {totalActive > 0 && (
                <div className="text-center">
                  <div className="text-[32px] md:text-[40px] font-bold text-white tracking-tight">{formatCount(totalActive)}</div>
                  <div className="text-[10px] text-white/30 mt-1 uppercase tracking-[0.15em] font-medium">Active campaigns</div>
                </div>
              )}
              {stats.creators > 0 && (
                <div className="text-center">
                  <div className="text-[32px] md:text-[40px] font-bold text-white tracking-tight">{formatCount(stats.creators)}</div>
                  <div className="text-[10px] text-white/30 mt-1 uppercase tracking-[0.15em] font-medium">Creators earning</div>
                </div>
              )}
              {stats.totalDepositedCents > 0 && (
                <div className="text-center">
                  <div className="text-[32px] md:text-[40px] font-bold text-[#22C55E] tracking-tight">{formatMoney(stats.totalDepositedCents)}</div>
                  <div className="text-[10px] text-white/30 mt-1 uppercase tracking-[0.15em] font-medium">Funded by artists</div>
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

          {/* CTAs */}
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Link href="/welcome-artists" onClick={() => { fetch('/api/analytics/event', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ event: 'cta_click', path: window.location.pathname, metadata: { cta: 'promote_artist' } }) }).catch(()=>{}); }} className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-base text-white transition-all duration-300 active:scale-[0.97] hover:shadow-[0_0_48px_rgba(67,56,202,0.35)] hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)' }}>
              <Music4 size={20} />
              Promote your music
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/welcome-creators" onClick={() => { fetch('/api/analytics/event', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ event: 'cta_click', path: window.location.pathname, metadata: { cta: 'earn_creator' } }) }).catch(()=>{}); }} className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300 active:scale-[0.97] border border-[#22C55E]/25 hover:bg-[#22C55E]/8 hover:border-[#22C55E]/40 hover:-translate-y-0.5" style={{ color: '#22C55E' }}>
              <Clapperboard size={20} />
              Earn as a creator
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.p className="text-[12px] text-white/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            Free to start. No credit card required.
          </motion.p>
        </motion.div>

        {/* Scroll */}
        <motion.div className="absolute bottom-8 text-white/10" animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </motion.div>
      </section>

      {/* ════════════ FEATURED CAMPAIGNS ════════════ */}
      {featuredCampaigns.length > 0 && (
        <section className="relative z-10 px-4 py-32 max-w-6xl mx-auto">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-semibold mb-5">Live marketplace</p>
            <h2 className="text-4xl md:text-5xl font-heading tracking-tight mb-4">
              {totalActive > 0 ? formatCount(totalActive) : featuredCampaigns.length} active campaign{totalActive !== 1 ? 's' : ''}
            </h2>
            <p className="text-white/35 max-w-lg mx-auto text-sm">
              Creators are earning real money right now. Pick a track, make a video, and get paid per view.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCampaigns.map((c, i) => {
              const cpm = (c.cpm_rate_cents || 10) / 100;
              const budget = (c.total_budget_cents || 0) / 100;
              const remaining = (c.budget_remaining_cents || 0) / 100;
              const pct = budget > 0 ? Math.min(((budget - remaining) / budget) * 100, 100) : 0;
              return (
                <Link key={c.id} href={`/c/${c.slug || c.id}`} className="h-full">
                  <motion.div
                    className="h-full flex flex-col group rounded-2xl border border-white/[0.05] overflow-hidden cursor-pointer transition-all duration-300 hover:border-white/[0.12] hover:shadow-[0_0_60px_rgba(67,56,202,0.08)] hover:-translate-y-1"
                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0.005) 100%)' }}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.5 }}>
                    <div className="aspect-square overflow-hidden relative shrink-0">
                      {c.cover_art_url ? (
                        <img src={c.cover_art_url} alt={c.track_title || c.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/[0.02]"><Music4 size={40} className="text-white/[0.06]" /></div>
                      )}
                      {/* Overlay badges */}
                      <div className="absolute inset-x-0 top-0 p-3 flex justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-[10px] font-semibold text-[#22C55E] border border-white/[0.04]">
                          ${(cpm * 1000).toFixed(0)} <span className="text-white/40 font-normal">/1M views</span>
                        </span>
                        {budget > 0 && (
                          <span className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-md text-[10px] font-medium text-white/70 border border-white/[0.04]">
                            ${budget.toFixed(0)} budget
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between p-4">
                      <div>
                        {c.artist_name && <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-1 line-clamp-1">{c.artist_name}</p>}
                        <h3 className="font-heading text-[14px] leading-snug line-clamp-2 min-h-[2.5rem] text-white/85 group-hover:text-white transition-colors">{c.track_title || c.title}</h3>
                      </div>
                      <div>
                        {budget > 0 && (
                          <div className="w-full h-[3px] rounded-full bg-white/[0.04] overflow-hidden mb-3">
                            <div className="h-full rounded-full transition-all duration-700" style={{ background: 'linear-gradient(90deg, #4338CA, #22C55E)', width: `${pct}%` }} />
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/25 flex items-center gap-1"><TrendingUp size={10} /> Earn per view</span>
                          <span className="text-[10px] text-[#22C55E]/80 font-medium">Submit video →</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link href="/browse" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.04] hover:border-white/[0.10] transition-all duration-200">
              View all campaigns <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* ════════════ PROBLEM / SOLUTION ════════════ */}
      <section className="relative z-10 px-4 py-32 max-w-5xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-semibold mb-5">Why artists switch</p>
          <h2 className="text-4xl md:text-5xl font-heading tracking-tight mb-4">You're probably overpaying for promotion.</h2>
          <p className="text-white/35 max-w-lg mx-auto text-sm">Here's the ugly truth about traditional music promotion — and why Selah.fm is different.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          <motion.div className="rounded-2xl border border-red-500/[0.08] p-8 md:p-10 backdrop-blur-sm" style={{ background: 'linear-gradient(180deg, rgba(239,68,68,0.025) 0%, transparent 100%)' }} initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="text-[10px] tracking-[0.2em] uppercase text-red-400/60 font-semibold mb-8">The old way</p>
            <div className="space-y-5">
              {[
                { title: 'Playlist bots', desc: 'Thousands of fake streams. Zero real listeners. Zero fans.' },
                { title: 'Meta & TikTok ads', desc: 'Throw money at ad managers with no guarantee of results. Pay per impression, not per view.' },
                { title: 'PR firms & retainers', desc: '$2,000/month retainers. No tracking. No verification. Just hope.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-red-500/[0.08] flex items-center justify-center shrink-0 mt-0"><X size={10} className="text-red-400/50" /></div>
                  <div><p className="text-sm font-medium text-white/50">{item.title}</p><p className="text-[12px] text-white/25 mt-1 leading-relaxed">{item.desc}</p></div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="rounded-2xl border border-[#22C55E]/[0.08] p-8 md:p-10 backdrop-blur-sm" style={{ background: 'linear-gradient(180deg, rgba(34,197,94,0.025) 0%, transparent 100%)' }} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#22C55E]/60 font-semibold mb-8">The Selah way</p>
            <div className="space-y-5">
              {[
                { title: 'Real creator videos', desc: 'Vetted creators make TikToks, Reels, and Shorts. Real people, real content.' },
                { title: 'You approve everything', desc: 'Review every video before a single cent leaves your account.' },
                { title: 'Pay per verified view', desc: 'Only pay when real people watch. No bots. Track everything in real-time.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3.5">
                  <div className="w-5 h-5 rounded-full bg-[#22C55E]/[0.08] flex items-center justify-center shrink-0 mt-0"><Check size={10} className="text-[#22C55E]/60" /></div>
                  <div><p className="text-sm font-medium text-white/70">{item.title}</p><p className="text-[12px] text-white/25 mt-1 leading-relaxed">{item.desc}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════ WHAT'S POSSIBLE ════════════ */}
      <section className="relative z-10 px-4 py-32" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(67,56,202,0.06) 0%, transparent 70%)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-semibold mb-5">What's possible</p>
            <h2 className="text-4xl md:text-5xl font-heading tracking-tight mb-4">Real math. Real results.</h2>
            <p className="text-white/35 max-w-md mx-auto text-sm">No hype. Just what you can actually earn when you promote music with real creators on Selah.fm.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Example', scenario: 'Artist campaign', budget: '$100', cpm: '$5,000/1M', math: '= 20,000 verified views', desc: 'Deposit $100, set a $5,000/1M CPM rate. Creators submit videos. You approve the best ones. Your track gets 20,000 real views from real people — not bots.', icon: Music4, color: '#4338CA' },
              { label: 'Example', scenario: 'Creator earnings', budget: '3 videos', cpm: '$10,000/1M CPM', math: '= up to $300', desc: 'Make 3 TikToks or Reels for a campaign. At a $10,000/1M CPM rate, every 10,000 views earns you $100. Post your best content and earn per view.', icon: Clapperboard, color: '#22C55E' },
              { label: 'Example', scenario: 'Fan support', budget: '$250 donated', cpm: 'crowdfunded', math: '= 50,000 views', desc: 'Fans chip in to fund your promotion budget. Share your campaign link. Every dollar donated goes directly to creator payouts — 0% platform cut on donations.', icon: Heart, color: '#EF4444' },
            ].map((t, i) => (
              <motion.div key={i} className="rounded-2xl border border-white/[0.04] p-6 backdrop-blur-sm" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.015) 0%, transparent 100%)' }} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}>
                <div className="flex items-center gap-2 mb-4">
                  <t.icon size={14} style={{ color: t.color, opacity: 0.6 }} />
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-white/20">{t.label}</span>
                </div>
                <p className="text-[13px] font-semibold text-white/70 mb-3">{t.scenario}</p>
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/25">Budget</span>
                    <span className="font-semibold text-white/60">{t.budget}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/25">Rate</span>
                    <span className="font-semibold text-white/60">{t.cpm}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-white/25">Result</span>
                    <span className="font-semibold" style={{ color: t.color }}>{t.math}</span>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-white/30">{t.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Trust pillars */}
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}>
            {[
              { icon: BadgeCheck, label: 'Verified views' },
              { icon: Shield, label: 'You own everything' },
              { icon: Globe, label: 'Open source' },
              { icon: Heart, label: 'Built by musicians' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-white/[0.03] p-4 text-center backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.01)' }}>
                <item.icon size={16} className="mx-auto mb-2 text-white/15" />
                <p className="text-[10px] text-white/25 font-medium">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section className="relative z-10 px-4 py-32 max-w-5xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-semibold mb-5">How it works</p>
          <h2 className="text-4xl md:text-5xl font-heading tracking-tight mb-4">Three steps. Full control.</h2>
          <p className="text-white/35 max-w-md mx-auto text-sm">No complicated dashboards. No hidden fees. Just a simple marketplace.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10 md:gap-20">
          {/* Artists */}
          <motion.div className="space-y-6" initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #4338CA, #6366F1)' }}><Music4 size={20} /></div>
              <div><h3 className="text-lg font-heading text-white/90">For artists</h3><p className="text-[11px] text-white/25">Promote your music</p></div>
            </div>
            {[
              { step: '01', title: 'Create your campaign', desc: 'Upload your track, set your rate and budget. Takes 2 minutes.' },
              { step: '02', title: 'Creators make content', desc: 'Vetted creators browse campaigns and submit videos with your music.' },
              { step: '03', title: 'Approve and pay', desc: 'Review every video. Only pay for verified views you approve.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="text-[10px] font-mono text-[#4338CA]/40 mt-1 shrink-0 group-hover:text-[#4338CA]/70 transition-colors">{s.step}</span>
                <div><h4 className="font-semibold text-sm text-white/70 mb-1">{s.title}</h4><p className="text-[12px] text-white/30 leading-relaxed">{s.desc}</p></div>
              </div>
            ))}
            <Link href="/welcome-artists" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#818CF8] hover:text-[#A5B4FC] transition-colors pt-3">Start as artist <ArrowRight size={13} /></Link>
          </motion.div>

          {/* Creators */}
          <motion.div className="space-y-6" initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-black" style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}><Clapperboard size={20} /></div>
              <div><h3 className="text-lg font-heading text-white/90">For creators</h3><p className="text-[11px] text-white/25">Earn by making content</p></div>
            </div>
            {[
              { step: '01', title: 'Browse campaigns', desc: 'Find tracks you love with budgets that match your style.' },
              { step: '02', title: 'Create and submit', desc: 'Make a TikTok, Reel, or Short. Paste the link. Done in 30 seconds.' },
              { step: '03', title: 'Get paid', desc: 'Earn per 1,000 verified views. Instant payout via Stripe.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="text-[10px] font-mono text-[#22C55E]/40 mt-1 shrink-0 group-hover:text-[#22C55E]/70 transition-colors">{s.step}</span>
                <div><h4 className="font-semibold text-sm text-white/70 mb-1">{s.title}</h4><p className="text-[12px] text-white/30 leading-relaxed">{s.desc}</p></div>
              </div>
            ))}
            <Link href="/welcome-creators" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#22C55E] hover:text-[#4ADE80] transition-colors pt-3">Start as creator <ArrowRight size={13} /></Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════ FOUNDER ════════════ */}
      <section className="relative z-10 px-4 py-32 max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.04] mx-auto flex items-center justify-center">
            <MessageCircle size={24} className="text-white/15" />
          </div>
          <h2 className="text-2xl md:text-3xl font-heading tracking-tight text-white/80">Built by a musician who walked away from a record deal.</h2>
          <p className="text-white/35 max-w-xl mx-auto leading-relaxed text-sm font-light">
            I'm Robert-Jan. Got signed young, watched labels take 98% of royalties. Built a €6M crowdfunding platform, lost everything, lived in a campervan busking on Tenerife beaches. Now I build tools so artists don't need gatekeepers. Selah.fm is open source, transparent, and built on one belief: <span className="text-white/60">you should own your promotion.</span>
          </p>
          <p className="text-[11px] text-white/20">— Robert-Jan Mastenbroek, founder</p>
        </motion.div>
      </section>

      {/* ════════════ FAQ MINI ════════════ */}
      <section className="relative z-10 px-4 py-32 max-w-2xl mx-auto">
        <motion.div className="text-center mb-14" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-semibold mb-5">Common questions</p>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight">You're probably wondering…</h2>
        </motion.div>
        <div className="space-y-2.5">
          {[
            { q: 'Is this legit? How are views verified?', a: 'Yes. We verify views through each platform\'s public view counts. Creators connect their real TikTok, Instagram, or YouTube accounts. We cross-check automatically.' },
            { q: 'What if I don\'t like a video?', a: 'You approve every video before it goes live. Reject it — costs you nothing. You only pay for approved videos after they get verified views.' },
            { q: 'How much does it cost?', a: 'Nothing upfront. You set a CPM rate (e.g. $10,000 per 1M views) and a budget. Creators earn the full CPM. We add a 20% platform fee (your cost = CPM × 1.20). Stripe fees are separate.' },
          ].map((faq, i) => (
            <motion.div key={i} className="rounded-xl border border-white/[0.04] p-5 backdrop-blur-sm" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.01) 0%, transparent 100%)' }} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}>
              <h4 className="font-semibold text-sm text-white/70 mb-2">{faq.q}</h4>
              <p className="text-[12px] text-white/30 leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-7">
          <Link href="/faq" className="text-[12px] text-white/20 hover:text-white/40 transition-colors">See all FAQs →</Link>
        </div>
      </section>

      {/* ════════════ FINAL CTA ════════════ */}
      <section className="relative z-10 px-4 py-32">
        <motion.div className="max-w-lg mx-auto text-center space-y-9" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading tracking-tight">
            Stop paying for <span className="text-red-400/60">bots</span>.<br />
            Start paying for <span className="bg-gradient-to-r from-[#22C55E] to-[#4ADE80] bg-clip-text text-transparent">real views</span>.
          </h2>
          <p className="text-white/35 text-sm leading-relaxed">Join artists who finally know where every dollar goes. Real creators. Real views. Real results. Free to start.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/welcome-artists" className="px-8 py-4 rounded-2xl font-semibold text-base text-white transition-all duration-300 active:scale-[0.97] hover:shadow-[0_0_48px_rgba(67,56,202,0.35)] hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #4338CA, #6366F1)' }}>
              Start my campaign
            </Link>
            <Link href="/browse" className="px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300 active:scale-[0.97] bg-white/[0.02] border border-white/[0.06] text-white/60 hover:bg-white/[0.04] hover:text-white hover:border-white/[0.10]">
              Browse campaigns
            </Link>
          </div>
          <p className="text-[11px] text-white/15">Free to start. No credit card required. Open source.</p>
          <div className="pt-6 flex items-center justify-center gap-4 text-[11px] text-white/15">
            <Link href="/faq" className="hover:text-white/30 transition-colors">FAQ</Link>
            <span className="text-white/10">·</span>
            <Link href="/blog" className="hover:text-white/30 transition-colors">Blog</Link>
            <span className="text-white/10">·</span>
            <a href="https://github.com/robertjanmastenbroek/selah.fm" target="_blank" rel="noopener noreferrer" className="hover:text-white/30 transition-colors inline-flex items-center gap-1"><Globe size={10} /> Open source</a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}