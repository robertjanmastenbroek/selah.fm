'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music4, Target, Video, ShieldCheck, Star, ArrowRight, Check } from 'lucide-react';

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25,0.1,0.25,1] as const } } };

function SectionWrap({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.section className={`py-20 md:py-28 ${className}`} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
      {children}
    </motion.section>
  );
}

export default function WelcomeArtistsPage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.35) 0%, #0A0A0A 60%), #0A0A0A' }}>
      {/* Top-right sign in */}
      <div className="absolute top-4 right-6 z-20"><Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign In</Link></div>
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/images/artist-hero.png" alt="" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(91,127,255,0.25) 0%, transparent 70%)' }} />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] text-primary/90 text-xs font-medium px-4 py-2 rounded-full mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />Free to start. Takes 2 minutes.
            </span>
          </motion.div>
          <motion.h1 className="text-5xl md:text-7xl font-extrabold tracking-[-0.02em] leading-[1.05] mb-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            Real Promotion for<br /><span className="bg-gradient-to-r from-primary via-[#8B9FFF] to-primary bg-clip-text text-transparent animate-[shimmer_3s_ease-in-out_infinite] bg-[length:200%_100%]">Real Artists.</span>
          </motion.h1>
          <motion.p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>Ditch bots and wasted ad spend. Launch a campaign to have vetted creators share your music in TikToks, Reels &amp; Shorts. You set the budget and only pay for verified views.</motion.p>
          <motion.div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            {['No bots','You set the CPM','Approve every video','Pay only for real views'].map(t=><span key={t} className="flex items-center gap-1"><Check size={14} className="text-primary/60" strokeWidth={2}/>{t}</span>)}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Link href="/dashboard" className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(91,127,255,0.25)] active:scale-[0.97]">Start My Campaign <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5"/></Link>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM */}
      <SectionWrap className="bg-white/[0.01]">
        <motion.div className="text-center mb-16" variants={fadeUp}><p className="text-xs tracking-[0.15em] uppercase text-primary font-semibold mb-4">The Old Way</p><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Why is music promo still broken?</h2><p className="text-muted-foreground max-w-lg mx-auto">You&apos;ve tried everything. Here&apos;s why it didn&apos;t work.</p></motion.div>
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-6">
          {[{ icon: Music4, title: 'Playlist Bots', desc: 'Streams from fake accounts. No real fans, no engagement.' },{ icon: Target, title: 'Black-Box Ads', desc: 'Pour money into TikTok & Meta. Zero guarantee on results.' },{ icon: ShieldCheck, title: 'Overpriced PR', desc: '$2k/month retainers. No tracking, no verification.' }].map((item,i)=>{const I=item.icon;return(
            <motion.div key={i} variants={fadeUp} className="relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-8" whileHover={{y:-2,backgroundColor:'rgba(255,255,255,0.05)',borderColor:'rgba(239,154,154,0.2)'}} whileTap={{scale:0.98}}>
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-xs font-bold">✕</div>
              <div className="w-12 h-12 rounded-xl bg-destructive/[0.06] flex items-center justify-center text-destructive mb-5"><I size={28} strokeWidth={1.5}/></div>
              <h3 className="font-semibold text-base mb-3">{item.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          )})}
        </div>
      </SectionWrap>

      {/* SOLUTION */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Finally, a marketplace that makes sense.</h2><p className="text-muted-foreground max-w-lg mx-auto">Three steps. Total control. Real results.</p></motion.div>
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {[{step:'01',icon:Target,title:'Create Your Campaign',desc:'Upload your track, set a CPM, define your budget.'},{step:'02',icon:Video,title:'Creators Make Content',desc:'Vetted creators browse. Those who love your sound make TikToks.'},{step:'03',icon:ShieldCheck,title:'Approve & Pay',desc:'Review every video. Pay only for verified views.'}].map((s,i)=>{const I=s.icon;return(
            <motion.div key={i} variants={fadeUp} className="group text-center">
              <motion.div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] flex items-center justify-center text-primary" whileHover={{scale:1.08,backgroundColor:'rgba(91,127,255,0.08)'}}><I size={28} strokeWidth={1.5}/></motion.div>
              <p className="text-xs text-primary/60 font-mono tracking-wider mb-3">{s.step}</p><h3 className="font-bold text-lg mb-3">{s.title}</h3><p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">{s.desc}</p>
            </motion.div>
          )})}
        </div>
      </SectionWrap>

      {/* PROOF */}
      <SectionWrap className="bg-white/[0.01]">
        <motion.div className="text-center mb-16" variants={fadeUp}><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Artists are finally getting what they pay for.</h2><p className="text-muted-foreground">Real stories. Real results.</p></motion.div>
        <div className="max-w-2xl mx-auto px-6 space-y-4">
          {[{name:'Marcus J.',role:'Electronic Producer',quote:'I spent thousands on playlists with empty streams. On Selah, $200 got me 15 videos with real, engaged listeners.'},{name:'Sarah K.',role:'Christian EDM Artist',quote:'I wasted $1,500 on playlist pitching. On Selah, $200 got me 6 great videos from real creators.'}].map((t,i)=>(
            <motion.div key={i} variants={fadeUp} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-7" whileHover={{y:-1,borderColor:'rgba(91,127,255,0.15)'}}>
              <div className="flex gap-0.5 mb-4 text-primary/80">{[...Array(5)].map((_,j)=><Star key={j} size={16} fill="currentColor"/>)}</div>
              <p className="text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{t.name[0]}</div><div><div className="text-sm font-semibold">{t.name}</div><div className="text-xs text-muted-foreground">{t.role}</div></div></div>
            </motion.div>
          ))}
        </div>
      </SectionWrap>

      {/* PRICING */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Clear pricing. Always.</h2><p className="text-muted-foreground">No monthly fees. Only pay when you run a campaign.</p></motion.div>
        <div className="max-w-lg mx-auto px-6"><div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden"><div className="p-10 text-center border-b border-white/[0.06]"><p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-semibold mb-8">Where your $100 goes</p><div className="flex items-end justify-center gap-3"><div className="flex flex-col items-center gap-2"><div className="w-28 h-28 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">$80</div><span className="text-xs font-medium">To Creators</span></div><div className="flex flex-col items-center gap-2"><div className="w-16 h-16 rounded-xl bg-white/[0.06] flex items-center justify-center text-muted-foreground text-xl font-medium">$20</div><span className="text-xs text-muted-foreground">Platform</span></div></div></div><div className="px-6 py-4 text-center text-xs text-muted-foreground">Stripe: 2.9% + $0.30 on deposits. Payouts: $0.25 per transfer.</div></div></div>
      </SectionWrap>

      {/* FAQ */}
      <SectionWrap className="bg-white/[0.01]">
        <motion.div className="text-center mb-16" variants={fadeUp}><h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Got questions?</h2></motion.div>
        <div className="max-w-lg mx-auto px-6 space-y-3">
          {[{q:'How do you guarantee real views?',a:'Verified through YouTube\'s public API and manual review. No bots, no fake streams.'},{q:'Can I cap my budget?',a:'Yes. Hard budget and max payout per video.'},{q:'What if I hate a video?',a:'Reject it — you don\'t pay.'},{q:'How is this better than ads?',a:'Ads charge for impressions. We charge for verified views on real creator content.'}].map((faq,i)=>(
            <motion.div key={i} variants={fadeUp} className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5" whileHover={{borderColor:'rgba(91,127,255,0.15)'}}><h3 className="font-semibold text-sm mb-2">{faq.q}</h3><p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p></motion.div>
          ))}
        </div>
      </SectionWrap>

      {/* CLOSER */}
      <section className="relative py-24 md:py-36 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full opacity-10 blur-3xl" style={{background:'radial-gradient(circle, rgba(91,127,255,0.2) 0%, transparent 70%)'}}/>
        <div className="max-w-xl mx-auto px-6 relative z-10">
          <motion.h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight" initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>Ready to stop guessing?</motion.h2>
          <motion.p className="text-muted-foreground mb-10 text-base" initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}>No credit card required to browse. Fund your campaign when you&apos;re ready.</motion.p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(91,127,255,0.3)] active:scale-[0.97]">Start My First Campaign — Free <ArrowRight size={16}/></Link>
          <p className="text-xs text-muted-foreground mt-8"><Link href="/artists" className="hover:text-foreground transition-colors">Browse artists</Link><span className="mx-3 opacity-30">·</span><Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link></p>
        </div>
      </section>
    </div>
  );
}
