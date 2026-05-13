'use client';

import { motion } from 'framer-motion';
import { Search, FileSearch, Megaphone, Send, Check, ChevronRight, Disc3, Zap } from 'lucide-react';

export default function EmptyState({ onDiscover }: { onDiscover: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl bg-white/[0.02] border border-white/[0.06] p-12 md:p-16 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
        className="w-20 h-20 rounded-2xl bg-primary/10 mx-auto mb-6 flex items-center justify-center"
      >
        <Disc3 size={36} className="text-primary/60" />
      </motion.div>
      <h2 className="text-xl font-bold mb-2">No artists discovered yet</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
        Discover independent artists across Bandcamp, Reddit, and YouTube.
        Audit their social presence, build campaigns, and reach out via Instagram DM — all automated.
      </p>
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/60 mb-8 font-medium">
        <span className="flex items-center gap-1.5"><Search size={12} /> Discover</span>
        <ChevronRight size={10} />
        <span className="flex items-center gap-1.5"><FileSearch size={12} /> Audit</span>
        <ChevronRight size={10} />
        <span className="flex items-center gap-1.5"><Megaphone size={12} /> Campaign</span>
        <ChevronRight size={10} />
        <span className="flex items-center gap-1.5"><Send size={12} /> Outreach</span>
        <ChevronRight size={10} />
        <span className="flex items-center gap-1.5"><Check size={12} /> Claim</span>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onDiscover}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base
                   hover:shadow-[0_0_30px_rgba(67,56,202,0.25)] transition-shadow duration-300"
      >
        <Zap size={18} />
        Start discovering artists
      </motion.button>
    </motion.div>
  );
}
