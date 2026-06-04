'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/States';
import VideoEmbed from '@/components/VideoEmbed';
import RatingPrompt from '@/components/RatingPrompt';
import { Play, ExternalLink, DollarSign, Eye, Check, X, RefreshCw, Music } from 'lucide-react';

interface Submission {
  id: string; creator_name: string; track_title: string; platform: string;
  content_url: string; views_verified: number; cpm_rate_cents: number;
  max_payout_per_submission_cents: number; review_status: string; campaign_id: string;
  payout_amount_cents?: number; payout_status?: string;
}

function platformColor(platform: string) {
  switch (platform) {
    case 'tiktok': return { bg: 'bg-[#ff0050]/10', text: 'text-[#ff0050]', border: 'border-[#ff0050]/20' };
    case 'instagram': return { bg: 'bg-[#E1306C]/10', text: 'text-[#E1306C]', border: 'border-[#E1306C]/20' };
    case 'youtube': return { bg: 'bg-[#FF0000]/10', text: 'text-[#FF0000]', border: 'border-[#FF0000]/20' };
    default: return { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' };
  }
}

export default function ReviewPage() {
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [artistId, setArtistId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState('');
  const { addToast } = useToast();

  const { data: campaignsData } = useSWR('/api/campaigns', fetcher, swrConfig);
  const campaigns = (campaignsData?.campaigns || []).map((c: any) => ({ id: c.id, track_title: c.track_title }));

  // Look up artist profile for the current user
  const { data: profileData } = useSWR('/api/auth/me', fetcher, swrConfig);
  useEffect(() => {
    if (!profileData?.user?.display_name) return;
    const name = profileData.user.display_name;
    setProfileName(name);
    // Look up artist by name to get their UUID
    fetch(`/api/artist/search?q=${encodeURIComponent(name)}&generate=false`)
      .then(r => r.json())
      .then(d => {
        if (d.artists?.length > 0) {
          // Fetch full artist profile to get the UUID
          fetch(`/api/artists/${d.artists[0].slug}`)
            .then(r => r.json())
            .then(ad => {
              if (ad.artist?.id) setArtistId(ad.artist.id);
            })
            .catch(e => console.error('Async error in review/page.tsx:', e));
        }
      })
      .catch(e => console.error('Async error in review/page.tsx:', e));
  }, [profileData?.user?.display_name]);

  // Build the API URL: artistId takes priority over campaignId
  const apiUrl = selectedCampaign === '__artist__' && artistId
    ? `/api/submissions?artistId=${artistId}&status=${statusFilter}`
    : `/api/submissions?campaignId=${selectedCampaign === 'all' ? 'all' : selectedCampaign}&status=${statusFilter}`;
  const { data: submissions, error, isLoading, mutate } = useSWR(apiUrl, fetcher, swrConfig);

  const subs: Submission[] = submissions ? (Array.isArray(submissions) ? submissions : []) : [];

  const [undoState, setUndoState] = useState<{ id: string; status: string; timer: any } | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{ submission: Submission; action: 'approved' | 'rejected' } | null>(null);
  const [modalFeedback, setModalFeedback] = useState('');

  const handleAction = async (id: string, status: string, feedback?: string) => {
    setActionLoading(id);
    
    // Start exit animation — shrink + slide out
    setExitingIds(prev => new Set(prev).add(id));
    
    // Remove from data after animation completes
    setTimeout(() => {
      mutate(
        (currentData: any) => {
          if (!Array.isArray(currentData)) return currentData;
          return currentData.filter((s: Submission) => s.id !== id);
        },
        false
      );
      setExitingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 400);

    try {
      const res = await fetch('/api/review', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ submissionId: id, status, feedback }) });
      const data = await res.json();
      if (!res.ok) {
        addToast(data.error || 'Failed to update', 'error');
        mutate();
        setActionLoading(null);
        setExitingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
        return;
      }
      
      if (status === 'approved' && data.content_url) {
        await fetch('/api/review/reject-duplicates', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId: id, content_url: data.content_url, campaign_id: data.campaign_id }),
        }).catch(e => console.error('Async error in review/page.tsx:', e));
      }
      
      addToast(status === 'approved' ? 'Submission approved — creator will be paid' : 'Submission rejected', status === 'approved' ? 'success' : 'info');
      mutate();
    } catch {
      addToast('Failed to update — try again', 'error');
      mutate();
      setExitingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
    setActionLoading(null);

    const timer = setTimeout(() => setUndoState(null), 4000);
    setUndoState({ id, status, timer });
  };

  const handleUndo = async () => {
    if (!undoState) return;
    clearTimeout(undoState.timer);
    try {
      await fetch('/api/review', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ submissionId: undoState.id, status: 'pending' }) });
      addToast('Review undone', 'info');
      mutate();
    } catch {
      addToast('Failed to undo', 'error');
    }
    setUndoState(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <AnimatePresence>
          {undoState && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A2E] backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl px-5 py-3.5 flex items-center gap-4"
            >
              <span className="text-sm font-medium text-white/80">
                {undoState.status === 'approved' ? 'Submission approved' : 'Submission rejected'}
              </span>
              <span className="w-px h-4 bg-white/[0.08]" />
              <button onClick={handleUndo} className="text-sm font-semibold text-[#818CF8] hover:text-[#A5B4FC] transition-colors">
                Undo
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Review</h1>
            <p className="text-muted-foreground text-sm">
              {isLoading ? 'Loading...' : `${subs.length} ${statusFilter} submission${subs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-0.5 gap-0.5">
              {['pending', 'approved', 'rejected'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    statusFilter === tab 
                      ? 'bg-white text-black shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <select
              value={selectedCampaign}
              onChange={e => setSelectedCampaign(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="all">All campaigns</option>
              {artistId && <option value="__artist__">🎵 {profileName || 'My artist profile'}</option>}
              {campaigns.map((c: { id: string; track_title: string }) => (
                <option key={c.id} value={c.id}>{c.track_title}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <ErrorState message="We couldn't load your submissions right now." onRetry={() => mutate()} />
        ) : isLoading ? (
          <div className="space-y-4">
            {[1,2].map(i => <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-16 w-full" /><div className="flex gap-2"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /></div></CardContent></Card>)}
          </div>
        ) : subs.length === 0 ? (
          <EmptyState icon={<span className="text-4xl">✓</span>} title="All caught up" description="No submissions waiting for review. Check back when creators submit videos." />
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {subs.map((s, i) => {
                const cpm = s.cpm_rate_cents / 100;
                const views = s.views_verified || 0;
                let gross = (views / 1000) * cpm;
                const maxPayout = (s.max_payout_per_submission_cents || 0) / 100;
                if (maxPayout > 0 && gross > maxPayout) gross = maxPayout;
                const colors = platformColor(s.platform);
                const isExiting = exitingIds.has(s.id);
                
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.97 }}
                    animate={isExiting 
                      ? { opacity: 0, y: -8, scale: 0.96, height: 0 }
                      : { opacity: 1, y: 0, scale: 1, height: 'auto' }
                    }
                    exit={{ opacity: 0, y: -8, scale: 0.96, height: 0 }}
                    transition={{ 
                      duration: 0.35, 
                      ease: [0.25, 0.1, 0.25, 1],
                      layout: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }
                    }}
                    style={{ overflow: 'hidden' }}
                  >
                    <Card className="overflow-hidden border-white/[0.06] transition-shadow duration-300 hover:shadow-[0_0_30px_rgba(67,56,202,0.06)]">
                      {/* ── Video Preview Area ── */}
                      <div className="relative bg-black/40 border-b border-white/[0.04]">
                        <VideoEmbed url={s.content_url} />
                        
                        <div className="p-6 flex flex-col items-center gap-3">
                          <a
                            href={s.content_url?.startsWith('http') ? s.content_url : `https://${s.content_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] ${colors.bg} ${colors.text} ${colors.border} border`}
                          >
                            <Play size={18} fill="currentColor" />
                            Watch on {s.platform.charAt(0).toUpperCase() + s.platform.slice(1)}
                            <ExternalLink size={14} />
                          </a>
                          <p className="text-[10px] text-muted-foreground/40">Opens in new tab — review the video before approving</p>
                        </div>
                      </div>

                      <CardContent className="p-5 space-y-3">
                        {/* ── Submission Info ── */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-sm">{s.creator_name || 'Creator'}</h3>
                            <p className="text-muted-foreground text-xs">{s.track_title}</p>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1 text-[10px]">
                            <Eye size={11} />
                            {(s.views_verified || 0).toLocaleString()} views
                          </Badge>
                        </div>

                        {/* ── Payout Summary ── */}
                        <div className="rounded-xl bg-muted/30 p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#22C55E]/10 flex items-center justify-center shrink-0">
                            <DollarSign size={18} className="text-[#22C55E]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold">${gross.toFixed(2)} payout</p>
                            <p className="text-[10px] text-muted-foreground">
                              {(s.views_verified || 0).toLocaleString()} views × ${(cpm * 1000).toFixed(0)}/1M = ${gross.toFixed(2)} (creator earns full amount)
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/cron/update-views', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ submissionId: s.id }),
                                });
                                const data = await res.json();
                                if (data.updated) {
                                  addToast(`Views updated: ${data.previous_views} → ${data.current_views}`, 'success');
                                  mutate();
                                } else {
                                  addToast(`Could not fetch views (${s.platform})`, 'info');
                                }
                              } catch { addToast('Failed to refresh views', 'error'); }
                            }}
                            className="shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-white/[0.15] transition-all"
                            title="Refresh view count from platform"
                          >
                            <RefreshCw size={12} className="inline mr-1" />Refresh
                          </button>
                        </div>

                        {/* ── Actions or Status ── */}
                        <div className="flex gap-2 pt-1">
                          {s.review_status === 'pending' ? (
                            <>
                              <Button
                                variant="outline"
                                onClick={() => { setModalState({ submission: s, action: 'rejected' }); setModalFeedback(''); }}
                                disabled={actionLoading === s.id}
                                className="flex-1 flex items-center gap-1.5 h-10 text-xs font-medium transition-all duration-200 hover:border-red-500/30 hover:text-red-400"
                              >
                                {actionLoading === s.id ? (
                                  <motion.div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} />
                                ) : (
                                  <><X size={14} /> Reject</>
                                )}
                              </Button>
                              <Button
                                onClick={() => { setModalState({ submission: s, action: 'approved' }); setModalFeedback(''); }}
                                disabled={actionLoading === s.id}
                                className="flex-1 flex items-center gap-1.5 h-10 text-xs font-medium bg-[#22C55E] hover:bg-[#16A34A] text-white disabled:opacity-50 transition-all duration-200 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]"
                              >
                                {actionLoading === s.id ? (
                                  <motion.div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} />
                                ) : (
                                  <><Check size={14} /> Approve & Pay</>
                                )}
                              </Button>
                            </>
                          ) : s.review_status === 'approved' ? (
                            <div className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-[#22C55E]/5 border border-[#22C55E]/10 text-xs font-medium text-[#22C55E]">
                              <Check size={14} /> Approved — ${((s.payout_amount_cents || 0) / 100).toFixed(2)} paid
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-red-500/5 border border-red-500/10 text-xs font-medium text-red-400">
                              <X size={14} /> Rejected
                            </div>
                          )}
                        </div>

                        {statusFilter === 'approved' && (
                          <RatingPrompt
                            submissionId={s.id}
                            role="artist"
                            targetName={s.creator_name || 'Creator'}
                            onRated={() => {}}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── Review Feedback Modal ── */}
      <AnimatePresence>
        {modalState && (() => {
          const s = modalState.submission;
          const isReject = modalState.action === 'rejected';
          const cpm = s.cpm_rate_cents / 100;
          const views = s.views_verified || 0;
          let gross = (views / 1000) * cpm;
          const maxPayout = (s.max_payout_per_submission_cents || 0) / 100;
          if (maxPayout > 0 && gross > maxPayout) gross = maxPayout;
          const charCount = modalFeedback.length;
          const charColor = charCount >= 280 ? 'text-red-400' : charCount >= 250 ? 'text-amber-400' : 'text-muted-foreground/60';
          const quickReasons = ['Audio quality issues', "Doesn't fit campaign brief", 'Low production value', 'Inappropriate content'];

          return (
            <motion.div
              key="review-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setModalState(null)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

              {/* Modal Panel */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full sm:max-w-lg bg-[#1A1A2E] border border-white/[0.08] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
              >
                {/* Title */}
                <h2 className="text-xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
                  {isReject ? 'Reject this submission?' : 'Approve & pay this submission?'}
                </h2>

                {/* Subtitle / Payout breakdown */}
                {isReject ? (
                  <p className="text-sm text-muted-foreground mb-6">
                    {s.creator_name || 'Creator'} — ${gross.toFixed(2)} payout
                  </p>
                ) : (
                  <div className="mb-6 p-4 rounded-2xl bg-[#22C55E]/[0.04] border border-[#22C55E]/[0.08]">
                    <p className="text-sm text-muted-foreground">
                      <span className="text-white/80 font-medium">{(views).toLocaleString()} views</span>
                      <span className="mx-1.5">×</span>
                      <span className="text-white/80 font-medium">${(cpm * 1000).toFixed(0)}/1M</span>
                      <span className="mx-1.5">=</span>
                      <span className="text-[#22C55E] font-bold">${gross.toFixed(2)}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">Creator earns full amount — no platform fee deducted</p>
                  </div>
                )}

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    value={modalFeedback}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.length <= 280) setModalFeedback(v);
                    }}
                    placeholder={isReject ? "Let the creator know why (optional)" : "Add a note to the creator (optional)"}
                    rows={4}
                    className="w-full resize-none rounded-xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-sm text-white/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.04] transition-colors"
                  />
                </div>

                {/* Character counter */}
                <div className="flex justify-end mt-1.5 mb-4">
                  <span className={`text-[10px] font-medium ${charColor}`}>
                    {charCount}/280
                  </span>
                </div>

                {/* Quick-reason chips (reject only) */}
                {isReject && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {quickReasons.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => setModalFeedback(reason)}
                        className="px-3 py-1.5 rounded-full text-[11px] font-medium bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:bg-white/[0.06] hover:text-white/70 hover:border-white/[0.10] transition-all"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalState(null)}
                    className="flex-1 h-11 rounded-xl text-sm font-medium bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleAction(s.id, modalState.action, modalFeedback || undefined);
                      setModalState(null);
                      setModalFeedback('');
                    }}
                    className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all ${
                      isReject
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300'
                        : 'bg-[#22C55E] hover:bg-[#16A34A] text-white shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_28px_rgba(34,197,94,0.25)]'
                    }`}
                  >
                    {isReject ? 'Reject submission' : `Approve & pay $${gross.toFixed(2)}`}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
