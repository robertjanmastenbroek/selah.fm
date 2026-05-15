'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Megaphone, Send, Check, Clock, BarChart3, Users, RefreshCw, Zap, Loader2 } from 'lucide-react';
import StatCard from './components/StatCard';
import { useToasts, ToastContainer } from './components/ToastBar';

interface PipelineData {
  pipeline: {
    discovered: number; awaiting_audit: number; audited: number;
    campaigns_created: number; outreach_sent: number; claimed: number; declined: number;
  };
  outreach: { total_sent: number; replies: number };
  recent: any[];
}

export default function OutreachDashboard() {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, dismissToast } = useToasts();

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/outreach', { credentials: 'include' });
      const data = await res.json();
      if (data.error) { addToast('error', data.error); setLoading(false); return; }
      setPipeline(data);
    } catch (e: any) {
      addToast('error', e.message || 'Failed to load');
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  const p = pipeline?.pipeline || { discovered: 0, awaiting_audit: 0, audited: 0, campaigns_created: 0, outreach_sent: 0, claimed: 0, declined: 0 };
  const o = pipeline?.outreach || { total_sent: 0, replies: 0 };

  return (
    <div className="space-y-6 pb-12">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outreach Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover → Audit → Campaign → Outreach → Claim</p>
        </div>
      </div>

      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
        {[
          { label: 'Discovered', value: p.discovered, icon: Search, color: 'text-blue-400' },
          { label: 'Awaiting', value: p.awaiting_audit, icon: Clock, color: 'text-gray-400' },
          { label: 'Audited', value: p.audited, icon: ({ size }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>, color: 'text-purple-400' },
          { label: 'Campaigns', value: p.campaigns_created, icon: Megaphone, color: 'text-amber-400' },
          { label: 'Outreach', value: p.outreach_sent, icon: Send, color: 'text-green-400' },
          { label: 'Claimed', value: p.claimed, icon: Check, color: 'text-emerald-400' },
          { label: 'Replies', value: o.replies, icon: BarChart3, color: 'text-pink-400' },
        ].map((s, i) => <StatCard key={s.label} {...s} delay={i} />)}
      </div>
    </div>
  );
}
