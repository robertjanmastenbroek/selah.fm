'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Music4, Clapperboard, Upload, Eye, DollarSign, BarChart3, BadgeCheck, Zap, Star, Shield, TrendingUp, ArrowRight, X, Check, MessageCircle } from 'lucide-react';

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
  const [stats, setStats] = useState({ artists: 0, creators: 0, activeCampaigns: 0, totalPaidCents: 0, totalViews: 0, donors: 0, totalDonatedCents: 0, totalDepositedCents: 0 });
  const [featuredCampaigns, setFeaturedCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d)).catch(() => {});
    fetch('/api/campaigns?limit=6&sort=recent').then(r => r.json()).then(d => {
      if (d.campaigns) setFeaturedCampaigns(d.campaigns.slice(0, 6));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 15, y: (e.clientY / window.innerHeight - 0.5) * 15 });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const hasAnyStats = stats.activeCampaigns > 0 || stats.artists > 0 || stats.creators > 0 || (stats.totalDonatedCents || 0) + (stats.totalDepositedCents || 0) > 0 || stats.totalPaidCents > 0;

  return (
    <div className="relative overflow-hidden" style={{ background: '#0F0F23' }}>
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] rounded-full opacity-20" animate={{ x: mousePos.x * -2, y: mousePos.y * -2 }} transition={{ type: 'spring', stiffness: 30, damping: 25 }} style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.3) 0%, transparent 70%)' }} />
        <motion.div className="absolute -bottom-1/3 -right-1/4 w-[600px] h-[600px] rounded-full opacity-15" animate={{ x: mousePos.x * 2, y: mousePos.y * 2 }} transition={{ type: 'spring', stiffness: 25, damping: 20 }} style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 70%)' }} />
      </div>

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative z-10 min-h-[95vh] flex flex-col items-center justify-center px-4">
        <motion.div className="absolute top-6 right-6 z-20" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Link href="/login" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all">
            Sign in <ArrowRight size={14} />
          </Link>
        </motion.div>

        <motion.div className="w-full max-w-3xl text-center space-y-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          {/* Headline */}
          <motion.div className="space-y-6" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <img src="/images/Selah Logo transparant no text.png" alt="Selah.fm" className="mx-auto h-12 w-auto mb-2" />
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading tracking-tight leading-[1.05]">
              Get your music on <span className="bg-gradient-to-r from-[#4338CA] via-[#6366F1] to-[#22C55E] bg-clip-text text-transparent">TikTok, Reels & Shorts</span> — pay only for real views
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
              Real creators make content with your track. You approve every video. You set the budget. You only pay for verified views. No bots. No black-box ads. No monthly retainers.
            </p>
          </motion.div>

          {/* Trust badges */}
          {hasAnyStats && (
            <motion.div className="flex items-center justify-center gap-6 md:gap-8 flex-wrap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              {stats.activeCampaigns > 0 && (
                <div className="text-center"><div className="text-2xl md:text-3xl font-bold text-foreground">{formatCount(stats.activeCampaigns)}</div><div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Campaigns</div></div>
              )}
              {stats.creators > 0 && (
                <div className="text-center"><div className="text-2xl md:text-3xl font-bold text-foreground">{formatCount(stats.creators)}</div><div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Creators</div></div>
              )}
              {(stats.totalDonatedCents || 0) + (stats.totalDepositedCents || 0) > 0 && (
                <div className="text-center"><div className="text-2xl md:text-3xl font-bold text-[#22C55E]">{formatMoney((stats.totalDonatedCents || 0) + (stats.totalDepositedCents || 0))}</div><div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Funded</div></div>
              )}
              {stats.totalPaidCents > 0 && (
                <div className="text-center"><div className="text-2xl md:text-3xl font-bold text-[#4338CA]">{formatMoney(stats.totalPaidCents)}</div><div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Paid Out</div></div>
              )}
            </motion.div>
          )}

          {/* Dual CTA */}
          <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Link href="/welcome-artists" className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white transition-all active:scale-[0.97] hover:shadow-[0_0_32px_rgba(67,56,202,0.4)]" style={{ background: 'linear-gradient(135deg, #4338CA, #6366F1)' }}>
              <Music4 size={20} />
              Promote your music
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/welcome-creators" className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base transition-all active:scale-[0.97] border border-[#22C55E]/30 hover:bg-[#22C55E]/10 hover:border-[#22C55E]/50" style={{ color: '#22C55E' }}>
              <Clapperboard size={20} />
              Earn as a creator
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* Sub-CTA */}
          <motion.p className="text-xs text-muted-foreground/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
            Free to start. No credit card required.
          </motion.p>
        </motion.div>

        <motion.div className="absolute bottom-8 text-muted-foreground/20" animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </motion.div>
      </section>

      {/* ════════════════ PROBLEM / SOLUTION ════════════════ */}
      <section className="relative z-10 px-4 py-24 max-w-5xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-semibold mb-4">Why artists are switching</p>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-3">Stop guessing. Start knowing.</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Traditional music promotion is broken. Here's what you're actually paying for — and what you should be paying for.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Old Way */}
          <motion.div className="rounded-2xl border border-red-500/10 p-6 md:p-8" style={{ background: 'linear-gradient(180deg, rgba(239,68,68,0.03) 0%, transparent 100%)' }} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3 className="text-sm font-semibold text-red-400 mb-6 flex items-center gap-2"><X size={16} /> The old way</h3>
            <div className="space-y-4">
              {[
                { title: 'Playlist bots', desc: 'Fake streams from bot accounts. Zero real engagement.' },
                { title: 'Black-box ads', desc: 'Pour money into TikTok/Meta ads with no guarantee of results.' },
                { title: 'Expensive PR firms', desc: '$2k+/month retainers. No tracking. No verification.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <X size={14} className="text-red-400/60 shrink-0 mt-0.5" />
                  <div><p className="text-sm font-medium text-muted-foreground">{item.title}</p><p className="text-xs text-muted-foreground/60">{item.desc}</p></div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Selah Way */}
          <motion.div className="rounded-2xl border border-[#22C55E]/10 p-6 md:p-8" style={{ background: 'linear-gradient(180deg, rgba(34,197,94,0.03) 0%, transparent 100%)' }} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h3 className="text-sm font-semibold text-[#22C55E] mb-6 flex items-center gap-2"><Check size={16} /> The Selah.fm way</h3>
            <div className="space-y-4">
              {[
                { title: 'Real creators', desc: 'Vetted creators make TikToks, Reels, and Shorts with your track.' },
                { title: 'You approve everything', desc: 'Review every video before a single cent is spent.' },
                { title: 'Pay per verified view', desc: 'Only pay for organic views, tracked and verified.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <Check size={14} className="text-[#22C55E]/80 shrink-0 mt-0.5" />
                  <div><p className="text-sm font-medium text-foreground/80">{item.title}</p><p className="text-xs text-muted-foreground/60">{item.desc}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════ FEATURED CAMPAIGNS ════════════════ */}
      {featuredCampaigns.length > 0 && (
        <section className="relative z-10 px-4 py-24 max-w-5xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-semibold mb-4">Live marketplace</p>
            <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-3">
              {featuredCampaigns.length} campaigns. Real creators. Real views.
            </h2>
            <p className="text-muted-foreground">Creators are earning right now. Pick a track you love, make a video, and get paid per view.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCampaigns.map((c, i) => {
              const cpm = (c.cpm_rate_cents || 10) / 100;
              const budget = (c.total_budget_cents || 0) / 100;
              const remaining = (c.budget_remaining_cents || 0) / 100;
              const pct = budget > 0 ? Math.min(((budget - remaining) / budget) * 100, 100) : 0;
              return (
                <Link key={c.id} href={`/c/${c.slug || c.id}`}>
                  <motion.div
                    className="group rounded-2xl border border-white/[0.06] overflow-hidden cursor-pointer transition-all hover:border-primary/20 hover:shadow-[0_0_40px_rgba(67,56,202,0.12)] hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)' }}
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                    <div className="aspect-video bg-white/[0.02] overflow-hidden relative">
                      {c.cover_art_url ? (
                        <img src={c.cover_art_url} alt={c.track_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music4 size={32} className="text-muted-foreground/10" /></div>
                      )}
                      {/* CPM badge */}
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-[#22C55E]">
                        ${cpm.toFixed(2)} CPM
                      </div>
                      {budget > 0 && (
                        <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-[10px] font-semibold text-white/80">
                          ${budget.toFixed(0)} budget
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-heading text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">{c.track_title || c.title}</h3>
                      {c.artist_name && <p className="text-[11px] text-muted-foreground line-clamp-1">{c.artist_name}</p>}
                      {budget > 0 && (
                        <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ background: 'linear-gradient(90deg, #4338CA, #22C55E)', width: `${pct}%` }} />
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] pt-1">
                        <span className="text-muted-foreground">Earn per view</span>
                        <span className="text-[#22C55E] font-semibold flex items-center gap-1"><TrendingUp size={10} /> Submit video</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link href="/browse" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm font-semibold hover:bg-white/[0.08] transition-all">
              View all {stats.activeCampaigns > 0 ? formatCount(stats.activeCampaigns) + ' ' : ''}campaigns <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* ════════════════ TESTIMONIALS ════════════════ */}
      <section className="relative z-10 px-4 py-24" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(67,56,202,0.06) 0%, transparent 70%)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-semibold mb-4">What artists say</p>
            <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-3">Finally, promotion that actually works.</h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: 'Marcus J.', role: 'Electronic Producer', quote: 'I spent thousands on playlists with empty streams. On Selah, $200 got me 15 videos with real, engaged listeners. I actually see who made what and how it performed.', stars: 5 },
              { name: 'Sarah K.', role: 'Christian EDM Artist', quote: 'I wasted $1,500 on playlist pitching. On Selah, $200 got me 6 great videos from real creators. Three of them went semi-viral — I could never get that with ads.', stars: 5 },
              { name: 'Mia J.', role: 'Lifestyle Creator · 28K', quote: 'I love browsing and picking tracks that fit my style. Made $340 last month from 3 videos. Way better than chasing brand deals.', stars: 5 },
              { name: 'Chloe B.', role: 'TikTok Creator', quote: 'I saw a track I loved, posted a 30-second Reel, and got paid $85 three days later. No negotiating, no waiting — just create and earn.', stars: 5 },
            ].map((t, i) => (
              <motion.div key={i} className="rounded-2xl border border-white/[0.06] p-6" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div className="flex gap-0.5 mb-4 text-[#22C55E]/70">{[...Array(t.stars)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}</div>
                <p className="text-sm leading-relaxed mb-5 text-muted-foreground italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{t.name[0]}</div>
                  <div><div className="text-xs font-semibold">{t.name}</div><div className="text-[10px] text-muted-foreground">{t.role}</div></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ FOUNDER ════════════════ */}
      <section className="relative z-10 px-4 py-24 max-w-3xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
            <MessageCircle size={28} className="text-primary/60" />
          </div>
          <h2 className="text-2xl md:text-3xl font-heading tracking-tight">Built by a musician who walked away from a record deal</h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed text-sm">
            I'm Robert-Jan. Got signed young, saw labels take 98%. Built a €6M crowdfunding platform, lost everything, lived in a campervan busking on Tenerife beaches. Now I build tools so artists don't need gatekeepers. Selah.fm is open source, transparent, and built on one belief: <span className="text-foreground/80">you should own your promotion.</span>
          </p>
          <p className="text-xs text-muted-foreground/60">— Robert-Jan Mastenbroek, founder</p>
        </motion.div>
      </section>

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section className="relative z-10 px-4 py-24 max-w-5xl mx-auto">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-semibold mb-4">How it works</p>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-3">Three steps. Full control. Real results.</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-16">
          {/* Artist */}
          <motion.div className="space-y-5" initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #4338CA, #6366F1)' }}><Music4 size={20} /></div>
              <h3 className="text-lg font-heading">For artists</h3>
            </div>
            {[
              { step: '01', title: 'Create your campaign', desc: 'Upload your track, set your CPM rate and budget. Takes 2 minutes.' },
              { step: '02', title: 'Creators make content', desc: 'Vetted creators browse, submit TikToks/Reels/Shorts with your track.' },
              { step: '03', title: 'Approve & pay', desc: 'Review every video. Only pay for verified views. Track everything in real-time.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-[10px] font-mono text-primary/60 mt-1 shrink-0">{s.step}</span>
                <div><h4 className="font-semibold text-sm mb-0.5">{s.title}</h4><p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p></div>
              </div>
            ))}
            <Link href="/welcome-artists" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4 pt-2">Start as artist <ArrowRight size={14} /></Link>
          </motion.div>

          {/* Creator */}
          <motion.div className="space-y-5" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black" style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}><Clapperboard size={20} /></div>
              <h3 className="text-lg font-heading">For creators</h3>
            </div>
            {[
              { step: '01', title: 'Browse campaigns', desc: 'Find tracks you love with budgets that match your style.' },
              { step: '02', title: 'Create & submit', desc: 'Make a TikTok, Reel, or Short. Paste the link. Done in 30 seconds.' },
              { step: '03', title: 'Get paid', desc: 'Earn per 1K verified views. Instant payout via Stripe. No minimum followers.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-[10px] font-mono text-[#22C55E]/60 mt-1 shrink-0">{s.step}</span>
                <div><h4 className="font-semibold text-sm mb-0.5">{s.title}</h4><p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p></div>
              </div>
            ))}
            <Link href="/welcome-creators" className="inline-flex items-center gap-2 text-sm font-semibold text-[#22C55E] hover:underline underline-offset-4 pt-2">Start as creator <ArrowRight size={14} /></Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════════ FAQ MINI ════════════════ */}
      <section className="relative z-10 px-4 py-24 max-w-2xl mx-auto">
        <motion.div className="text-center mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl md:text-3xl font-heading tracking-tight mb-3">Questions people ask</h2>
        </motion.div>
        <div className="space-y-3">
          {[
            { q: 'Is this legit? How are views verified?', a: 'Yes. We verify views through each platform&apos;s public view counts. Creators must connect their real TikTok, Instagram, or YouTube accounts. We cross-check view counts automatically.' },
            { q: 'What if I don&apos;t like the video?', a: 'You approve every video before it goes live. If you don&apos;t like it, reject it — it costs you nothing. You only pay for videos you approve after they get verified views.' },
            { q: 'How much does it cost?', a: 'Nothing upfront. You set a CPM rate (e.g., $10 per 1,000 views) and a budget. Creators earn 80% of the CPM. We take 20% to run the platform. Stripe fees are separate.' },
          ].map((faq, i) => (
            <motion.div key={i} className="rounded-xl border border-white/[0.06] p-5" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <h4 className="font-semibold text-sm mb-2">{faq.q}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-6">
          <Link href="/faq" className="text-xs text-muted-foreground hover:text-foreground transition-colors">See all FAQs →</Link>
        </div>
      </section>

      {/* ════════════════ FINAL CTA ════════════════ */}
      <section className="relative z-10 px-4 py-24">
        <motion.div className="max-w-lg mx-auto text-center space-y-8" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight">Stop wasting money on bots and black-box ads.</h2>
          <p className="text-muted-foreground">Join artists who finally know where their promotion budget goes. Real creators. Real views. Real results.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/welcome-artists" className="px-8 py-4 rounded-xl font-semibold text-white transition-all active:scale-[0.97] hover:shadow-[0_0_32px_rgba(67,56,202,0.4)]" style={{ background: 'linear-gradient(135deg, #4338CA, #6366F1)' }}>
              Start my campaign
            </Link>
            <Link href="/browse" className="px-8 py-4 rounded-xl font-semibold transition-all active:scale-[0.97] bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]">
              Browse campaigns
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/60">Free to start. No credit card required. Open source.</p>
          <div className="pt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground/40">
            <Link href="/faq" className="hover:text-muted-foreground transition-colors">FAQ</Link>
            <span>·</span>
            <Link href="/blog" className="hover:text-muted-foreground transition-colors">Blog</Link>
            <span>·</span>
            <a href="https://github.com/robertjanmastenbroek/selah.fm" target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground transition-colors">Open source</a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
