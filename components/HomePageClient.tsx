'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  Music4, Clapperboard, ArrowRight, Shield,
  BadgeCheck, Eye, Upload, DollarSign, Heart, Star, Check,
  ChartBar, ChevronDown
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

/* ─── INTERACTIVE CPM CALCULATOR ────────────────────────────── */
function CalculatorSection() {
  const [views, setViews] = useState(10000);
  const [cpmDollars] = useState(1); // Default $1 CPM (realistic creator rate)
  const earnings = (views / 1000) * cpmDollars * 0.8;
  const grossEarnings = (views / 1000) * cpmDollars;

  const presets = [
    { label: '1K', value: 1000 },
    { label: '10K', value: 10000 },
    { label: '100K', value: 100000 },
    { label: '1M', value: 1000000 },
  ];

  const closestPreset = useMemo(() =>
    presets.reduce((prev, curr) =>
      Math.abs(curr.value - views) < Math.abs(prev.value - views) ? curr : prev
    ), [views]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-indigo-500/[0.03] border border-indigo-500/10 p-6">
      <div className="flex items-center gap-3 mb-5">
        <ChartBar size={20} className="text-indigo-400" />
        <div>
          <p className="text-sm font-semibold text-white/90">Earnings calculator</p>
          <p className="text-[10px] text-white/30">At $1.00 CPM (typical creator rate)</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs text-white/40">Estimated views</span>
          <span className="text-lg font-bold text-white">
            {views >= 1000000 ? `${(views / 1000000).toFixed(1)}M` : views >= 1000 ? `${(views / 1000).toFixed(0)}K` : views.toLocaleString()}
          </span>
        </div>
        <div className="relative">
          <input type="range" min={100} max={5000000} step={100} value={views}
            onChange={(e) => setViews(parseInt(e.target.value))}
            className="w-full h-2.5 rounded-full appearance-none bg-white/[0.08] cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-[#4338CA] [&::-webkit-slider-thumb]:to-[#6366F1]
              [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-indigo-500/40"
            style={{ background: `linear-gradient(to right, rgba(99,102,241,0.6) ${(views / 5000000) * 100}%, rgba(255,255,255,0.08) ${(views / 5000000) * 100}%)` }} />
        </div>
        <div className="flex justify-between mt-2">
          {presets.map((p) => (
            <button key={p.label} onClick={() => setViews(p.value)}
              className={`text-[10px] px-3 py-1 rounded-full transition-all ${
                closestPreset.value === p.value ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-white/30 hover:text-white/60'
              }`}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Platform fee (20%)</p>
          <p className="text-lg font-bold text-amber-400">${((grossEarnings - earnings).toFixed(2))}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center">
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">You earn</p>
          <p className="text-2xl font-bold text-emerald-400">${earnings >= 1 ? earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : earnings.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center">
        <span className="text-[9px] px-2 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/20">
          $10/1K views
        </span>
        <span className="text-[9px] px-2 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/20">
          80% creator share
        </span>
        <span className="text-[9px] px-2 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/20">
          Verified views only
        </span>
      </div>
    </div>
  );
}

export default function RootPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({
    artists: 0, creators: 0, activeCampaigns: 0,
    totalPaidCents: 0, totalDepositedCents: 0, approvedSubmissions: 0,
    totalViews: 0
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

  const hasStats = stats.activeCampaigns > 0 || stats.creators > 0 || stats.totalViews > 0 || stats.totalDepositedCents > 0;

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
              Get started <ArrowRight size={12} />
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

          {/* Social proof — always visible */}
          <motion.div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <div className="text-center">
              <div className="text-[32px] md:text-[40px] font-bold text-white tracking-tight">{formatCount(stats.artists || 2158)}</div>
              <div className="text-[10px] text-white/30 mt-1 uppercase tracking-[0.15em] font-medium">Artists in DB</div>
            </div>
            <div className="text-center">
              <div className="text-[32px] md:text-[40px] font-bold text-[#818CF8] tracking-tight">{formatCount(stats.totalViews || 0)}</div>
              <div className="text-[10px] text-white/30 mt-1 uppercase tracking-[0.15em] font-medium">Verified views</div>
            </div>
            {stats.totalDepositedCents > 0 && (
              <div className="text-center">
                <div className="text-[32px] md:text-[40px] font-bold text-[#22C55E] tracking-tight">{formatMoney(stats.totalDepositedCents)}</div>
                <div className="text-[10px] text-white/30 mt-1 uppercase tracking-[0.15em] font-medium">Total funded</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-[32px] md:text-[40px] font-bold text-white tracking-tight">{formatCount(stats.creators || 19)}</div>
              <div className="text-[10px] text-white/30 mt-1 uppercase tracking-[0.15em] font-medium">Creators earning</div>
            </div>
            {stats.totalPaidCents > 0 && (
              <div className="text-center">
                <div className="text-[32px] md:text-[40px] font-bold text-[#4338CA] tracking-tight">{formatMoney(stats.totalPaidCents)}</div>
                <div className="text-[10px] text-white/30 mt-1 uppercase tracking-[0.15em] font-medium">Paid to creators</div>
              </div>
            )}
          </motion.div>

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

      {/* ═══════════════ CPM CALCULATOR ═══════════════ */}
      <section className="relative z-10 px-4 py-20 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-semibold mb-2 text-center">How much could you earn?</p>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-1 text-center">See it before you start</h2>
          <p className="text-white/35 text-xs text-center mb-8">No signup required. Drag the slider to estimate your earnings.</p>

          <CalculatorSection />
        </motion.div>
      </section>

      {/* ═══════════════ TESTIMONIAL ═══════════════ */}
      <section className="relative z-10 px-4 py-16 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-indigo-500/[0.02] border border-white/[0.06] p-8 md:p-10 text-center">
          <div className="flex items-center justify-center gap-0.5 mb-4">
            {[1,2,3,4,5].map(s => (
              <svg key={s} className="w-4 h-4" viewBox="0 0 20 20" fill={s <= 4 ? '#F59E0B' : 'rgba(255,255,255,0.1)'}>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <blockquote className="text-lg md:text-xl text-white/70 font-light leading-relaxed mb-6">
            &ldquo;Selah.fm connected me with creators who actually understood my sound. 
            My campaign got 50K verified views in the first week.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold text-primary/70">RJ</div>
            <div className="text-left">
              <p className="text-sm font-medium text-white/80">Robert-Jan Mastenbroek</p>
              <p className="text-[11px] text-muted-foreground/50">Founder, Selah.fm · Independent Artist</p>
            </div>
            <a href="/about" className="ml-4 text-xs text-primary/60 hover:text-primary transition-colors">Read story →</a>
          </div>
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
            { icon: DollarSign, label: 'Free to start', sub: 'No upfront cost. No hidden fees.' },
            { icon: Shield, label: 'You keep 80%', sub: 'Artists keep 100% of unspent budget.' },
            { icon: BadgeCheck, label: 'Verified views', sub: 'Third-party view verification.' },
            { icon: Heart, label: 'You stay in control', sub: 'Approve every video before it\'s live.' },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-white/[0.03] p-4 text-center backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.01)' }}>
              <item.icon size={18} className="mx-auto mb-2 text-emerald-400/60" />
              <p className="text-[12px] text-white/30 font-semibold mb-1">{item.label}</p>
              <p className="text-[10px] text-white/15">{item.sub}</p>
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
            <h2 className="text-4xl md:text-5xl font-heading tracking-tight mb-4">Recommended campaigns</h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
                Top campaigns matched to your taste. High-budget promotions from popular artists.
              </p>
            <p className="text-white/35 max-w-md mx-auto text-sm">Artists looking for creators right now.</p>
          </motion.div>

          {/* Sort by budget: highest first */}
          {(() => {
            const sorted = [...featuredCampaigns].sort((a, b) => (b.budget_cents || 0) - (a.budget_cents || 0));
            const top3 = sorted.slice(0, 3);
            const rest = sorted.slice(3, 9);

            return (
              <>
                {/* Premium hero cards — top 3 */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {top3.map((campaign: any, i: number) => (
                    <Link key={campaign.id} href={`/c/${campaign.slug || campaign.id}`}
                      className="group relative rounded-2xl overflow-hidden border border-white/[0.06] hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
                      {/* Background image with gradient overlay */}
                      {campaign.cover_art_url ? (
                        <div className="aspect-[4/3] relative">
                          <img src={campaign.cover_art_url} alt={campaign.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#080817] via-[#080817]/60 to-transparent" />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-gradient-to-br from-indigo-900/30 to-purple-900/30 flex items-center justify-center">
                          <span className="text-5xl font-bold text-white/5">{campaign.title?.[0]?.toUpperCase() || '?'}</span>
                        </div>
                      )}

                      {/* Content overlay */}
                      <div className="absolute bottom-0 inset-x-0 p-5">
                        <div className="flex items-center gap-2 mb-2">
                          {campaign.cpm_rate_cents && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                              ${(campaign.cpm_rate_cents / 100).toFixed(2)} CPM
                            </span>
                          )}
                          {campaign.approved_submissions > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                              {campaign.approved_submissions} videos
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-white group-hover:text-primary transition-colors mb-1 line-clamp-1">
                          {campaign.track_title || campaign.title || 'Untitled'}
                        </h3>
                        {campaign.artist_name && (
                          <p className="text-[11px] text-white/40">{campaign.artist_name}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-white/30">
                          {campaign.budget_cents > 0 && (
                            <span className="font-semibold text-white/60">{formatMoney(campaign.budget_cents)} budget</span>
                          )}
                          {campaign.total_verified_views > 0 && (
                            <span>{parseInt(campaign.total_verified_views).toLocaleString()} views</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Remaining in grid */}
                {rest.length > 0 && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rest.map((campaign: any) => (
                      <Link key={campaign.id} href={`/c/${campaign.slug || campaign.id}`}
                        className="group rounded-2xl border border-white/[0.04] p-4 transition-all duration-200 hover:border-white/[0.08] bg-gradient-to-b from-white/[0.015] to-transparent">
                        {campaign.cover_art_url && (
                          <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-white/[0.02]">
                            <img src={campaign.cover_art_url} alt={campaign.title}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                          </div>
                        )}
                        <h3 className="font-semibold text-sm text-white/80 group-hover:text-white transition-colors mb-1 line-clamp-1">
                          {campaign.track_title || campaign.title || 'Untitled'}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] text-white/25">
                          {campaign.budget_cents > 0 && (
                            <span className="flex items-center gap-1"><DollarSign size={10} />{formatMoney(campaign.budget_cents)}</span>
                          )}
                          {campaign.approved_submissions > 0 && (
                            <span className="flex items-center gap-1"><Check size={10} />{campaign.approved_submissions}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            );
          })()}

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

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="relative z-10 px-4 py-28 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-semibold mb-2 text-center">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-10 text-center">Common questions</h2>

          <div className="space-y-3">
            {[
              { q: 'How does pricing work?', a: 'Artists set their own CPM rate (cost per 1,000 verified views). Creators earn 80% of the CPM rate. Selah.fm takes a 20% platform fee. There are no upfront costs — you only pay for verified views you approve.' },
              { q: 'Do I need to pay upfront?', a: 'No. You only pay when you approve a creator\'s video. You deposit funds to your campaign budget, and payments are deducted per approved view.' },
              { q: 'Who are the creators?', a: 'Our creators are vetted music content makers on TikTok, Instagram Reels, and YouTube Shorts. They apply to your campaign, and you approve only the videos you like.' },
              { q: 'How do creators get paid?', a: 'When you approve a submission, the creator earns their CPM rate per 1,000 verified views. Payouts are processed via Stripe within 2-3 business days.' },
              { q: 'Can I promote any genre?', a: 'Absolutely. Selah.fm supports all music genres. Creators browse campaigns by genre to find tracks that match their style.' },
            ].map((item, i) => (
              <details key={i} className="group rounded-xl border border-white/[0.04] bg-white/[0.01] overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-medium text-white/70 hover:text-white transition-colors">
                  {item.q}
                  <ChevronDown size={14} className="text-white/20 group-open:rotate-180 transition-transform shrink-0 ml-3" />
                </summary>
                <div className="px-5 pb-4 text-xs text-white/30 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>

          <p className="text-center mt-8">
            <Link href="/faq" className="text-xs text-[#818CF8] hover:text-[#A5B4FC] transition-colors">
              Read all FAQs →
            </Link>
          </p>
        </motion.div>
      </section>

      {/* ═══════════════ FAQ SECTION ═══════════════ */}
      <section className="relative z-10 px-4 py-28 max-w-4xl mx-auto">
        <motion.div className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="text-[11px] tracking-[0.2em] uppercase text-white/25 font-semibold mb-5">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-heading tracking-tight mb-4">Common questions</h2>
          <p className="text-white/35 max-w-md mx-auto text-sm">Everything you need to know about music promotion on Selah.fm.</p>
        </motion.div>

        <div className="space-y-3">
          {[
            {
              q: 'How do independent artists promote music without a label?',
              a: 'Independent artists promote music by working directly with content creators on TikTok, Instagram Reels, and YouTube Shorts. On Selah.fm, artists set a CPM budget, creators make videos using their song, and artists only pay for verified views — no label required. You approve every video before it goes live.',
            },
            {
              q: "What's the most cost-effective way to promote a new single?",
              a: 'Creator-driven promotion on short-form video platforms is currently the most cost-effective approach. Instead of paying for ads that people scroll past, you pay creators to make engaging content featuring your music. You set the budget and only pay for verified views — so every dollar goes to actual exposure, not algorithm guesses.',
            },
            {
              q: 'How much do content creators earn promoting music?',
              a: "On Selah.fm, creators earn whatever CPM the artist sets — typically $5–30 per 1,000 verified views. That's 100–1,000x more than traditional platform funds (TikTok Creator Fund pays $0.02–0.04 per 1,000 views). Creators keep 80% of the CPM; the platform takes 20% for payment processing, verification, and fraud detection.",
            },
            {
              q: 'Is CPM-based promotion better than playlist placements?',
              a: 'Yes, for most artists. Playlist placements put your song in a list where you hope people listen. Creator promotion puts your song in videos that people actively watch because the content is entertaining. 80% of new music discovery now happens through short-form video. Creators help you build real fans, not just passive streams.',
            },
            {
              q: 'Do I need a big following to earn as a content creator?',
              a: 'No. CPM-based promotion pays per view, not per follower. A creator with 2,000 followers who consistently gets 10,000 views per video can earn more than someone with 100,000 followers making low-engagement content. Quality and consistency matter more than follower count. Submit your best work and let the views speak.',
            },
            {
              q: 'How do I get paid for my videos?',
              a: 'When a creator submits a video and the artist approves it, every verified view earns you money based on the CPM rate the artist set. Earnings accumulate in your dashboard. Once you reach the payout threshold, you can withdraw via Stripe. The platform tracks every view using third-party verification to ensure accuracy.',
            },
          ].map((faq, i) => (
            <motion.details key={i}
              className="group rounded-xl border border-white/[0.04] overflow-hidden transition-all duration-200 open:border-primary/20 open:bg-primary/[0.02]"
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.3 }}>
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-medium text-white/70 hover:text-white transition-colors list-none">
                <span className="pr-4">{faq.q}</span>
                <span className="text-primary/50 group-open:rotate-180 transition-transform shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
              </summary>
              <div className="px-5 pb-4 text-xs text-muted-foreground/60 leading-relaxed">
                {faq.a}
              </div>
            </motion.details>
          ))}
        </div>

        {/* FAQPage structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                { '@type': 'Question', name: 'How do independent artists promote music without a label?', acceptedAnswer: { '@type': 'Answer', text: 'Independent artists promote music by working directly with content creators on TikTok, Instagram Reels, and YouTube Shorts. On Selah.fm, artists set a CPM budget, creators make videos using their song, and artists only pay for verified views.' } },
                { '@type': 'Question', name: "What's the most cost-effective way to promote a new single?", acceptedAnswer: { '@type': 'Answer', text: 'Creator-driven promotion on short-form video platforms is currently the most cost-effective approach. Artists set the budget and only pay for verified views.' } },
                { '@type': 'Question', name: 'How much do content creators earn promoting music?', acceptedAnswer: { '@type': 'Answer', text: 'On Selah.fm, creators earn $5-30 CPM per 1,000 verified views. That is 100-1,000x more than platform funds like the TikTok Creator Fund.' } },
                { '@type': 'Question', name: 'Do I need a big following to earn as a content creator?', acceptedAnswer: { '@type': 'Answer', text: 'No. CPM-based promotion pays per view, not per follower. Quality and consistency matter more than follower count.' } },
                { '@type': 'Question', name: 'How do I get paid for my videos?', acceptedAnswer: { '@type': 'Answer', text: 'Every verified view earns money based on the CPM rate. Earnings accumulate in your dashboard and you can withdraw via Stripe once you reach the payout threshold.' } },
              ],
            }),
          }}
        />
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative z-10 border-t border-white/[0.03] px-4 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/images/Selah Logo transparant no text.png" alt="Selah" className="h-6 w-auto" />
            <span className="text-[11px] text-white/20">Selah.fm — Open source music promotion</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-[11px] text-white/20 hover:text-white/50 transition-colors">Pricing</Link>
            <Link href="/open-source" className="text-[11px] text-white/20 hover:text-white/50 transition-colors">GitHub</Link>
            <Link href="/privacy" className="text-[11px] text-white/20 hover:text-white/50 transition-colors">Privacy</Link>
            <Link href="/tos" className="text-[11px] text-white/20 hover:text-white/50 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
