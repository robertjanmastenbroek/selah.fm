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
import VideoEmbed from '@/components/VideoEmbed';
import RatingPrompt from '@/components/RatingPrompt';

interface Submission {
  id: string; creator_name: string; track_title: string; platform: string;
  content_url: string; views_verified: number; cpm_rate_cents: number;
  max_payout_per_submission_cents: number; review_status: string; campaign_id: string;
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
    // Optimistic update: remove from local list
    mutate(
      (currentData: any) => {
        if (!Array.isArray(currentData)) return currentData;
        return currentData.filter((s: Submission) => s.id !== id);
      },
      false // Don't revalidate immediately — wait for the API call
    );

    try {
      await fetch('/api/review', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ submissionId: id, status }) });
      addToast(status === 'approved' ? 'Submission approved — creator will be paid' : 'Submission rejected', status === 'approved' ? 'success' : 'info');
      mutate(); // Revalidate after API call
    } catch {
      addToast('Failed to update — try again', 'error');
      mutate(); // Revert optimistic update
      return;
    }

    // Show undo option
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
        {/* Undo banner */}
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
          <Card className="text-center py-16"><CardContent><h2 className="text-lg font-medium mb-2">Couldn't load submissions</h2><p className="text-muted-foreground text-sm mb-4">Check your connection.</p><Button variant="outline" onClick={() => mutate()}>Retry</Button></CardContent></Card>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1,2].map(i => <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-16 w-full" /><div className="flex gap-2"><Skeleton className="h-10 flex-1" /><Skeleton className="h-10 flex-1" /></div></CardContent></Card>)}
          </div>
        ) : subs.length === 0 ? (
          <Card className="text-center py-16"><CardContent><p className="text-4xl mb-4 opacity-10">✓</p><h2 className="text-lg font-medium">All caught up</h2><p className="text-muted-foreground text-sm">No submissions to review.</p></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {subs.map((s, i) => {
              const cpm = s.cpm_rate_cents / 100;
              const views = s.views_verified || 0;
              let gross = (views / 1000) * cpm;
              const maxPayout = (s.max_payout_per_submission_cents || 0) / 100;
              if (maxPayout > 0 && gross > maxPayout) gross = maxPayout;
              const net = gross * 0.80;
              return (
                <Card key={s.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{s.creator_name || 'Creator'}</h3>
                        <p className="text-muted-foreground text-sm">{s.track_title} · {s.platform}</p>
                      </div>
                      <Badge variant="secondary">{(s.views_verified || 0).toLocaleString()} views</Badge>
                    </div>
                    <Card className="bg-muted/50"><CardContent className="p-3 text-sm text-muted-foreground">
                      {(s.views_verified || 0).toLocaleString()} views × ${cpm} CPM = <span className="text-foreground font-semibold">${gross.toFixed(2)}</span> → <span className="text-foreground font-semibold">${net.toFixed(2)}</span> creator earns
                    </CardContent></Card>
                    <a href={s.content_url?.startsWith('http') ? s.content_url : `https://${s.content_url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-foreground hover:underline">Watch on {s.platform} →</a>
                    {(s.content_url) && <VideoEmbed url={s.content_url} className="mt-2" />}
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleAction(s.id, 'rejected')} className="flex-1">Reject</Button>
                      <Button onClick={() => handleAction(s.id, 'approved')} className="flex-1">Approve</Button>
                    </div>
                    {/* Rating prompt for paid submissions */}
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
