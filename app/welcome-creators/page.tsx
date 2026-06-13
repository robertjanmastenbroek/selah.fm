'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { DollarSign, Smartphone, Wallet, ArrowRight, Check, Search, Camera, Music4, Zap, Shield, Sparkles } from 'lucide-react';

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25,0.1,0.25,1] as const } } };

function SectionWrap({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (<motion.section className={`py-20 md:py-28 ${className}`} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>{children}</motion.section>);
}

export default function WelcomeCreatorsPage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: '#0F0F23' }}>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)' }} />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] text-accent text-xs font-medium px-4 py-2 rounded-full mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"/>1,200+ active campaigns. Real payouts.
            </span>
          </motion.div>

          <motion.h1 className="text-5xl md:text-7xl font-heading tracking-[-0.02em] leading-[1.05] mb-6" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.5}}>
            Make TikToks.<br/>
            <span className="bg-gradient-to-r from-[#22C55E] via-[#4ADE80] to-[#4338CA] bg-clip-text text-transparent">Get Paid.</span>
          </motion.h1>

          <motion.p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}}>
            Browse music from independent artists, make a TikTok or Reel with it, and earn per verified view. No brand deals. No minimum followers. Just real money for your content.
          </motion.p>

          <motion.div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground mb-12" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.25}}>
            {['Earn per view, not per post', 'Pick tracks you actually like', 'Keep 100% of what you earn', 'Paid weekly via Stripe'].map(t=><span key={t} className="flex items-center gap-1"><Check size={14} className="text-accent" strokeWidth={2}/>{t}</span>)}
          </motion.div>

          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login?redirect=/browse" className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-black transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}>
              Start Earning Today <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5"/>
            </Link>
            <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse campaigns first →</Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">Three steps. That's it.</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">No applications. No minimum followers. No waiting for brand deals.</p>
        </motion.div>
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {[
            { step: '01', icon: Search, title: 'Browse & Pick', desc: 'Find tracks you actually like from 1,200+ campaigns. ListFilter by genre, CPM rate, and budget.' },
            { step: '02', icon: Camera, title: 'Make & Post', desc: 'Create a TikTok, Reel, or Short with the track. 15-60 seconds. Vertical. Public account. That\'s it.' },
            { step: '03', icon: DollarSign, title: 'Earn Per View', desc: 'Artist approves your video. You earn per 1,000 verified views. Paid weekly via Stripe.' }
          ].map((s, i) => {
            const I = s.icon;
            return (
              <motion.div key={i} variants={fadeUp} className="group text-center">
                <motion.div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] flex items-center justify-center text-accent" whileHover={{scale:1.08,backgroundColor:'rgba(34,197,94,0.08)'}}><I size={28} strokeWidth={1.5}/></motion.div>
                <p className="text-xs text-accent font-mono tracking-wider mb-3">{s.step}</p>
                <h3 className="font-heading text-lg mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </SectionWrap>

      {/* ═══════════ WHY SELAH ═══════════ */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">Why creators choose Selah</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Real money. Real tracks. No algorithms deciding your income.</p>
        </motion.div>
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: 'No Brand Deals Needed', desc: 'Stop cold-DMing 50 brands for a $50 offer. Browse campaigns that already have budgets and start earning immediately.' },
            { icon: Shield, title: 'Stable, Transparent Pay', desc: 'You know exactly what you\'ll earn per 1M views before you even start. No algorithm changes, no monetization policy updates.' },
            { icon: Wallet, title: 'You Keep 100%', desc: 'The full CPM rate goes to you. Selah adds a 20% fee on the artist\'s side. No deductions from your earnings — ever.' },
          ].map((item, i) => {
            const I = item.icon;
            return (
              <motion.div key={i} variants={fadeUp} className="relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-8" whileHover={{y:-2,backgroundColor:'rgba(255,255,255,0.05)',borderColor:'rgba(34,197,94,0.2)'}} whileTap={{scale:0.98}}>
                <div className="w-12 h-12 rounded-xl bg-accent/[0.06] flex items-center justify-center text-accent mb-5"><I size={28} strokeWidth={1.5}/></div>
                <h3 className="font-semibold text-base mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </SectionWrap>

      {/* ═══════════ EARNINGS ═══════════ */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">What can you earn?</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">Real examples from real CPM rates on live campaigns.</p>
        </motion.div>
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-4 gap-4">
          {[
            { cpm: '$500', views: '1M', earn: '$500', label: 'One solid video' },
            { cpm: '$1,000', views: '1M', earn: '$1,000', label: 'A trending post' },
            { cpm: '$1,500', views: '1M', earn: '$1,500', label: 'Weekly side hustle' },
            { cpm: '$2,000', views: '1M', earn: '$2,000', label: 'Viral hit' },
          ].map((e, i) => (
            <motion.div key={i} variants={fadeUp} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6 text-center" whileHover={{y:-2,borderColor:'rgba(34,197,94,0.2)'}}>
              <div className="text-3xl font-bold text-accent mb-2">{e.earn}</div>
              <div className="text-xs text-muted-foreground mb-1">{e.cpm}/1M views · {e.views} views</div>
              <div className="text-[10px] text-muted-foreground/60">{e.label}</div>
            </motion.div>
          ))}
        </div>
      </SectionWrap>

      {/* ═══════════ PROOF ═══════════ */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">Creators are earning already.</h2>
          <p className="text-muted-foreground">Real payouts. No funny business.</p>
        </motion.div>
        <div className="max-w-2xl mx-auto px-6 space-y-4">
          {[
            { name: 'Chloe B.', role: 'TikTok Creator', quote: 'I saw a track I loved, posted a 30-second Reel, and got paid $85 three days later. No brand deal, no negotiation — just picked a track and made content.' },
            { name: 'Mia J.', role: 'Lifestyle Creator · 28K', quote: 'I love browsing and picking tracks that fit my style. Made $340 last month from 3 videos. Way easier than hunting for sponsors.' },
          ].map((t, i) => (
            <motion.div key={i} variants={fadeUp} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-7" whileHover={{y:-1,borderColor:'rgba(67,56,202,0.15)'}}>
              <div className="flex gap-0.5 mb-4 text-accent/80">{[...Array(5)].map((_, j) => <Sparkles key={j} size={16} fill="currentColor"/>)}</div>
              <p className="text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{t.name[0]}</div>
                <div><div className="text-sm font-semibold">{t.name}</div><div className="text-xs text-muted-foreground">{t.role}</div></div>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionWrap>

      {/* ═══════════ FEES ═══════════ */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">You keep 100% of every payout.</h2>
          <p className="text-muted-foreground">No fees on your earnings. The platform fee is added on the artist's side.</p>
        </motion.div>
        <div className="max-w-lg mx-auto px-6">
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden text-center p-10">
            <div className="flex items-end justify-center gap-3 mb-6">
              <div className="w-36 h-36 rounded-2xl flex items-center justify-center text-black text-4xl font-bold" style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}>100%</div>
            </div>
            <p className="text-sm">Creators earn the full CPM rate. The 20% platform premium is added on deposits — you keep every cent of your earnings.</p>
            <p className="text-xs text-muted-foreground mt-3">Connect Stripe in under 2 minutes. Payouts process automatically.</p>
          </div>
        </div>
      </SectionWrap>

      {/* ═══════════ CLOSER ═══════════ */}
      <section className="relative py-24 md:py-36 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full opacity-10 blur-3xl" style={{background:'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)'}}/>
        <div className="max-w-xl mx-auto px-6 relative z-10">
          <motion.h2 className="text-3xl md:text-5xl font-heading mb-6 tracking-tight" initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            Your content is worth more.
          </motion.h2>
          <motion.p className="text-muted-foreground mb-10 text-base" initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}>
            1,200+ campaigns with real budgets, waiting for creators like you. Free to join. Paid weekly.
          </motion.p>
          <Link href="/login?redirect=/browse" className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-base text-black transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}>
            Join Selah & Start Earning <ArrowRight size={16}/>
          </Link>
          <p className="text-xs text-muted-foreground mt-8">
            <Link href="/browse" className="hover:text-foreground transition-colors">Browse campaigns</Link>
            <span className="mx-3 opacity-30">·</span>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
