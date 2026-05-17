'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import Header from '@/components/TopNav';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/States';
import VideoEmbed from '@/components/VideoEmbed';
import RatingPrompt from '@/components/RatingPrompt';
import { Play, ExternalLink, DollarSign, Eye, Check, X, RefreshCw } from 'lucide-react';

interface Submission {
  id: string; creator_name: string; track_title: string; platform: string;
  content_url: string; views_verified: number; cpm_rate_cents: number;
  max_payout_per_submission_cents: number; review_status: string; campaign_id: string;
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
  const { addToast } = useToast();

  const { data: campaignsData } = useSWR('/api/campaigns', fetcher, swrConfig);
  const campaigns = (campaignsData?.campaigns || []).map((c: any) => ({ id: c.id, track_title: c.track_title }));

  const campaignId = selectedCampaign === 'all' ? 'all' : selectedCampaign;
  const { data: submissions, error, isLoading, mutate } = useSWR(`/api/submissions?campaignId=${campaignId}&status=${statusFilter}`, fetcher, swrConfig);

  const subs: Submission[] = submissions ? (Array.isArray(submissions) ? submissions : []) : [];

  const [undoState, setUndoState] = useState<{ id: string; status: string; timer: any } | null>(null);

  const handleAction = async (id: string, status: string) => {
    mutate(
      (currentData: any) => {
        if (!Array.isArray(currentData)) return currentData;
        return currentData.filter((s: Submission) => s.id !== id);
      },
      false
    );

    try {
      await fetch('/api/review', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ submissionId: id, status }) });
      addToast(status === 'approved' ? 'Submission approved — creator will be paid' : 'Submission rejected', status === 'approved' ? 'success' : 'info');
      mutate();
    } catch {
      addToast('Failed to update — try again', 'error');
      mutate();
      return;
    }

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
        {undoState && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-popover border rounded-xl shadow-xl px-5 py-3 flex items-center gap-3 animate-slide-up">
            <span className="text-sm">{undoState.status === 'approved' ? 'Submission approved' : 'Submission rejected'}</span>
            <button onClick={handleUndo} className="text-sm font-semibold text-accent-foreground hover:underline">Undo</button>
            <span className="text-xs text-muted-foreground">(auto-dismisses)</span>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title mb-1">Review</h1>
            <p className="text-muted-foreground text-sm">{isLoading ? 'Loading...' : `${subs.length} ${statusFilter}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden">
              {['pending', 'approved', 'rejected'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${statusFilter === tab ? 'bg-foreground text-background' : 'hover:bg-muted'}`}
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
            {subs.map((s, i) => {
              const cpm = s.cpm_rate_cents / 100;
              const views = s.views_verified || 0;
              let gross = (views / 1000) * cpm;
              const maxPayout = (s.max_payout_per_submission_cents || 0) / 100;
              if (maxPayout > 0 && gross > maxPayout) gross = maxPayout;
              const net = gross;
              const colors = platformColor(s.platform);
              
              return (
                <Card key={s.id} className="animate-slide-up overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                  {/* ── Video Preview Area ── */}
                  <div className="relative bg-black/40 border-b border-white/[0.04]">
                    <VideoEmbed url={s.content_url} />
                    
                    {/* Always show Watch button as fallback/primary action */}
                    <div className="p-6 flex flex-col items-center gap-3">
                      <a
                        href={s.content_url?.startsWith('http') ? s.content_url : `https://${s.content_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.97] ${colors.bg} ${colors.text} ${colors.border} border`}
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
                        <h3 className="font-semibold">{s.creator_name || 'Creator'}</h3>
                        <p className="text-muted-foreground text-sm">{s.track_title}</p>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Eye size={12} />
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

                    {/* ── Actions ── */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        onClick={() => handleAction(s.id, 'rejected')}
                        className="flex-1 flex items-center gap-1.5"
                      >
                        <X size={14} /> Reject
                      </Button>
                      <Button
                        onClick={() => handleAction(s.id, 'approved')}
                        className="flex-1 flex items-center gap-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white"
                      >
                        <Check size={14} /> Approve & Pay
                      </Button>
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
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
