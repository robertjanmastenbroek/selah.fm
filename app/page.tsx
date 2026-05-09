'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music4, Clapperboard, Sparkles } from 'lucide-react';

export default function SplitterPage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: (e.clientX / window.innerWidth - 0.5) * 20, y: (e.clientY / window.innerHeight - 0.5) * 20 });
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden" style={{
      background: 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.4) 0%, #0A0A0A 60%), #0A0A0A',
    }}>
      {/* Aurora gradient orb — reacts to mouse */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        animate={{ x: mousePos.x * -2, y: mousePos.y * -2 }}
        transition={{ type: 'spring', stiffness: 50, damping: 30 }}
        style={{ background: 'radial-gradient(circle, rgba(91,127,255,0.3) 0%, transparent 70%)' }}
      />

      {/* 3D-like crystal orb — centerpiece */}
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
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]">
            <Sparkles size={14} className="text-primary" />
            <span className="text-sm font-medium text-muted-foreground tracking-wide">Selah<span className="text-primary">.fm</span></span>
          </span>
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
                  <motion.div
                    className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-medium text-sm text-center"
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(91,127,255,0.3)' }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {card.label}
                  </motion.div>
                </motion.article>
              </Link>
            );
          })}
        </div>

        {/* Sign-in + trust */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link href="/login" className="inline-block text-sm text-muted-foreground hover:text-[#A0A0A0] transition-colors duration-200">
            Already have an account? Sign in
          </Link>
          <p className="text-xs text-muted-foreground/50">Trusted by 200+ artists and 390+ creators</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
