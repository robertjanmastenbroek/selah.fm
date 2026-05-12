'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Music4, Clapperboard, Sparkles, Upload, Eye, DollarSign, BarChart3, BadgeCheck, Zap, Star, Shield, TrendingUp, ArrowRight } from 'lucide-react';

function formatCount(n: number): string {
  if (n >= 1000) return Math.floor(n / 100) / 10 + 'K';
  if (n >= 100) return Math.floor(n / 10) * 10 + '+';
  return n.toString();
}

function formatMoney(cents: number): string {
  return '$' + (cents / 100).toFixed(0);
}

export default function RootPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [stats, setStats] = useState({ artists: 0, creators: 0, totalPaidCents: 0, totalViews: 0, donors: 0 });
  const [featuredCampaigns, setFeaturedCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {});
    // Fetch featured/active campaigns
    fetch('/api/campaigns?limit=3&sort=popular').then(r => r.json()).then(d => {
      if (d.campaigns) setFeaturedCampaigns(d.campaigns.slice(0, 3));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 15, y: (e.clientY / window.innerHeight - 0.5) * 15 });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div className="relative overflow-hidden" style={{ background: '#0F0F23' }}>
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full opacity-20" animate={{ x: mousePos.x * -2, y: mousePos.y * -2 }} transition={{ type: 'spring', stiffness: 30, damping: 25 }} style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.3) 0%, transparent 70%)' }} />
        <motion.div className="absolute -bottom-1/3 -right-1/4 w-[600px] h-[600px] rounded-full opacity-15" animate={{ x: mousePos.x * 2, y: mousePos.y * 2 }} transition={{ type: 'spring', stiffness: 25, damping: 20 }} style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)' }} />
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.2) 0%, transparent 70%)' }} />
      </div>

      {/* ===== HERO — Search-focused marketplace entry ===== */}
      <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-4">
        {/* Sign in */}
        <motion.div className="absolute top-6 right-6 z-20" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
          <Link href="/login" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all active:scale-[0.97]">
            Sign in
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/></svg>
          </Link>
        </motion.div>

        <motion.div className="w-full max-w-2xl text-center space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          {/* Brand */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            <img src="/images/Selah Logo transparant no text.png" alt="Selah.fm" className="mx-auto h-14 w-auto mb-4" />
            <h1 className="text-4xl md:text-6xl font-heading tracking-tight">
              Music promotion,{' '}
              <span className="bg-gradient-to-r from-[#4338CA] via-[#5B7FFF] to-[#22C55E] bg-clip-text text-transparent">done right</span>
            </h1>
            <p className="text-muted-foreground text-lg mt-4 max-w-lg mx-auto leading-relaxed">
              Real creators make TikToks, Reels, and Shorts with your music. You approve every video before paying a cent.
            </p>
          </motion.div>

          {/* Trust stats */}
          {stats.artists > 0 && (
            <motion.div className="flex items-center justify-center gap-6 text-sm text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <span className="font-semibold text-foreground">{formatCount(stats.artists)}</span> artists
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="font-semibold text-foreground">{formatCount(stats.creators)}</span> creators
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span className="font-semibold text-foreground">{formatMoney(stats.totalPaidCents)}</span> paid
            </motion.div>
          )}

          {/* CTA buttons */}
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Link href="/welcome-artists" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white transition-all active:scale-[0.97] hover:shadow-[0_0_32px_rgba(67,56,202,0.35)]" style={{ background: 'linear-gradient(135deg, #4338CA, #5B7FFF)' }}>
              <Music4 size={20} />
              Promote your music
            </Link>
            <Link href="/browse" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-all active:scale-[0.97]">
              <Search size={20} />
              Browse campaigns
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div className="absolute bottom-8 text-muted-foreground/20" animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </motion.div>
      </section>

      {/* ===== FEATURED CAMPAIGNS — Live marketplace preview ===== */}
      {featuredCampaigns.length > 0 && (
        <section className="relative z-10 px-4 py-24 max-w-5xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-heading tracking-tight mb-3">Live campaigns</h2>
            <p className="text-muted-foreground">Creators are earning right now. Jump into a campaign and start creating.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCampaigns.map((c, i) => {
              const cpm = (c.cpm_rate_cents || 1000) / 100;
              const budget = (c.total_budget_cents || 10000) / 100;
              const remaining = (c.budget_remaining_cents || budget * 100) / 100;
              const pct = budget > 0 ? Math.min(((budget - remaining) / budget) * 100, 100) : 0;
              return (
                <Link key={c.id} href={`/c/${c.slug || c.id}`}>
                  <motion.div
                    className="group rounded-2xl border border-white/[0.06] overflow-hidden cursor-pointer transition-all hover:border-primary/20 hover:shadow-[0_0_40px_rgba(67,56,202,0.1)]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    {/* Cover */}
                    <div className="aspect-video bg-white/[0.02] overflow-hidden">
                      {c.cover_art_url ? (
                        <img src={c.cover_art_url} alt={c.track_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music4 size={32} className="text-muted-foreground/10" /></div>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      <h3 className="font-heading text-base leading-tight line-clamp-1">{c.track_title || c.title}</h3>
                      {c.artist_name && <p className="text-xs text-muted-foreground">{c.artist_name}</p>}
                      {/* Budget bar */}
                      <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #4338CA, #22C55E)', width: `${pct}%` }} initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">${cpm.toFixed(2)} CPM</span>
                        <span className="text-[#22C55E] font-semibold flex items-center gap-1"><TrendingUp size={12} /> Earn</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-8">
            <Link href="/browse" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4">
              View all campaigns <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative z-10 px-4 py-24 max-w-5xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-heading tracking-tight mb-3">How it works</h2>
          <p className="text-muted-foreground max-w-md mx-auto">A transparent marketplace connecting artists who need promotion with creators who make content.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Artist path */}
          <motion.div className="space-y-6" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #4338CA, #5B7FFF)' }}><Music4 size={20} /></div>
              <h3 className="text-xl font-heading">For artists</h3>
            </div>
            {[
              { icon: Upload, title: '1. Create campaign', desc: 'Upload your track, set your CPM rate and budget. You control everything.' },
              { icon: Eye, title: '2. Review submissions', desc: 'Creators submit their videos. You approve every one before paying a cent.' },
              { icon: BarChart3, title: '3. Track results', desc: 'Real-time views, spending, and engagement. Only pay for verified views.' },
            ].map((step, i) => {
              const I = step.icon;
              return (
                <motion.div key={step.title} className="flex gap-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0"><I size={18} className="text-primary/70" /></div>
                  <div><h4 className="font-semibold text-sm mb-1">{step.title}</h4><p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p></div>
                </motion.div>
              );
            })}
            <Link href="/welcome-artists" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4">
              Start as artist <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Creator path */}
          <motion.div className="space-y-6" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black" style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}><Clapperboard size={20} /></div>
              <h3 className="text-xl font-heading">For creators</h3>
            </div>
            {[
              { icon: Search, title: '1. Browse campaigns', desc: 'Find tracks you love with budgets that match your reach.' },
              { icon: Upload, title: '2. Create & submit', desc: 'Make a TikTok, Reel, or Short. Paste the link. Done in 30 seconds.' },
              { icon: DollarSign, title: '3. Get paid', desc: 'Earn per 1,000 verified views. Instant payout via Stripe. No minimum followers.' },
            ].map((step, i) => {
              const I = step.icon;
              return (
                <motion.div key={step.title} className="flex gap-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0"><I size={18} className="text-accent/70" /></div>
                  <div><h4 className="font-semibold text-sm mb-1">{step.title}</h4><p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p></div>
                </motion.div>
              );
            })}
            <Link href="/welcome-creators" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline underline-offset-4">
              Start as creator <ArrowRight size={14} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== TRUST — Social proof ===== */}
      <section className="relative z-10 px-4 py-24" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(67,56,202,0.08) 0%, transparent 70%)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-heading tracking-tight mb-3">Built for fairness</h2>
            <p className="text-muted-foreground max-w-md mx-auto">No scams. No fake views. No hidden fees.</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BadgeCheck, title: 'Verified views', desc: 'Only organic views count. No bots.' },
              { icon: Zap, title: 'Instant payout', desc: 'Stripe Connect. Fast and reliable.' },
              { icon: Shield, title: 'You own everything', desc: 'Your video, your music. Always.' },
              { icon: Star, title: stats.totalPaidCents > 0 ? formatMoney(stats.totalPaidCents) + ' paid' : 'Fair pricing', desc: stats.totalPaidCents > 0 ? 'To creators for real views.' : 'Set your own CPM. Pay only for approved content.' },
            ].map((item, i) => {
              const I = item.icon;
              return (
                <motion.div key={item.title} className="rounded-2xl border border-white/[0.04] p-6 text-center" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <I size={24} className="mx-auto mb-3 text-primary/60" />
                  <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="relative z-10 px-4 py-24">
        <motion.div className="max-w-lg mx-auto text-center space-y-6" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl font-heading tracking-tight">Ready to get started?</h2>
          <p className="text-muted-foreground">Join the marketplace connecting artists and creators.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/welcome-artists" className="px-8 py-4 rounded-xl font-semibold text-white transition-all active:scale-[0.97] hover:shadow-[0_0_32px_rgba(67,56,202,0.35)]" style={{ background: 'linear-gradient(135deg, #4338CA, #5B7FFF)' }}>
              Artist sign up
            </Link>
            <Link href="/welcome-creators" className="px-8 py-4 rounded-xl font-semibold transition-all active:scale-[0.97] border border-white/[0.08] hover:bg-white/[0.06]" style={{ color: '#22C55E' }}>
              Creator sign up
            </Link>
          </div>
          <div className="pt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
            <Link href="/browse" className="hover:text-muted-foreground transition-colors">Browse</Link>
            <span>·</span>
            <Link href="/faq" className="hover:text-muted-foreground transition-colors">FAQ</Link>
            <span>·</span>
            <a href="https://github.com/robertjanmastenbroek/selah.fm" target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground transition-colors">GitHub</a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
