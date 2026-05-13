'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Megaphone, Send, Check, Clock, BarChart3, Users, RefreshCw, Zap, Loader2, Disc3 } from 'lucide-react';
import StatCard from './components/StatCard';
import { useToasts, ToastContainer } from './components/ToastBar';
import OutreachQueue from './components/OutreachQueue';
import ArtistCard from './components/ArtistCard';
import EmptyState from './components/EmptyState';

interface PipelineStats {
  discovered: number;
  awaiting_audit: number;
  audited: number;
  campaigns_created: number;
  outreach_sent: number;
  claimed: number;
  declined: number;
}

interface PipelineData {
  pipeline: PipelineStats;
  outreach: { total_sent: number; replies: number };
  recent: any[];
}

export default function OutreachDashboard() {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const { toasts, addToast, dismissToast } = useToasts();
  const [artists, setArtists] = useState<any[]>([]);

  const api = useCallback(async (action: string, body: any = {}) => {
    const res = await fetch('/api/admin/outreach', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Server error (${res.status}): ${text.slice(0, 100)}`);
    }
    return res.json();
  }, []);

  const fetchPipeline = useCallback(async () => {
    try {
      const data = await fetch('/api/admin/outreach', { credentials: 'include' }).then(r => r.json());
      if (data.error) { addToast('error', 'Could not load pipeline', data.error); }
      else { setPipeline(data); setArtists(data.recent || []); }
    } catch {
      addToast('error', 'Could not load pipeline', 'Check your connection.');
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  // ── Actions ──
  const runDiscovery = async () => {
    setActionLoading('discover');
    try {
      const data = await api('discover', { limit: 15 });
      if (data.error) { addToast('error', 'Discovery failed', data.error); }
      else if (data.discovered === 0) { addToast('info', 'No artists found', data.diagnostics?.join(' · ') || 'No results'); }
      else { addToast('success', `Found ${data.discovered} artists`, `Stored ${data.stored} new · ${data.total_in_db} total`); fetchPipeline(); }
    } catch (e: any) { addToast('error', 'Discovery failed', e.message); }
    setActionLoading('');
  };

  const runAudit = async (artistId: string) => {
    setActionLoading(`audit-${artistId}`);
    try {
      const data = await api('audit', { artistId });
      if (data.error) { addToast('error', 'Audit failed', data.error); }
      else if (data.status === 'declined') { addToast('info', `${data.artist?.artist_name} — No Instagram`, 'Auto-declined. Can\'t DM without IG.'); }
      else { addToast('success', `Audited ${data.artist?.artist_name}`, 'Ready to create campaign.'); }
      fetchPipeline();
    } catch (e: any) { addToast('error', 'Audit failed', e.message); }
    setActionLoading('');
  };

  const createCampaign = async (artistId: string) => {
    setActionLoading(`campaign-${artistId}`);
    try {
      const data = await api('create_campaign', { artistId });
      if (data.error) { addToast('error', 'Campaign creation failed', data.error); }
      else { addToast('success', 'Campaign created', data.campaign_url); fetchPipeline(); }
    } catch (e: any) { addToast('error', 'Campaign creation failed', e.message); }
    setActionLoading('');
  };

  const renderOutreach = async (artistId: string, igHandle?: string, ttHandle?: string) => {
    setActionLoading(`outreach-${artistId}`);
    try {
      const data = await api('render_outreach', { artistId });
      if (data.error) { addToast('error', 'Could not render message', data.error); setActionLoading(''); return; }
      await navigator.clipboard.writeText(data.message);
      const ig = data.instagram_handle || igHandle;
      if (ig) window.open(`https://ig.me/m/${ig}`, '_blank');
      const detail = ig ? `📋 Copied · 📸 IG: https://ig.me/m/${ig}` : '📋 Copied to clipboard';
      addToast('success', `Message copied — ${data.artist_name}`, detail);
    } catch (e: any) { addToast('error', 'Could not render message', e.message); }
    setActionLoading('');
  };

  const renderFollowUp = async (artistId: string) => {
    setActionLoading(`followup-${artistId}`);
    try {
      const data = await api('render_follow_up', { artistId });
      if (data.error) { addToast('error', 'Could not render follow-up', data.error); }
      else { await navigator.clipboard.writeText(data.message); addToast('success', 'Follow-up copied', `Ready to send to ${data.artist_name}.`); }
    } catch (e: any) { addToast('error', 'Could not render follow-up', e.message); }
    setActionLoading('');
  };

  const skipArtist = async (artistId: string) => {
    setActionLoading(`skip-${artistId}`);
    try { await api('decline', { artistId }); addToast('success', 'Artist skipped', 'Marked as declined.'); fetchPipeline(); }
    catch (e: any) { addToast('error', 'Could not skip', e.message); }
    setActionLoading('');
  };

  const batchAudit = async () => {
    setActionLoading('batch-audit');
    try {
      const data = await api('batch_audit', { limit: 5 });
      if (data.error) { addToast('error', 'Batch audit failed', data.error); }
      else { addToast('success', `Audited ${data.audited || 0} artists`, data.skipped ? `${data.skipped} failed` : ''); fetchPipeline(); }
    } catch (e: any) { addToast('error', 'Batch audit failed', e.message); }
    setActionLoading('');
  };

  const logOutreach = async (artistId: string) => {
    setActionLoading(`log-${artistId}`);
    try { await api('log_outreach', { artistId, channel: 'instagram_dm', status: 'sent' }); addToast('success', 'Outreach logged', 'Marked as sent via Instagram DM.'); fetchPipeline(); }
    catch (e: any) { addToast('error', 'Could not log outreach', e.message); }
    setActionLoading('');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="w-10 h-10 mx-auto rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading pipeline…</p>
        </motion.div>
      </div>
    );
  }

  const p = pipeline?.pipeline || { discovered: 0, awaiting_audit: 0, audited: 0, campaigns_created: 0, outreach_sent: 0, claimed: 0, declined: 0 };
  const o = pipeline?.outreach || { total_sent: 0, replies: 0 };

  return (
    <div className="space-y-6 pb-12">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outreach Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover → Audit → Campaign → Outreach → Claim</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={runDiscovery} disabled={actionLoading === 'discover'}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm
                     hover:shadow-[0_0_30px_rgba(67,56,202,0.25)] disabled:opacity-50 disabled:cursor-not-allowed transition-shadow duration-300">
          {actionLoading === 'discover' ? <><Loader2 size={16} className="animate-spin" />Discovering…</> : <><Search size={16} />Discover Artists</>}
        </motion.button>
      </motion.div>

      {/* Pipeline stats */}
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

      {/* Ready for Outreach */}
      <OutreachQueue count={p.campaigns_created - p.outreach_sent}
        actionLoading={actionLoading} setActionLoading={setActionLoading} addToast={addToast}
        fetchPipeline={fetchPipeline} onLogOutreach={logOutreach} />

      {/* Artist list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users size={14} className="text-primary" />Discovered Artists
            {artists.length > 0 && <span className="text-[10px] text-muted-foreground font-normal">{artists.length} showing</span>}
          </h2>
          {artists.length > 0 && (
            <div className="flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={batchAudit} disabled={actionLoading === 'batch-audit'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium
                           bg-purple-500/10 text-purple-400 border border-purple-500/20
                           hover:bg-purple-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {actionLoading === 'batch-audit' ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}Audit 5
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchPipeline}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium
                           bg-white/[0.03] border border-white/[0.06] text-muted-foreground
                           hover:text-foreground hover:border-white/[0.12] transition-all">
                <RefreshCw size={11} />Refresh
              </motion.button>
            </div>
          )}
        </div>
        {artists.length === 0 ? <EmptyState onDiscover={runDiscovery} /> : (
          <motion.div layout className="space-y-2">
            <AnimatePresence mode="popLayout">
              {artists.map((a: any) => (
                <ArtistCard key={a.id} artist={a} actionLoading={actionLoading}
                  onAudit={runAudit} onCreateCampaign={createCampaign}
                  onRenderOutreach={renderOutreach} onRenderFollowUp={renderFollowUp}
                  onLogOutreach={logOutreach} onSkip={skipArtist} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
