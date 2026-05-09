'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const Icons = {
  Play: () => (<svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 4v24l20-12L8 4z"/></svg>),
  Dollar: () => (<svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="16" cy="16" r="14"/><path d="M16 8v16M12 11h4.5a2.5 2.5 0 010 5H13v0a2.5 2.5 0 000 5h4"/></svg>),
  Camera: () => (<svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="8" width="28" height="18" rx="2"/><circle cx="16" cy="17" r="4"/><path d="M10 8l2-4h8l2 4"/></svg>),
  Phone: () => (<svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="6" y="2" width="20" height="28" rx="3"/><circle cx="16" cy="22" r="1.5" fill="currentColor"/></svg>),
  Music: () => (<svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 24V10l12-2v12"/><circle cx="9" cy="24" r="3"/><circle cx="18" cy="20" r="3"/></svg>),
  Wallet: () => (<svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="8" width="24" height="18" rx="2"/><rect x="18" y="12" width="7" height="10" rx="1"/></svg>),
};

function SectionWrap({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <section ref={ref} className={`py-20 md:py-28 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}>
      {children}
    </section>
  );
}

export default function WelcomeCreatorsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <style>{`
        @keyframes glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(91,127,255,0.3); } 50% { box-shadow: 0 0 0 12px rgba(91,127,255,0); } }
        @keyframes shimmerLine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0"><div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-3xl animate-pulse" /><div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-primary/[0.04] blur-3xl" style={{ animation: 'glow 4s ease-in-out infinite' }} /></div>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/10 text-primary/90 text-xs font-medium px-4 py-2 rounded-full mb-10"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />Free to join. No weird contracts.</div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-[-0.02em] leading-[1.05] mb-8">Make Content.<br /><span className="bg-gradient-to-r from-primary via-[#8B9FFF] to-primary bg-clip-text text-transparent" style={{ backgroundSize: '200% 100%', animation: 'shimmerLine 4s ease-in-out infinite' }}>Get Paid.</span></h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed">Turn your creativity into cash. Use TikTok, Instagram &amp; YouTube Shorts to promote music you love, and earn based on the real views your content generates.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground mb-12">
            {['No upfront costs', 'Earn per 1,000 views', 'Choose tracks you love', 'Fast, secure payouts'].map(t => (
              <span key={t} className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-primary/60" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.5 5.5l-4 4-2.5-2.5"/></svg>{t}</span>
            ))}
          </div>
          <Link href="/browse" className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(91,127,255,0.25)] active:scale-[0.97]">Start Earning Today <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link>
        </div>
      </section>

      {/* OPPORTUNITY */}
      <SectionWrap className="bg-muted/[0.25]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16"><p className="text-xs tracking-[0.15em] uppercase text-primary font-semibold mb-4">The Reality</p><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">You&apos;re already making content. Now get paid fairly for it.</h2><p className="text-muted-foreground max-w-lg mx-auto">The creator hustle is real. Here&apos;s what you&apos;re up against.</p></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Icons.Dollar />, title: 'Unpredictable Brand Deals', desc: 'Hunting for sponsors is a full-time job. Stop DMing 50 brands for a $50 offer.' },
              { icon: <Icons.Phone />, title: 'Algorithm-Dependent Income', desc: 'Monetization programs keep changing the rules. You deserve a stable, transparent way to earn.' },
              { icon: <Icons.Wallet />, title: '"Exposure" Doesn\'t Pay Rent', desc: 'You\'ve been asked to work for exposure too many times. On Selah, every view has a dollar value.' },
            ].map((item, i) => (
              <div key={i} className="group relative rounded-2xl bg-card border border-border/20 p-8 transition-all duration-300 hover:border-success/20 hover:-translate-y-1">
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-success/10 flex items-center justify-center text-success text-xs font-bold">✓</div>
                <div className="w-12 h-12 rounded-xl bg-success/[0.06] flex items-center justify-center text-success mb-5">{item.icon}</div>
                <h3 className="font-semibold text-base mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrap>

      {/* HOW IT WORKS */}
      <SectionWrap>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">It&apos;s simple: Create, Post, and Earn.</h2><p className="text-muted-foreground max-w-lg mx-auto">Three steps from track to payout.</p></div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: <Icons.Music />, title: 'Pick a Track You Love', desc: 'Browse new music from independent artists. Connect your TikTok, Instagram, or YouTube Shorts instantly.' },
              { step: '02', icon: <Icons.Camera />, title: 'Create Authentic Content', desc: 'Use the track in your short-form videos in a way that feels natural to your style. No cheesy scripts.' },
              { step: '03', icon: <Icons.Dollar />, title: 'Get Paid for Real Views', desc: 'Artists approve your video. Every 1,000 verified views earns you cash. Watch your earnings grow in real-time.' },
            ].map((s, i) => (
              <div key={i} className="group text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary transition-all duration-300 group-hover:bg-primary/10 group-hover:scale-105">{s.icon}</div>
                <p className="text-xs text-primary/60 font-mono tracking-wider mb-3">{s.step}</p>
                <h3 className="font-bold text-lg mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrap>

      {/* PROOF */}
      <SectionWrap className="bg-muted/[0.25]">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Join hundreds of creators already earning.</h2><p className="text-muted-foreground">Real payouts. Real stories.</p></div>
          <div className="space-y-4">
            {[
              { name: 'Chloe B.', role: 'TikTok Creator', quote: 'I saw a track I loved, posted a 30-second Reel, and got paid $85 three days later. Selah is the most straightforward platform I\'ve ever used.' },
              { name: 'Mia J.', role: 'Lifestyle Creator · 28K', quote: 'I love that I can browse and pick tracks that fit my style. Made $340 last month from 3 videos. Way better than brand deals.' },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border/20 p-7 transition-all duration-300 hover:border-primary/10 hover:-translate-y-0.5">
                <div className="flex gap-0.5 mb-4 text-primary/80">{[...Array(5)].map((_, j) => (<svg key={j} className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2 5.5h5.5l-4.5 3.5L12.5 15 8 11.5 3.5 15l1.5-5L.5 6.5H6z"/></svg>))}</div>
                <p className="text-sm leading-relaxed mb-5 italic text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{t.name[0]}</div><div><div className="text-sm font-semibold">{t.name}</div><div className="text-xs text-muted-foreground">{t.role}</div></div></div>
              </div>
            ))}
          </div>
        </div>
      </SectionWrap>

      {/* FEES */}
      <SectionWrap>
        <div className="max-w-lg mx-auto px-6">
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">You keep the lion&apos;s share.</h2><p className="text-muted-foreground">80% of every payout goes to you. We take 20% to run the platform.</p></div>
          <div className="rounded-2xl bg-card border border-border/20 overflow-hidden text-center p-10">
            <div className="flex items-end justify-center gap-3 mb-6">
              <div className="flex flex-col items-center gap-2"><div className="w-28 h-28 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-[0_8px_30px_rgba(91,127,255,0.2)]">80%</div><span className="text-xs font-medium">You Earn</span></div>
              <div className="flex flex-col items-center gap-2"><div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-xl font-medium">20%</div><span className="text-xs text-muted-foreground">Platform</span></div>
            </div>
            <p className="text-sm">Platform fee covers Stripe, support, and operations.</p>
            <p className="text-xs text-muted-foreground mt-3">Connect your Stripe account in under 2 minutes. Payouts process automatically.</p>
          </div>
        </div>
      </SectionWrap>

      {/* FAQ */}
      <SectionWrap className="bg-muted/[0.25]">
        <div className="max-w-lg mx-auto px-6">
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Got questions?</h2></div>
          <div className="space-y-3">
            {[
              { q: 'How do I know I\'ll actually get paid?', a: 'Payments through Stripe. Once an artist approves and views are verified, your payout is sent automatically.' },
              { q: 'What if an artist doesn\'t approve my video?', a: 'That\'s fine. Artists review each video. You can try again with a different campaign anytime.' },
              { q: 'Do I need millions of followers?', a: 'No minimum. We believe small creators drive big results. Quality matters more than follower count.' },
              { q: 'How fast do I get paid?', a: 'Connect Stripe in 2 minutes. Payouts process when artists approve. See earnings in your dashboard.' },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/20 p-5 transition-all duration-200 hover:border-primary/10"><h3 className="font-semibold text-sm mb-2">{faq.q}</h3><p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p></div>
            ))}
          </div>
        </div>
      </SectionWrap>

      {/* CLOSER */}
      <section className="relative py-24 md:py-36 text-center overflow-hidden bg-gradient-to-b from-background via-primary/[0.02] to-primary/[0.04]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="max-w-xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Your content is worth more.</h2>
          <p className="text-muted-foreground mb-10 text-base">Connect your accounts in under 2 minutes. No cost to join.</p>
          <Link href="/browse" className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(91,127,255,0.3)] active:scale-[0.97]">Join Selah &amp; Start Earning</Link>
          <p className="text-xs text-muted-foreground mt-8"><Link href="/creators" className="hover:text-foreground transition-colors">Browse creators</Link><span className="mx-3 opacity-30">·</span><Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link></p>
        </div>
      </section>
    </div>
  );
}
