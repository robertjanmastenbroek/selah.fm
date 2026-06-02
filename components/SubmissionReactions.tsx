'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  submissionId: string;
  initialCounts?: Record<string, number>;
}

const REACTION_ICONS: Record<string, string> = {
  heart: '❤️',
  fire: '🔥',
  clap: '👏',
  star: '⭐',
};

export default function SubmissionReactions({ submissionId, initialCounts = {} }: Props) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set());
  const [animating, setAnimating] = useState<string | null>(null);

  const handleReact = async (type: string) => {
    const isReacting = !userReactions.has(type);
    // Optimistic update
    setUserReactions(prev => {
      const next = new Set(prev);
      if (isReacting) next.add(type); else next.delete(type);
      return next;
    });
    setCounts(prev => ({
      ...prev,
      [type]: Math.max(0, (prev[type] || 0) + (isReacting ? 1 : -1)),
    }));
    setAnimating(type);
    setTimeout(() => setAnimating(null), 300);

    try {
      const res = await fetch(`/api/submissions/${submissionId}/react`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        const data = await res.json();
        setCounts(data.reactions);
      }
    } catch {
      // Revert on error
      setUserReactions(prev => {
        const next = new Set(prev);
        if (isReacting) next.delete(type); else next.add(type);
        return next;
      });
      setCounts(prev => ({
        ...prev,
        [type]: Math.max(0, (prev[type] || 0) + (isReacting ? -1 : 1)),
      }));
    }
  };

  const activeTypes = Object.keys(REACTION_ICONS).filter(t => counts[t] > 0 || userReactions.has(t));
  if (activeTypes.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeTypes.map(type => (
        <button
          key={type}
          onClick={() => handleReact(type)}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
            userReactions.has(type)
              ? 'bg-primary/10 border border-primary/20 text-primary'
              : 'bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:bg-white/[0.06]'
          }`}
        >
          <motion.span
            animate={animating === type ? { scale: [1, 1.3, 1] } : {}}
            transition={{ duration: 0.3 }}
            className="text-sm"
          >
            {REACTION_ICONS[type]}
          </motion.span>
          <span>{counts[type] || 0}</span>
        </button>
      ))}
    </div>
  );
}
