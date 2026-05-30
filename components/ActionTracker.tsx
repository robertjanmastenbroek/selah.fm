'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Circle, ArrowRight, Music, Video, DollarSign } from 'lucide-react';

interface ActionStep {
  id: string;
  label: string;
  done: boolean;
  href: string;
  icon: React.ReactNode;
}

export default function ActionTracker({ userType }: { userType?: string }) {
  const [steps, setSteps] = useState<ActionStep[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const d = localStorage.getItem('selah-tracker-dismissed');
      if (d) setDismissed(true);
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, claimsRes, subsRes] = await Promise.all([
          fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/campaigns', { credentials: 'include' }).then(r => r.json()),
          fetch('/api/submissions/mine', { credentials: 'include' }).then(r => r.json()).catch(() => ({ submissions: [] })),
        ]);

        const hasCampaign = (claimsRes?.campaigns || []).length > 0;
        const hasSubmission = (subsRes?.submissions || []).length > 0;
        const role = meRes?.user?.type || userType || 'creator';
        const isArtist = role === 'artist';

        const artistSteps: ActionStep[] = [
          { id: 'onboard', label: 'Complete your profile', done: !!meRes?.onboarded, href: '/onboarding', icon: <Circle size={18} /> },
          { id: 'campaign', label: 'Create your first campaign', done: hasCampaign, href: '/dashboard', icon: <Music size={18} /> },
          { id: 'fund', label: 'Add a budget to start promoting', done: hasCampaign, href: '/dashboard', icon: <DollarSign size={18} /> },
          { id: 'share', label: 'Share your campaign with fans', done: false, href: '/dashboard', icon: <Video size={18} /> },
        ];

        const creatorSteps: ActionStep[] = [
          { id: 'onboard', label: 'Set up your creator profile', done: !!meRes?.onboarded, href: '/onboarding', icon: <Circle size={18} /> },
          { id: 'browse', label: 'Browse campaigns & pick one', done: hasSubmission, href: '/browse', icon: <Music size={18} /> },
          { id: 'submit', label: 'Submit your first video', done: hasSubmission, href: '/browse', icon: <Video size={18} /> },
          { id: 'earn', label: 'Get paid per verified view', done: false, href: '/earnings', icon: <DollarSign size={18} /> },
        ];

        setSteps(isArtist ? artistSteps : creatorSteps);
      } catch {}
    }
    load();
  }, [userType]);

  if (dismissed || steps.length === 0 || steps.every(s => s.done)) return null;

  const doneCount = steps.filter(s => s.done).length;
  const nextStep = steps.find(s => !s.done);

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('selah-tracker-dismissed', '1');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm">Getting started</h3>
            <p className="text-xs text-muted-foreground">{doneCount}/{steps.length} steps done</p>
          </div>
          <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Dismiss
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/[0.06] rounded-full mb-4 overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(doneCount / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step) => (
            <Link
              key={step.id}
              href={step.href}
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-all text-sm ${
                step.done
                  ? 'text-muted-foreground/50'
                  : step.id === nextStep?.id
                  ? 'bg-primary/[0.06] border border-primary/20 text-foreground'
                  : 'text-muted-foreground hover:bg-white/[0.02]'
              }`}
            >
              <span className={step.done ? 'text-[#22C55E]' : step.id === nextStep?.id ? 'text-primary' : 'text-muted-foreground/30'}>
                {step.done ? <Check size={18} /> : step.icon}
              </span>
              <span className="flex-1">{step.label}</span>
              {step.id === nextStep?.id && !step.done && (
                <ArrowRight size={14} className="text-primary" />
              )}
            </Link>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
