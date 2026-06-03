'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';

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
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);

  // Check auth status once
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setIsAuthed(!!d.user))
      .catch(() => setIsAuthed(false));
  }, []);

  const handleReact = async (type: string) => {
    // If auth not checked yet, or user is not authed, show sign-in prompt
    if (!isAuthed) {
      setShowSignIn(true);
      return;
    }

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
      } else if (res.status === 401) {
        // Session expired — revert and show sign-in
        setUserReactions(prev => {
          const next = new Set(prev);
          if (isReacting) next.delete(type); else next.add(type);
          return next;
        });
        setCounts(prev => ({
          ...prev,
          [type]: Math.max(0, (prev[type] || 0) + (isReacting ? -1 : 1)),
        }));
        setShowSignIn(true);
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
    <>
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

      {/* Sign-in prompt overlay */}
      <AnimatePresence>
        {showSignIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSignIn(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-sm rounded-2xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl p-6 text-center space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <Heart size={32} className="mx-auto text-red-400" />
              <h3 className="font-bold text-lg">Sign in to react</h3>
              <p className="text-sm text-muted-foreground">
                Show your appreciation for creators' videos. Sign in with Google to react and leave comments.
              </p>
              <a
                href="/login"
                className="block w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
              >
                Sign in with Google
              </a>
              <button
                onClick={() => setShowSignIn(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Maybe later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
