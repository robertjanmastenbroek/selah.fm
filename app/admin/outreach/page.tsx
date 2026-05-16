'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Megaphone, Send, Check, Clock, BarChart3, Users, RefreshCw, Zap, Loader2, Mail } from 'lucide-react';
import StatCard from './components/StatCard';
import { useToasts, ToastContainer } from './components/ToastBar';
import ArtistCard from './components/ArtistCard';
import EmptyState from './components/EmptyState';

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
  const [actionLoading, setActionLoading] = useState('');
  const { toasts, addToast, dismissToast } = useToasts();
  const [artists, setArtists] = useState<any[]>([]);
  const [readyForCampaign, setReadyForCampaign] = useState<any[]>([]);

  const api = useCallback(async (action: string, body: any = {}) => {
    const res = await fetch('/api/admin/outreach', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      let msg = `Server error (${res.status})`;
      try { const j = JSON.parse(text); if (j.error) msg = j.error; } catch {}
      throw new Error(msg);
    }
    return res.json();
  }, []);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/outreach', { credentials: 'include' });
      const data = await res.json();
      if (data.error) { addToast('error', data.error); setLoading(false); return; }
      setPipeline(data);
      setArtists(data.recent || []);
      try {
        const rfcRes = await api('get_ready_for_campaign');
        if (!rfcRes.error) setReadyForCampaign(Array.isArray(rfcRes) ? rfcRes : []);
      } catch {}
    } catch (e: any) {
      addToast('error', e.message || 'Failed to load');
    }
    setLoading(false);
  }, [addToast, api]);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  const runDiscovery = async () => {
    setActionLoading('discover');
    try {
      const data = await api('discover', { limit: 15 });
      if (data.error) addToast('error', 'Discovery failed', data.error);
      else if (data.discovered === 0) addToast('info', 'No artists found');
      else { addToast('success', `Found ${data.discovered} artists`); fetchPipeline(); }
    } catch (e: any) { addToast('error', e.message); }
    setActionLoading('');
  };

  const runAudit = async (artistId: string) => {
    setActionLoading(`audit-${artistId}`);
    try {
      const data = await api('audit', { artistId });
      if (data.error) addToast('error', 'Audit failed', data.error);
      else addToast('success', `Audited ${data.artist?.artist_name}`);
      fetchPipeline();
    } catch (e: any) { addToast('error', e.message); }
    setActionLoading('');
  };

  const createCampaign = async (artistId: string) => {
    setActionLoading(`campaign-${artistId}`);
    try {
      const data = await api('create_campaign', { artistId });
      if (data.error) addToast('error', 'Campaign failed', data.error);
      else { addToast('success', 'Campaign created', data.campaign_url); fetchPipeline(); }
    } catch (e: any) { addToast('error', e.message); }
    setActionLoading('');
  };

  const sendEmail = async (artistId: string) => {
    setActionLoading(`email-${artistId}`);
    try {
      const data = await api('send_email', { artistId });
      if (data.error) addToast('error', 'Email failed', data.error);
      else { addToast('success', 'Email sent'); fetchPipeline(); }
    } catch (e: any) { addToast('error', e.message); }
    setActionLoading('');
  };

  const renderOutreach = async (artistId: string, igHandle?: string, ttHandle?: string) => {
    setActionLoading(`outreach-${artistId}`);
    try {
      const data = await api('render_outreach', { artistId });
      if (data.error) { addToast('error', data.error); setActionLoading(''); return; }
      await navigator.clipboard.writeText(data.message);
      if (data.instagram_handle) window.open(`https://ig.me/m/${data.instagram_handle}`, '_blank');
      if (data.tiktok_handle) window.open(`https://www.tiktok.com/@${data.tiktok_handle}`, '_blank');
      addToast('success', 'Message copied', data.artist_name);
    } catch (e: any) { addToast('error', e.message); }
    setActionLoading('');
  };

  const renderFollowUp = async (artistId: string) => {
    setActionLoading(`followup-${artistId}`);
    try {
      const data = await api('render_follow_up', { artistId });
      if (data.error) addToast('error', data.error);
      else { await navigator.clipboard.writeText(data.message); addToast('success', 'Follow-up copied'); }
    } catch (e: any) { addToast('error', e.message); }
    setActionLoading('');
  };

  const logOutreach = async (artistId: string) => {
    setActionLoading(`log-${artistId}`);
    try {
      await api('log_outreach', { artistId, channel: 'email', status: 'sent' });
      addToast('success', 'Outreach logged');
      fetchPipeline();
    } catch (e: any) { addToast('error', e.message); }
    setActionLoading('');
  };

  const skipArtist = async (artistId: string) => {
    setActionLoading(`skip-${artistId}`);
    try { await api('decline', { artistId }); addToast('success', 'Artist skipped'); fetchPipeline(); }
    catch (e: any) { addToast('error', e.message); }
    setActionLoading('');
  };

  const batchAudit = async (limit: number = 20) => {
    setActionLoading('batch-audit');
    try {
      const data = await api('batch_audit', { limit });
      addToast('success', `Audited ${data.audited || 0} artists`, data.skipped ? `${data.skipped} skipped` : '');
      fetchPipeline();
    } catch (e: any) { addToast('error', e.message); }
    setActionLoading('');
  };

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
          <p className="text-sm text-muted-foreground mt-1">Discover → Audit → Campaign → Email → Claim</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={runDiscovery} disabled={actionLoading === 'discover'}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm
                     hover:shadow-[0_0_30px_rgba(67,56,202,0.25)] disabled:opacity-50 transition-shadow duration-300">
          {actionLoading === 'discover' ? <><Loader2 size={16} className="animate-spin" />Discovering…</> : <><Search size={16} />Discover Artists</>}
        </motion.button>
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

      {readyForCampaign.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Megaphone size={14} className="text-amber-400" />Ready for Campaign
            <span className="text-[10px] text-muted-foreground font-normal">{readyForCampaign.length} audited</span>
          </h2>
          <div className="space-y-2">
            {readyForCampaign.map((a: any) => (
              <ArtistCard key={a.id} artist={a} actionLoading={actionLoading}
                onAudit={runAudit} onCreateCampaign={createCampaign}
                onSendEmail={sendEmail} onRenderOutreach={renderOutreach} onRenderFollowUp={renderFollowUp}
                onLogOutreach={logOutreach} onSkip={skipArtist} />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users size={14} className="text-primary" />Discovered Artists
            {artists.length > 0 && <span className="text-[10px] text-muted-foreground font-normal">{artists.length} showing</span>}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => batchAudit(20)} disabled={actionLoading === 'batch-audit'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium
                         bg-purple-500/10 text-purple-400 border border-purple-500/20
                         hover:bg-purple-500/20 disabled:opacity-40">
              {actionLoading === 'batch-audit' ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}Audit 20
            </button>
            <button onClick={fetchPipeline} disabled={actionLoading === 'refresh'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium
                         bg-white/[0.03] border border-white/[0.06] text-muted-foreground
                         hover:text-foreground hover:border-white/[0.12] disabled:opacity-40">
              <RefreshCw size={11} />Refresh
            </button>
          </div>
        </div>
        {artists.length === 0 ? <EmptyState onDiscover={runDiscovery} /> : (
          <div className="space-y-2">
            {artists.filter((a: any) => a.status !== 'audited').map((a: any) => (
              <ArtistCard key={a.id} artist={a} actionLoading={actionLoading}
                onAudit={runAudit} onCreateCampaign={createCampaign}
                onSendEmail={sendEmail} onRenderOutreach={renderOutreach} onRenderFollowUp={renderFollowUp}
                onLogOutreach={logOutreach} onSkip={skipArtist} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
