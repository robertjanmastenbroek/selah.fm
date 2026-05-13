'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { DollarSign, Smartphone, Wallet, Star, ArrowRight, Check, Search, Camera } from 'lucide-react';

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25,0.1,0.25,1] as const } } };

function SectionWrap({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (<motion.section className={`py-20 md:py-28 ${className}`} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>{children}</motion.section>);
}

export default function WelcomeCreatorsPage() {
  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: '#0F0F23' }}>
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)' }} />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}><span className="inline-flex items-center gap-1.5 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] text-accent text-xs font-medium px-4 py-2 rounded-full mb-10"><span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"/>Free to join. No weird contracts.</span></motion.div>
          <motion.h1 className="text-5xl md:text-7xl font-heading tracking-[-0.02em] leading-[1.05] mb-8" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.5}}>Make Content.<br/><span className="bg-gradient-to-r from-[#22C55E] via-[#4ADE80] to-[#4338CA] bg-clip-text text-transparent">Get Paid.</span></motion.h1>
          <motion.p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}}>Turn your creativity into cash. Use TikTok, Instagram & YouTube Shorts to promote music you love, and earn based on real views.</motion.p>
          <motion.div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground mb-12" initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.25}}>
            {['No upfront costs','Earn per 1,000 views','Choose tracks you love','Fast, secure payouts'].map(t=><span key={t} className="flex items-center gap-1"><Check size={14} className="text-accent" strokeWidth={2}/>{t}</span>)}
          </motion.div>
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
            <Link href="/login?redirect=/browse" className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-black transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}>
              Start Earning Today <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5"/>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* OPPORTUNITY */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}><p className="text-xs tracking-[0.15em] uppercase text-accent font-semibold mb-4">The Reality</p><h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">You're already making content. Now get paid fairly for it.</h2><p className="text-muted-foreground max-w-lg mx-auto">The creator hustle is real.</p></motion.div>
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-6">
          {[{icon:DollarSign,title:'Unpredictable Brand Deals',desc:'Hunting for sponsors is a full-time job. Stop DMing 50 brands for a $50 offer.'},{icon:Smartphone,title:'Algorithm-Dependent Income',desc:'Monetization programs keep changing the rules. You deserve stable, transparent earnings.'},{icon:Wallet,title:"Exposure Doesn't Pay Rent",desc:"You've been asked to work for exposure too many times. On Selah, every view has a dollar value."}].map((item,i)=>{const I=item.icon;return(
            <motion.div key={i} variants={fadeUp} className="relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-8" whileHover={{y:-2,backgroundColor:'rgba(255,255,255,0.05)',borderColor:'rgba(34,197,94,0.2)'}} whileTap={{scale:0.98}}>
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold">✓</div>
              <div className="w-12 h-12 rounded-xl bg-accent/[0.06] flex items-center justify-center text-accent mb-5"><I size={28} strokeWidth={1.5}/></div>
              <h3 className="font-semibold text-base mb-3">{item.title}</h3><p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          )})}
        </div>
      </SectionWrap>

      {/* HOW IT WORKS */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}><h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">It's simple: Create, Post, and Earn.</h2><p className="text-muted-foreground max-w-lg mx-auto">Three steps from track to payout.</p></motion.div>
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {[{step:'01',icon:Search,title:'Pick a Track You Love',desc:'Browse new music from independent artists. Connect your TikTok, Instagram, or YouTube instantly.'},{step:'02',icon:Camera,title:'Create Authentic Content',desc:'Use the track in your short-form videos in a way that feels natural to your style.'},{step:'03',icon:DollarSign,title:'Get Paid for Real Views',desc:'Artists approve your video. Every 1,000 verified views earns you cash.'}].map((s,i)=>{const I=s.icon;return(
            <motion.div key={i} variants={fadeUp} className="group text-center">
              <motion.div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] flex items-center justify-center text-accent" whileHover={{scale:1.08,backgroundColor:'rgba(34,197,94,0.08)'}}><I size={28} strokeWidth={1.5}/></motion.div>
              <p className="text-xs text-accent font-mono tracking-wider mb-3">{s.step}</p><h3 className="font-heading text-lg mb-3">{s.title}</h3><p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">{s.desc}</p>
            </motion.div>
          )})}
        </div>
      </SectionWrap>

      {/* PROOF */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}><h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">Join hundreds of creators already earning.</h2><p className="text-muted-foreground">Real payouts. Real stories.</p></motion.div>
        <div className="max-w-2xl mx-auto px-6 space-y-4">
          {[{name:'Chloe B.',role:'TikTok Creator',quote:'I saw a track I loved, posted a 30-second Reel, and got paid $85 three days later.'},{name:'Mia J.',role:'Lifestyle Creator · 28K',quote:'I love browsing and picking tracks that fit my style. Made $340 last month from 3 videos.'}].map((t,i)=>(
            <motion.div key={i} variants={fadeUp} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-7" whileHover={{y:-1,borderColor:'rgba(67,56,202,0.15)'}}>
              <div className="flex gap-0.5 mb-4 text-accent/80">{[...Array(5)].map((_,j)=><Star key={j} size={16} fill="currentColor"/>)}</div>
              <p className="text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{t.name[0]}</div><div><div className="text-sm font-semibold">{t.name}</div><div className="text-xs text-muted-foreground">{t.role}</div></div></div>
            </motion.div>
          ))}
        </div>
      </SectionWrap>

      {/* FEES */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}><h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">You keep the lion's share.</h2><p className="text-muted-foreground">80% of every payout goes to you. We take 20% to run the platform.</p></motion.div>
        <div className="max-w-lg mx-auto px-6"><div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden text-center p-10"><div className="flex items-end justify-center gap-3 mb-6"><div className="w-28 h-28 rounded-2xl flex items-center justify-center text-black text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}>80%</div><div className="w-16 h-16 rounded-xl bg-white/[0.06] flex items-center justify-center text-muted-foreground text-xl font-medium">20%</div></div><p className="text-sm">Platform fee covers Stripe, support, and operations.</p><p className="text-xs text-muted-foreground mt-3">Connect Stripe in under 2 minutes. Payouts process automatically.</p></div></div>
      </SectionWrap>

      {/* CLOSER */}
      <section className="relative py-24 md:py-36 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full opacity-10 blur-3xl" style={{background:'radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)'}}/>
        <div className="max-w-xl mx-auto px-6 relative z-10">
          <motion.h2 className="text-3xl md:text-5xl font-heading mb-6 tracking-tight" initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>Your content is worth more.</motion.h2>
          <motion.p className="text-muted-foreground mb-10 text-base" initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}>Connect your accounts in under 2 minutes. No cost to join.</motion.p>
          <Link href="/login?redirect=/browse" className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-base text-black transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #22C55E, #4ADE80)' }}>Join Selah & Start Earning <ArrowRight size={16}/></Link>
          <p className="text-xs text-muted-foreground mt-8"><Link href="/creators" className="hover:text-foreground transition-colors">Browse creators</Link><span className="mx-3 opacity-30">·</span><Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link></p>
        </div>
      </section>
    </div>
  );
}
