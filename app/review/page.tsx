'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/TopNav';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Submission {
  id: string;
  creator_name: string;
  track_title: string;
  platform: string;
  content_url: string;
  views_verified: number;
  cpm_rate_cents: number;
  max_payout_per_submission_cents: number;
  review_status: string;
  campaign_id: string;
}

export default function ReviewPage() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [campaigns, setCampaigns] = useState<{ id: string; track_title: string }[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    // Fetch artist's campaigns first
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(d => {
        const artistCampaigns = d.campaigns || [];
        setCampaigns(artistCampaigns.map((c: any) => ({ id: c.id, track_title: c.track_title })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchSubmissions(); }, [selectedCampaign, statusFilter]);

  const [undoState, setUndoState] = useState<{ id: string; status: string; timer: any } | null>(null);

  const handleAction = async (id: string, status: string) => {
    // Optimistic removal with undo
    const subToUndo = subs.find(s => s.id === id);
    setSubs(prev => prev.filter(s => s.id !== id));
    
    try {
      await fetch('/api/review', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ submissionId: id, status }) });
      addToast(status === 'approved' ? 'Submission approved — creator will be paid' : 'Submission rejected', status === 'approved' ? 'success' : 'info');
    } catch {
      addToast('Failed to update — try again', 'error');
      if (subToUndo) setSubs(prev => [...prev, subToUndo]);
      return;
    }

    // Show undo option
    if (subToUndo) {
      const timer = setTimeout(() => setUndoState(null), 4000);
      setUndoState({ id, status, timer });
    }
  };

  const handleUndo = async () => {
    if (!undoState) return;
    clearTimeout(undoState.timer);
    const reverseStatus = undoState.status === 'approved' ? 'pending' : undoState.status === 'rejected' ? 'pending' : 'pending';
    try {
      await fetch('/api/review', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ submissionId: undoState.id, status: reverseStatus }) });
      addToast('Review undone', 'info');
    } catch {
      addToast('Failed to undo', 'error');
    }
    setUndoState(null);
    // Refresh list
    fetchSubmissions();
  };

  const fetchSubmissions = () => {
    setLoading(true);
    const campaignId = selectedCampaign === 'all' ? 'all' : selectedCampaign;
    fetch(`/api/submissions?campaignId=${campaignId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubs(data.filter((s: Submission) => s.review_status === statusFilter));
        }
      })
      .finally(() => setLoading(false));
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
            <p className="text-muted-foreground text-sm">{loading ? 'Loading...' : `${subs.length} ${statusFilter}`}</p>
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
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.track_title}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
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
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleAction(s.id, 'rejected')} className="flex-1">Reject</Button>
                      <Button onClick={() => handleAction(s.id, 'approved')} className="flex-1">Approve</Button>
                    </div>
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
