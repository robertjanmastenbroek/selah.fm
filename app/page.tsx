'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/TopNav';
import TrustBadges from '@/components/TrustBadges';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Selah.fm',
  description: 'Music promotion marketplace — pay creators for TikTok, Reels, and Shorts based on verified views.',
  applicationCategory: 'MarketplaceApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free to start. Pay only for verified views.' },
};

function AnimatedCounter({ target, label, suffix = '', duration = 2000 }: { target: number; label: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || started.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        started.current = true;
        const start = performance.now();
        const animate = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-2xl md:text-4xl font-extrabold text-accent-foreground tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs md:text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const [calcViews, setCalcViews] = useState('10000');
  const [calcCpm, setCalcCpm] = useState('2');
  const earnings = Math.round(((parseInt(calcViews) || 0) / 1000) * (parseFloat(calcCpm) || 0) * 0.8);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />

      {/* ═══════════════════════════════════════════════════════════ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-accent/[0.02] to-background">
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-3xl animate-[float_10s_ease-in-out_infinite_2s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/[0.03] blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
        </div>

        <div className="page-container relative z-10 py-16 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent-foreground text-xs font-semibold px-4 py-2 rounded-full mb-8 animate-[fadeIn_0.5s_ease-out]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Early access — join 200+ artists already running campaigns
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05] animate-[fadeIn_0.6s_ease-out]">
              Get your music<br />
              <span className="bg-gradient-to-r from-accent-foreground via-amber-400 to-accent-foreground bg-clip-text text-transparent animate-[shimmer_3s_ease-in-out_infinite] bg-[length:200%_100%]">
                heard.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-3 animate-[fadeIn_0.7s_ease-out]">
              Real creators make TikToks, Reels & Shorts for your track. You set the CPM, approve every video, and only pay for verified views.
            </p>
            <p className="text-sm text-muted-foreground/60 max-w-md mx-auto mb-10 animate-[fadeIn_0.8s_ease-out]">
              The transparent marketplace for music promotion. No bots. No waste. Just results.
            </p>

            {/* Trust badges */}
            <div className="flex justify-center mb-10 animate-[fadeIn_0.9s_ease-out]">
              <TrustBadges />
            </div>

            {/* Dual CTA cards */}
            <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto mb-16 animate-[fadeIn_1s_ease-out]">
              <div className="group relative overflow-hidden rounded-2xl border border-accent/20 bg-accent/[0.03] p-6 md:p-8 text-center hover:border-accent/40 hover:bg-accent/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/5">
                <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="text-3xl mb-3">🎵</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">I&apos;m an artist</p>
                  <h3 className="text-xl font-bold mb-3">Promote your music</h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Set a budget, pick your CPM, and creators make content for your track. You review and approve every video.</p>
                  <Link href="/dashboard">
                    <Button size="lg" className="w-full font-semibold shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-shadow">
                      Start a campaign →
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-3">Free to start · $5 minimum</p>
                </div>
              </div>

              <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/50 p-6 md:p-8 text-center hover:border-muted-foreground/30 hover:bg-card/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="text-3xl mb-3">📱</div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">I&apos;m a creator</p>
                  <h3 className="text-xl font-bold mb-3">Get paid to post</h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Browse campaigns, pick tracks you love, create content, and earn money for every verified view.</p>
                  <Link href="/browse">
                    <Button size="lg" variant="secondary" className="w-full font-semibold">
                      Browse campaigns →
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-3">Free to join · 80% of CPM to you</p>
                </div>
              </div>
            </div>

            {/* Social proof stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-lg mx-auto border-t border-border/50 pt-12">
              <AnimatedCounter target={200} label="Artists" suffix="+" duration={1800} />
              <AnimatedCounter target={400} label="Creators" suffix="+" duration={2000} />
              <AnimatedCounter target={12000} label="Videos created" suffix="+" duration={2200} />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════ PROBLEM AGITATION ═══ */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="page-container max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">The old way</p>
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Music promotion is broken.</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Playlist pitching gets you bots. Ads burn cash with no engagement. PR is slow and expensive. There&apos;s a better way.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: '🤖', title: 'Playlist bots', desc: 'Thousands of streams from fake accounts. No real fans. No real engagement.' },
              { icon: '💸', title: 'Wasted ad spend', desc: 'TikTok and Instagram ads with 0.5% engagement. You pay for impressions, not results.' },
              { icon: '🐌', title: 'Slow PR agencies', desc: '$2,000/month retainers. Months to see any traction. No guarantee of coverage.' },
            ].map((item, i) => (
              <div key={i} className="relative p-6 rounded-xl border border-red-500/10 bg-red-500/[0.02]">
                <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-xs">✕</div>
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
              <span className="text-xl">↓</span>
              <span className="text-sm font-semibold text-accent-foreground">There&apos;s a better way</span>
              <span className="text-xl">↓</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ PRODUCT SHOWCASE ═══ */}
      <section className="py-16 md:py-24">
        <div className="page-container max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Real creators. Real content. Real results.</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Artists set budgets and CPM rates. Creators browse, create, and submit. You approve what you like. You pay only for verified views.</p>
          </div>

          {/* 3 product screenshots side by side */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { title: 'Create a campaign', desc: 'Upload your track, set a CPM rate and budget. Add hashtags and creative requirements.', color: 'from-amber-500/20 to-amber-600/10', accent: 'bg-amber-500' },
              { title: 'Creators make content', desc: 'Creators browse your campaign, pick tracks they love, and create TikToks, Reels, or Shorts.', color: 'from-violet-500/20 to-violet-600/10', accent: 'bg-violet-500' },
              { title: 'Review & pay for views', desc: 'Watch every submission. Approve what you like. Pay only for verified views. Budget stays safe.', color: 'from-emerald-500/20 to-emerald-600/10', accent: 'bg-emerald-500' },
            ].map((s, i) => (
              <div key={i} className="group">
                {/* Browser mockup */}
                <div className={`rounded-2xl border border-border bg-gradient-to-b ${s.color} p-1 shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
                  <div className="rounded-xl bg-background overflow-hidden">
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50">
                      <div className={`w-2.5 h-2.5 rounded-full ${s.accent}`} />
                      <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                      <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
                    </div>
                    <div className="p-5 space-y-3 min-h-[160px]">
                      {/* Mock content */}
                      <div className={`w-3/4 h-3 rounded-full ${s.accent} opacity-20`} />
                      <div className="w-1/2 h-3 rounded-full bg-muted-foreground/10" />
                      <div className="space-y-2 mt-4">
                        <div className="w-full h-2 rounded-full bg-muted" />
                        <div className="grid grid-cols-3 gap-2">
                          <div className="h-12 rounded-lg bg-muted/50" />
                          <div className="h-12 rounded-lg bg-muted/50" />
                          <div className="h-12 rounded-lg bg-muted/50" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ HOW IT WORKS ═══ */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="page-container max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">How Selah.fm works</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Three steps from track to trending. No complexity. Just results.</p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-accent/30 via-accent/20 to-accent/30" />

            <div className="grid md:grid-cols-3 gap-8 relative">
              {[
                { step: '1', icon: '🎯', title: 'Create campaign', desc: 'Upload your track, set your CPM rate and budget. Add hashtags and requirements for creators. Takes 2 minutes.' },
                { step: '2', icon: '🎬', title: 'Creators post content', desc: 'Creators browse, pick your track, make TikToks/Reels/Shorts, and submit their links for your review.' },
                { step: '3', icon: '✅', title: 'Approve & pay', desc: 'Review every video. Approve the ones you love. Pay only for verified views. Max payout cap keeps your budget safe.' },
              ].map((s, i) => (
                <div key={i} className="relative z-10 text-center">
                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-2xl font-bold text-accent-foreground shadow-lg shadow-accent/5">
                    {s.icon}
                  </div>
                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-background border-2 border-accent/30 text-xs font-bold text-accent-foreground mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ TESTIMONIALS ═══ */}
      <section className="py-16 md:py-24">
        <div className="page-container max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">What our users say</h2>
            <p className="text-muted-foreground">Artists and creators love the transparency and results.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Marcus J.', role: 'Electronic Producer', quote: 'Finally a platform where I actually see what I\'m paying for. I approved 12 videos last month and my track hit 80K streams. The CPM model just makes sense.', color: 'from-amber-500/10 to-amber-600/5' },
              { name: 'Mia J.', role: 'TikTok Creator · 28K', quote: 'I love that I can browse campaigns and pick tracks that fit my style. Made $340 last month from 3 videos. Way better than brand deals that take weeks to close.', color: 'from-violet-500/10 to-violet-600/5' },
              { name: 'Sarah K.', role: 'Christian EDM Artist', quote: 'I wasted $1,500 on playlist pitching last year. On Selah, I spent $200 and got 6 great videos from real creators. The approval flow means I never pay for content I don\'t like.', color: 'from-emerald-500/10 to-emerald-600/5' },
            ].map((t, i) => (
              <Card key={i} className={`bg-gradient-to-b ${t.color} border-0 shadow-sm`}>
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4 text-accent-foreground">
                    {'★★★★★'.split('').map((s, j) => <span key={j}>{s}</span>)}
                  </div>
                  <p className="text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-sm font-bold text-accent-foreground">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ EARNINGS CALCULATOR ═══ */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="page-container max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">What can you earn?</h2>
            <p className="text-muted-foreground">Estimate your earnings as a creator. Slide the numbers and see.</p>
          </div>

          <Card className="overflow-hidden border-accent/10 shadow-xl">
            <CardContent className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">Views per video</label>
                  <div className="flex items-center gap-3">
                    <Input type="range" min="1000" max="100000" step="1000" value={calcViews}
                      onChange={e => setCalcViews(e.target.value)}
                      className="flex-1 h-2 accent-accent-foreground" />
                    <span className="text-sm font-mono font-bold w-16 text-right">{parseInt(calcViews).toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">CPM Rate ($)</label>
                  <div className="flex items-center gap-3">
                    <Input type="range" min="0.5" max="10" step="0.5" value={calcCpm}
                      onChange={e => setCalcCpm(e.target.value)}
                      className="flex-1 h-2 accent-accent-foreground" />
                    <span className="text-sm font-mono font-bold w-16 text-right">${calcCpm}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">Per video</div>
                  <div className="text-2xl font-extrabold text-accent-foreground">${earnings}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">after 20% fee</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">3 videos</div>
                  <div className="text-2xl font-extrabold text-accent-foreground">${earnings * 3}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">per campaign</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground mb-1">10 videos</div>
                  <div className="text-2xl font-extrabold text-accent-foreground">${earnings * 10}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">scaled up</div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Creators keep 80% of CPM. Platform fee is 20%. Artists set the CPM rate — you see it before you join any campaign.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ════════════════════════════════════════ FEE TRANSPARENCY ═══ */}
      <section className="py-16 md:py-24">
        <div className="page-container max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Simple, transparent fees.</h2>
            <p className="text-muted-foreground">20% platform fee on creator payouts. No hidden costs. Artists pay exactly what they budget.</p>
          </div>

          <div className="relative">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-2 divide-x divide-border">
                  <div className="p-8 text-center bg-muted/10">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Artist deposits</p>
                    <p className="text-5xl font-extrabold">$500</p>
                    <p className="text-xs text-muted-foreground mt-2">Budget for your campaign</p>
                  </div>
                  <div className="p-8 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Creator earns</p>
                    <p className="text-5xl font-extrabold text-accent-foreground">$400</p>
                    <p className="text-xs text-muted-foreground mt-2">80% of CPM payouts</p>
                  </div>
                </div>
                <div className="bg-muted/30 px-8 py-4 text-center border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Platform fee: <span className="font-semibold text-foreground">20%</span> · Stripe processing: <span className="font-semibold text-foreground">2.9% + $0.30</span> on deposits · Creator payout fee: <span className="font-semibold text-foreground">$0.25</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ FAQ ═══ */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="page-container max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-3">
            {[
              { q: 'How do I know the views are real?', a: 'We verify views through platform APIs (TikTok, Instagram, YouTube). No bots, no fake streams. You see the view count on every approved submission — and you only pay for verified views.' },
              { q: 'What if the submissions are bad?', a: 'You review every video before approving. Set requirements upfront (length, style, tone). If a submission doesn\'t meet your standards, reject it — you don\'t pay.' },
              { q: 'How do creators get paid?', a: 'Creators connect their bank account via Stripe Connect. Payouts process automatically when submissions are approved and views are verified.' },
              { q: 'What platforms can creators post on?', a: 'TikTok, Instagram Reels, and YouTube Shorts. You choose which platforms your campaign runs on. More platforms coming.' },
              { q: 'Is there a minimum follower count?', a: 'No minimum. We believe small creators can drive big results. CPM rates and budgets are visible upfront — you decide which campaigns are worth your time.' },
              { q: 'What\'s the minimum budget?', a: '$5. Test the platform with a micro-campaign and scale up once you see results.' },
            ].map((faq, i) => (
              <Card key={i} className="hover:border-accent/20 transition-colors">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2 text-sm">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════ FINAL CTA ═══ */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/[0.03] to-accent/[0.06]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-accent/[0.04] blur-3xl" />

        <div className="page-container relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Ready to get your music
            <span className="bg-gradient-to-r from-accent-foreground via-amber-400 to-accent-foreground bg-clip-text text-transparent bg-[length:200%_100%] animate-[shimmer_3s_ease-in-out_infinite]"> heard?</span>
          </h2>
          <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">Join 200+ artists running campaigns on Selah.fm. Real creators. Real views. Real results.</p>

          <div className="flex gap-4 justify-center flex-wrap mb-6">
            <Link href="/dashboard">
              <Button size="lg" className="font-semibold text-base px-8 shadow-lg shadow-accent/10 hover:shadow-accent/20 transition-shadow">
                Start a campaign →
              </Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="secondary" className="font-semibold text-base px-8">
                Browse campaigns
              </Button>
            </Link>
          </div>

          <div className="flex justify-center mb-12">
            <TrustBadges />
          </div>

          <div className="flex gap-6 justify-center text-xs text-muted-foreground">
            <Link href="/tos" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/artists" className="hover:text-foreground transition-colors">Artists</Link>
            <span className="text-border">·</span>
            <Link href="/creators" className="hover:text-foreground transition-colors">Creators</Link>
            <span className="text-border">·</span>
            <Link href="/content-guidelines" className="hover:text-foreground transition-colors">Guidelines</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
