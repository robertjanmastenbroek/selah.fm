'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music4, Clapperboard, Sparkles, Upload, Eye, DollarSign, BarChart3, BadgeCheck, Zap, Star, Shield } from 'lucide-react';

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
  const [stats, setStats] = useState({ artists: 0, creators: 0, totalPaidCents: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.4) 0%, #0A0A0A 60%), #0A0A0A';

  return (
    <div className="relative" style={{ background: bg }}>
      {/* Floating gradient blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-[100px] opacity-30 pointer-events-none" />
      <div className="absolute top-40 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-[90px] opacity-25 pointer-events-none" />

      {/* Aurora orb — reacts to mouse */}
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl pointer-events-none z-0"
        animate={{ x: mousePos.x * -3, y: mousePos.y * -3 }}
        transition={{ type: 'spring', stiffness: 50, damping: 30 }}
        style={{ background: 'radial-gradient(circle, rgba(91,127,255,0.4) 0%, transparent 70%)' }}
      />

      {/* ===== HERO SECTION ===== */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative z-10">
        <motion.div
          className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none z-0"
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ rotate: { duration: 30, repeat: Infinity, ease: 'linear' }, scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(91,127,255,0.15) 0%, rgba(91,127,255,0.04) 40%, transparent 70%)',
            boxShadow: '0 0 80px rgba(91,127,255,0.08), 0 0 160px rgba(91,127,255,0.04)',
          }}
        />

        <motion.div
          className="w-full max-w-[672px] space-y-8 relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <img src="/logo-icon.svg" alt="Selah.fm" className="mx-auto h-12 w-auto" />
          </motion.div>

          {/* Two routing cards */}
          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                href: '/welcome-artists',
                icon: Music4,
                title: 'Get your music heard.',
                desc: 'Real creators make content using your music. You approve and pay for verified views.',
                label: "I'm an artist",
                delay: 0.15,
              },
              {
                href: '/welcome-creators',
                icon: Clapperboard,
                title: 'Get paid to create.',
                desc: 'Pick tracks you love, make short videos, and earn per 1,000 verified views.',
                label: "I'm a creator",
                delay: 0.25,
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href} className="group block">
                  <motion.article
                    className="h-full rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-8 flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: card.delay, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                    whileHover={{ y: -4, scale: 1.01, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(91,127,255,0.2)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <motion.div
                      className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center text-primary mb-6"
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(91,127,255,0.12)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <Icon size={32} strokeWidth={1.5} />
                    </motion.div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">{card.title}</h2>
                    <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-[220px]">{card.desc}</p>
                    <Link href={card.href} className="block w-full">
                      <div className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-medium text-sm text-center active:scale-[0.97] transition-transform hover:shadow-[0_0_30px_rgba(91,127,255,0.3)]">
                        {card.label}
                      </div>
                    </Link>
                  </motion.article>
                </Link>
              );
            })}
          </div>

          {/* Sign-in + trust + open source */}
          <motion.div
            className="text-center space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Link href="/login" className="inline-block text-sm text-muted-foreground hover:text-[#A0A0A0] transition-colors duration-200">
              Already have an account? Sign in
            </Link>
            <p className="text-xs text-muted-foreground/50">
              {stats.artists > 0 || stats.creators > 0
                ? `Trusted by ${formatCount(stats.artists)} artists and ${formatCount(stats.creators)} creators`
                : 'The marketplace for music promotion'}
            </p>
            <a
              href="/open-source"
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors mt-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Open source
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 text-muted-foreground/30"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
        </motion.div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative z-10 px-4 py-24 max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight mb-3">How it works</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">A real marketplace connecting artists who need promotion with creators who make content.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Artist path */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Music4 size={20} /></div>
              <h3 className="text-xl font-semibold">For artists</h3>
            </div>
            {[
              { icon: Upload, title: '1. Create campaign', desc: 'Upload your track, set your CPM rate and budget. Decide what kind of content you want.' },
              { icon: Eye, title: '2. Review submissions', desc: 'Creators submit their videos. You approve every one before paying a cent.' },
              { icon: BarChart3, title: '3. See results', desc: 'Track views, engagement, and spending in real-time. Only pay for verified views.' },
            ].map((step, i) => {
              const I = step.icon;
              return (
                <motion.div
                  key={step.title}
                  className="flex gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0"><I size={18} className="text-primary/60" /></div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Creator path */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Clapperboard size={20} /></div>
              <h3 className="text-xl font-semibold">For creators</h3>
            </div>
            {[
              { icon: Eye, title: '1. Browse campaigns', desc: 'Find tracks you love with budgets that match your reach. No auditions required.' },
              { icon: Upload, title: '2. Create & submit', desc: 'Make a TikTok, Reel, or Short. Paste the link. Done in 30 seconds.' },
              { icon: DollarSign, title: '3. Get paid', desc: 'Artist approves → you earn per 1,000 verified views. Instant payout to your bank.' },
            ].map((step, i) => {
              const I = step.icon;
              return (
                <motion.div
                  key={step.title}
                  className="flex gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0"><I size={18} className="text-primary/60" /></div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{step.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ===== TRUST / PROOF ===== */}
      <section className="relative z-10 px-4 py-24" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(30,40,80,0.15) 0%, transparent 70%)' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold tracking-tight mb-3">Built for fairness</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">No scams. No fake views. Just a marketplace that works.</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: BadgeCheck, title: 'Verified views', desc: 'Only organic views count. No bots. No tricks.' },
              { icon: Zap, title: 'Instant payout', desc: 'Get paid via Stripe as soon as the artist approves.' },
              { icon: Shield, title: 'You own everything', desc: 'Your video, your music. We never claim ownership.' },
              { icon: Star, title: formatMoney(stats.totalPaidCents || 0) + '+ paid', desc: 'To creators for real, verified views.' },
            ].map((item, i) => {
              const I = item.icon;
              return (
                <motion.div
                  key={item.title}
                  className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6 text-center"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <I size={24} className="mx-auto mb-3 text-primary/50" />
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
        <motion.div
          className="max-w-md mx-auto text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold tracking-tight">Ready to amplify your music?</h2>
          <p className="text-sm text-muted-foreground">Join hundreds of artists and creators already on Selah.fm.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/welcome-artists">
              <div className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.97] transition-all hover:shadow-[0_0_30px_rgba(91,127,255,0.3)] cursor-pointer">
                Artist sign up
              </div>
            </Link>
            <Link href="/welcome-creators">
              <div className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] font-semibold text-sm hover:bg-white/[0.08] active:scale-[0.97] transition-all cursor-pointer">
                Creator sign up
              </div>
            </Link>
            <Link href="/browse">
              <div className="px-6 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] font-semibold text-sm hover:bg-white/[0.08] active:scale-[0.97] transition-all cursor-pointer">
                Browse campaigns
              </div>
            </Link>
          </div>

          {/* Open source footer */}
          <div className="pt-8 border-t border-white/[0.04]">
            <p className="text-xs text-muted-foreground/60">Selah.fm is fully open source under the MIT license.</p>
            <a
              href="https://github.com/robertjanmastenbroek/selah.fm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors mt-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Star on GitHub
            </a>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
