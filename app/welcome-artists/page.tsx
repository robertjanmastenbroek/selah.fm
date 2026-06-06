'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('welcome');

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ background: '#0F0F23' }}>
      {/* Top-right sign in */}
      <div className="absolute top-4 right-6 z-20"><Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t('signIn')}</Link></div>

      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.25) 0%, transparent 70%)' }} />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] text-primary/90 text-xs font-medium px-4 py-2 rounded-full mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />{t('freeToStart')}
            </span>
          </motion.div>
          <motion.h1 className="text-5xl md:text-7xl font-heading tracking-[-0.02em] leading-[1.05] mb-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
            {t('heroTitle1')}<br /><span className="bg-gradient-to-r from-[#4338CA] via-[#4338CA] to-[#22C55E] bg-clip-text text-transparent">{t('heroTitle2')}</span>
          </motion.h1>
          <motion.p className="text-lg text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>{t('heroSubtitle')}</motion.p>
          <motion.div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            {[t('badgeNoBots'), t('badgeSetCpm'), t('badgeApprove'), t('badgePayReal')].map((text) => (
              <span key={text} className="flex items-center gap-1"><Check size={14} className="text-accent" strokeWidth={2}/>{text}</span>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Link href="/login?redirect=/onboarding" className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(67,56,202,0.35)] active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #4338CA, #4338CA)' }}>
              {t('ctaAddTrack')} <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5"/>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* PROBLEM */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}>
          <p className="text-xs tracking-[0.15em] uppercase text-accent font-semibold mb-4">{t('sectionOldWay')}</p>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">{t('sectionWhyBroken')}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{t('sectionWhyBrokenSub')}</p>
        </motion.div>
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-6">
          {[
            { icon: Music4, titleKey: 'problemPlaylistBots', descKey: 'problemPlaylistBotsDesc' },
            { icon: Target, titleKey: 'problemBlackBox', descKey: 'problemBlackBoxDesc' },
            { icon: ShieldCheck, titleKey: 'problemOverpriced', descKey: 'problemOverpricedDesc' },
          ].map((item, i) => {
            const I = item.icon;
            return (
              <motion.div key={i} variants={fadeUp} className="relative rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-8" whileHover={{y:-2,backgroundColor:'rgba(255,255,255,0.05)',borderColor:'rgba(239,68,68,0.2)'}} whileTap={{scale:0.98}}>
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-xs font-bold">✕</div>
                <div className="w-12 h-12 rounded-xl bg-destructive/[0.06] flex items-center justify-center text-destructive mb-5"><I size={28} strokeWidth={1.5}/></div>
                <h3 className="font-semibold text-base mb-3">{t(item.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
              </motion.div>
            );
          })}
        </div>
      </SectionWrap>

      {/* SOLUTION */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">{t('sectionSolutionTitle')}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{t('sectionSolutionSub')}</p>
        </motion.div>
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {[
            { step: '01', icon: Target, titleKey: 'stepAddTrack', descKey: 'stepAddTrackDesc' },
            { step: '02', icon: Video, titleKey: 'stepCreators', descKey: 'stepCreatorsDesc' },
            { step: '03', icon: ShieldCheck, titleKey: 'stepApprove', descKey: 'stepApproveDesc' },
          ].map((s, i) => {
            const I = s.icon;
            return (
              <motion.div key={i} variants={fadeUp} className="group text-center">
                <motion.div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] flex items-center justify-center text-primary" whileHover={{scale:1.08,backgroundColor:'rgba(67,56,202,0.08)'}}><I size={28} strokeWidth={1.5}/></motion.div>
                <p className="text-xs text-accent font-mono tracking-wider mb-3">{s.step}</p>
                <h3 className="font-heading text-lg mb-3">{t(s.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px] mx-auto">{t(s.descKey)}</p>
              </motion.div>
            );
          })}
        </div>
      </SectionWrap>

      {/* PROOF */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">{t('sectionProofTitle')}</h2>
          <p className="text-muted-foreground">{t('sectionProofSub')}</p>
        </motion.div>
        <div className="max-w-2xl mx-auto px-6 space-y-4">
          {[
            { name: t('testimonial1Name'), role: t('testimonial1Role'), quote: t('testimonial1Quote') },
            { name: t('testimonial2Name'), role: t('testimonial2Role'), quote: t('testimonial2Quote') },
          ].map((testimonial, i) => (
            <motion.div key={i} variants={fadeUp} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-7" whileHover={{y:-1,borderColor:'rgba(67,56,202,0.15)'}}>
              <div className="flex gap-0.5 mb-4 text-accent/80">{[...Array(5)].map((_,j) => <Star key={j} size={16} fill="currentColor"/>)}</div>
              <p className="text-sm leading-relaxed mb-5 italic">&ldquo;{testimonial.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{testimonial.name[0]}</div>
                <div>
                  <div className="text-sm font-semibold">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </SectionWrap>

      {/* PRICING */}
      <SectionWrap>
        <motion.div className="text-center mb-16" variants={fadeUp}>
          <h2 className="text-3xl md:text-4xl font-heading tracking-tight mb-4">{t('sectionPricingTitle')}</h2>
          <p className="text-muted-foreground">{t('sectionPricingSub')}</p>
        </motion.div>
        <div className="max-w-lg mx-auto px-6">
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
            <div className="p-10 text-center border-b border-white/[0.06]">
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground font-semibold mb-8">{t('pricingWhereGoes')}</p>
              <div className="flex items-end justify-center gap-3">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-white text-3xl font-bold" style={{ background: 'linear-gradient(135deg, #4338CA, #4338CA)' }}>$80</div>
                  <span className="text-xs font-medium">{t('pricingToCreators')}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-xl bg-white/[0.06] flex items-center justify-center text-muted-foreground text-xl font-medium">$20</div>
                  <span className="text-xs text-muted-foreground">{t('pricingPlatform')}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 text-center text-xs text-muted-foreground">{t('pricingStripeNote')}</div>
          </div>
        </div>
      </SectionWrap>

      {/* CLOSER */}
      <section className="relative py-24 md:py-36 text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] rounded-full opacity-10 blur-3xl" style={{background:'radial-gradient(circle, rgba(67,56,202,0.2) 0%, transparent 70%)'}}/>
        <div className="max-w-xl mx-auto px-6 relative z-10">
          <motion.h2 className="text-3xl md:text-5xl font-heading mb-6 tracking-tight" initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>{t('closerTitle')}</motion.h2>
          <motion.p className="text-muted-foreground mb-10 text-base" initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}>{t('closerSubtitle')}</motion.p>
          <Link href="/login?redirect=/onboarding" className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-semibold text-base text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_32px_rgba(67,56,202,0.35)] active:scale-[0.97]" style={{ background: 'linear-gradient(135deg, #4338CA, #4338CA)' }}>{t('ctaAddTrackFree')} <ArrowRight size={16}/></Link>
          <p className="text-xs text-muted-foreground mt-8">
            <Link href="/browse" className="hover:text-foreground transition-colors">{t('browseArtists')}</Link>
            <span className="mx-3 opacity-30">·</span>
            <Link href="/login" className="hover:text-foreground transition-colors">{t('signIn')}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
