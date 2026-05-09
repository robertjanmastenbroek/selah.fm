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
  Music: () => (<svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 24V10l12-2v12"/><circle cx="9" cy="24" r="3"/><circle cx="18" cy="20" r="3"/></svg>),
  Sparkle: () => (<svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 4v4M16 24v4M4 16h4M24 16h4M7.5 7.5l3 3M21.5 10.5l-3 3"/></svg>),
  Target: () => (<svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="6"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/></svg>),
  Video: () => (<svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="6" width="20" height="20" rx="2"/><path d="M22 14l8-6v16l-8-6z"/></svg>),
  Check: () => (<svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 4L4 10v8c0 5.5 4.8 11.2 12 14 7.2-2.8 12-8.5 12-14v-8L16 4z"/><path d="M10 16l4 4 8-8"/></svg>),
};

function SectionWrap({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <section ref={ref} className={`py-20 md:py-28 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}>
      {children}
    </section>
  );
}

export default function WelcomeArtistsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <style>{`
        @keyframes glow { 0%, 100% { box-shadow: 0 0 0 0 rgba(91,127,255,0.3); } 50% { box-shadow: 0 0 0 12px rgba(91,127,255,0); } }
        @keyframes shimmerLine { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
      `}</style>

      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0"><div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-3xl animate-pulse" /><div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-primary/[0.04] blur-3xl" style={{ animation: 'glow 4s ease-in-out infinite' }} /></div>
        <div className="max-w-3xl mx-auto px-6 py-20 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-primary/5 border border-primary/10 text-primary/90 text-xs font-medium px-4 py-2 rounded-full mb-10"><span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />Free to start. Takes 2 minutes.</div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-[-0.02em] leading-[1.05] mb-8">Real Promotion for<br /><span className="bg-gradient-to-r from-primary via-[#8B9FFF] to-primary bg-clip-text text-transparent" style={{ backgroundSize: '200% 100%', animation: 'shimmerLine 4s ease-in-out infinite' }}>Real Artists.</span></h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed">Ditch bots and wasted ad spend. Launch a campaign to have vetted creators share your music in TikToks, Reels &amp; Shorts. You set the budget and only pay for verified views.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground mb-12">
            {['No bots', 'You set the CPM', 'Approve every video', 'Pay only for real views'].map(t => (
              <span key={t} className="flex items-center gap-1"><svg className="w-3.5 h-3.5 text-primary/60" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.5 5.5l-4 4-2.5-2.5"/></svg>{t}</span>
            ))}
          </div>
          <Link href="/dashboard" className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(91,127,255,0.25)] active:scale-[0.97]">Start My Campaign <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link>
        </div>
      </section>

      {/* PROBLEM */}
      <SectionWrap className="bg-muted/[0.25]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16"><p className="text-xs tracking-[0.15em] uppercase text-primary font-semibold mb-4">The Old Way</p><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Why is music promo still broken?</h2><p className="text-muted-foreground max-w-lg mx-auto">You&apos;ve tried everything. Here&apos;s why it didn&apos;t work.</p></div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Icons.Music />, title: 'Playlist Bots', desc: 'Streams from fake accounts. No real fans, no engagement — just a temporary spike that vanishes.' },
              { icon: <Icons.Target />, title: 'Black-Box Ads', desc: 'Pour money into TikTok & Meta with zero guarantee. You pay for impressions, not results.' },
              { icon: <Icons.Sparkle />, title: 'Overpriced PR', desc: '$2k/month retainers for vague promises. No tracking, no verification, no real growth.' },
            ].map((item, i) => (
              <div key={i} className="group relative rounded-2xl bg-card border border-border/20 p-8 transition-all duration-300 hover:border-destructive/20 hover:-translate-y-1">
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-xs font-bold">✕</div>
                <div className="w-12 h-12 rounded-xl bg-destructive/[0.06] flex items-center justify-center text-destructive mb-5">{item.icon}</div>
                <h3 className="font-semibold text-base mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionWrap>

      {/* SOLUTION */}
      <SectionWrap>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Finally, a marketplace that makes sense.</h2><p className="text-muted-foreground max-w-lg mx-auto">Three steps. Total control. Real results.</p></div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: <Icons.Target />, title: 'Create Your Campaign', desc: 'Upload your track, set a CPM, define your budget. Our system suggests the best rate for maximum reach.' },
              { step: '02', icon: <Icons.Video />, title: 'Creators Make Content', desc: 'Vetted creators browse your campaign. Those who love your sound create TikToks, Reels & Shorts.' },
              { step: '03', icon: <Icons.Check />, title: 'Approve & Pay', desc: 'Review every video. Approve what you like. Pay only for verified views. Your budget stays protected.' },
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
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Artists are finally getting what they pay for.</h2><p className="text-muted-foreground">Real stories. Real results.</p></div>
          <div className="space-y-4">
            {[
              { name: 'Marcus J.', role: 'Electronic Producer', quote: 'I spent thousands on playlists with empty streams. On Selah, $200 got me 15 videos with real, engaged listeners. Night and day.' },
              { name: 'Sarah K.', role: 'Christian EDM Artist', quote: 'I wasted $1,500 on playlist pitching. On Selah, $200 got me 6 great videos from real creators. The approval flow is everything.' },
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

      {/* PRICING */}
      <SectionWrap>
        <div className="max-w-lg mx-auto px-6">
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Clear pricing. Always.</h2><p className="text-muted-foreground">No monthly fees. Only pay when you run a campaign.</p></div>
          <div className="rounded-2xl bg-card border border-border/20 overflow-hidden">
            <div className="p-10 text-center border-b border-border/10">
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-semibold mb-8">Where your $100 goes</p>
              <div className="flex items-end justify-center gap-3">
                <div className="flex flex-col items-center gap-2"><div className="w-28 h-28 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-[0_8px_30px_rgba(91,127,255,0.2)]">$80</div><span className="text-xs font-medium">To Creators</span></div>
                <div className="flex flex-col items-center gap-2"><div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-xl font-medium">$20</div><span className="text-xs text-muted-foreground">Platform</span></div>
              </div>
            </div>
            <div className="px-6 py-4 text-center text-xs text-muted-foreground bg-muted/20">Stripe: 2.9% + $0.30 on deposits. Payouts: $0.25 per transfer.</div>
          </div>
        </div>
      </SectionWrap>

      {/* FAQ */}
      <SectionWrap className="bg-muted/[0.25]">
        <div className="max-w-lg mx-auto px-6">
          <div className="text-center mb-16"><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Got questions?</h2></div>
          <div className="space-y-3">
            {[
              { q: 'How do you guarantee real views?', a: 'Verified through YouTube\'s public API and manual review. No bots, no fake streams. Ever.' },
              { q: 'Can I cap my budget?', a: 'Yes. Hard budget and max payout per video. You never pay more than you commit.' },
              { q: 'What if I hate a video?', a: 'Reject it — you don\'t pay. You review every submission before any money moves.' },
              { q: 'How is this better than ads?', a: 'Ads charge for impressions. We charge for verified views on real creator content.' },
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
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Ready to stop guessing?</h2>
          <p className="text-muted-foreground mb-10 text-base">No credit card required to browse. Fund your campaign when you&apos;re ready.</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(91,127,255,0.3)] active:scale-[0.97]">Start My First Campaign — Free</Link>
          <p className="text-xs text-muted-foreground mt-8"><Link href="/artists" className="hover:text-foreground transition-colors">Browse artists</Link><span className="mx-3 opacity-30">·</span><Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link></p>
        </div>
      </section>
    </div>
  );
}
