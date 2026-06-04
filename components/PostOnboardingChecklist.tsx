"use client";

import { useState, useEffect } from 'react';
import { Check, ArrowRight, Music, CreditCard, Upload, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  href?: string;
  action?: () => void;
}

interface Props {
  isArtist: boolean;
  artistTracks: number;
  hasBudget: boolean;
  hasStripe: boolean;
  onDismiss?: () => void;
}

export function PostOnboardingChecklist({ isArtist, artistTracks, hasBudget, hasStripe, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('selah-checklist');
    if (saved) setCompleted(new Set(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    localStorage.setItem('selah-checklist', JSON.stringify([...completed]));
  }, [completed]);

  const items: ChecklistItem[] = isArtist ? [
    { id: 'import', label: 'Import your music', description: 'Connect Spotify to auto-import tracks', icon: Music, href: '/dashboard?tab=profile' },
    { id: 'budget', label: 'Set a campaign budget', description: 'Fund your first track promotion', icon: CreditCard, href: '/dashboard?tab=tracks' },
    { id: 'share', label: 'Share your artist page', description: 'Let fans know you\'re on Selah.fm', icon: Share2, href: `/dashboard` },
  ] : [
    { id: 'browse', label: 'Browse campaigns', description: 'Find tracks that match your style', icon: Upload, href: '/browse' },
    { id: 'submit', label: 'Submit your first video', description: 'Create content and submit for review', icon: Music, href: '/browse' },
    { id: 'stripe', label: 'Set up payouts', description: 'Connect Stripe to receive earnings', icon: CreditCard, action: async () => { window.location.href = '/dashboard?tab=earnings'; } },
  ];

  // Auto-complete items based on user state
  useEffect(() => {
    const autoComplete = new Set(completed);
    if (isArtist && artistTracks > 0) autoComplete.add('import');
    if (isArtist && hasBudget) autoComplete.add('budget');
    if (!isArtist && hasStripe) autoComplete.add('stripe');
    if (autoComplete.size > completed.size) setCompleted(autoComplete);
  }, [artistTracks, hasBudget, hasStripe]);

  if (dismissed) return null;

  const allDone = items.every(i => completed.has(i.id));
  if (allDone) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-primary/[0.04] to-emerald-500/[0.02] border border-primary/10 p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Check size={14} className="text-emerald-400" />
          {isArtist ? 'Get started' : 'Start earning'}
        </h3>
        <button onClick={() => { setDismissed(true); onDismiss?.(); }}
          className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          Dismiss
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => {
          const done = completed.has(item.id);
          const Icon = item.icon;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                done ? 'bg-emerald-500/[0.04] border border-emerald-500/10' : 'bg-white/[0.02] border border-white/[0.04] hover:border-primary/20'
              }`}
            >
              {done ? (
                <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Check size={12} className="text-emerald-400" />
                </div>
              ) : item.href || item.action ? (
                <Link href={item.href || '#'} onClick={item.action ? (e) => { e.preventDefault(); item.action?.(); } : undefined}
                  className="w-7 h-7 rounded-full bg-primary/[0.08] flex items-center justify-center shrink-0 hover:bg-primary/[0.12] transition-colors">
                  <ArrowRight size={12} className="text-primary" />
                </Link>
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center shrink-0">
                  <Icon size={12} className="text-muted-foreground/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${done ? 'text-emerald-400 line-through' : 'text-foreground'}`}>
                  {item.label}
                </p>
                <p className="text-[10px] text-muted-foreground/50">{item.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
