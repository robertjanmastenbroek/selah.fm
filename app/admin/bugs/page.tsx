'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bug, RefreshCw, CircleCheck, Clock, TriangleAlert, Trash2 } from 'lucide-react';

export default function BugsPage() {
  return <BugsContent />;
}

function BugsContent() {
  const [bugs, setBugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusListFilter, setStatusListFilter] = useState('new');
  const [toast, setToast] = useState('');

  const loadBugs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bugs', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setBugs(data);
      else setError('Failed to load');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBugs(); }, []);

  const updateBug = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/bugs', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setBugs(prev => prev.map(b => b.id === id ? { ...b, status } : b));
        setToast(status === 'fixed' ? 'Marked as fixed ✓' : status === 'closed' ? 'Closed ✓' : 'Reopened');
        setTimeout(() => setToast(''), 2000);
      }
    } catch { setToast('Failed to update'); }
  };

  const deleteBug = async (id: string) => {
    if (!confirm('Delete this bug report?')) return;
    try {
      const res = await fetch(`/api/bugs?id=${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        setBugs(prev => prev.filter(b => b.id !== id));
        setToast('Deleted');
        setTimeout(() => setToast(''), 2000);
      }
    } catch { setToast('Failed to delete'); }
  };

  const severityIcon = (s: string) => {
    switch (s) {
      case 'critical': return <TriangleAlert size={14} className="text-red-400" />;
      case 'high': return <TriangleAlert size={14} className="text-orange-400" />;
      case 'medium': return <Bug size={14} className="text-yellow-400" />;
      default: return <Bug size={14} className="text-muted-foreground" />;
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'new': return <Badge className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">new</Badge>;
      case 'in_progress': return <Badge className="text-[10px] bg-yellow-500/10 text-yellow-400 border-yellow-500/20">in progress</Badge>;
      case 'fixed': return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">fixed</Badge>;
      case 'closed': return <Badge variant="secondary" className="text-[10px]">closed</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">{s}</Badge>;
    }
  };

  const filtered = statusListFilter === 'all' ? bugs : bugs.filter(b => b.status === statusListFilter);
  const newCount = bugs.filter(b => b.status === 'new').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">
            Bugs {newCount > 0 && <span className="text-red-400 text-sm">({newCount} new)</span>}
          </h1>
          <p className="text-muted-foreground text-sm">
            Auto-captured from support chat + manual reports.
            {newCount > 0 && ' Fix and close them one by one.'}
          </p>
        </div>
        <button onClick={loadBugs} className="p-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground transition-colors" title="Refresh">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {toast && (
        <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-sm text-emerald-400 animate-slide-up">
          {toast}
        </div>
      )}

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-6">
        {['all', 'new', 'in_progress', 'fixed', 'closed'].map(tab => (
          <button
            key={tab}
            onClick={() => setStatusListFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusListFilter === tab
                ? 'bg-white/[0.06] text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'in_progress' ? 'in progress' : tab}
            {tab === 'new' && newCount > 0 && ` (${newCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : error ? (
        <Card className="text-center py-16">
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <button onClick={loadBugs} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">Retry</button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <CircleCheck size={40} className="mx-auto mb-4 text-emerald-400/30" />
            <h2 className="text-lg font-medium mb-1">All clear</h2>
            <p className="text-muted-foreground text-sm">
              {statusListFilter === 'all' ? 'No bugs reported yet.' : `No ${statusListFilter} bugs.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(bug => (
            <Card key={bug.id} className="overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {severityIcon(bug.severity)}
                      <span className="text-xs text-muted-foreground capitalize">{bug.severity}</span>
                      {statusBadge(bug.status)}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {new Date(bug.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-2">{bug.description}</p>
                    {bug.user_email && (
                      <p className="text-[10px] text-muted-foreground/50 mb-1">
                        Report by: <span className="text-primary/70">{bug.user_email}</span>
                        {bug.user_id && <span className="ml-1 font-mono">({bug.user_id.slice(0, 8)}…)</span>}
                      </p>
                    )}
                    {bug.steps_to_reproduce && bug.steps_to_reproduce !== 'No conversation history' && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer hover:text-foreground mb-1">Conversation context</summary>
                        <pre className="whitespace-pre-wrap text-[10px] bg-white/[0.02] rounded-lg p-3 mt-1 max-h-32 overflow-y-auto">{bug.steps_to_reproduce}</pre>
                      </details>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]">
                  {bug.status !== 'fixed' && (
                    <button
                      onClick={() => updateBug(bug.id, 'fixed')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                    >
                      <CircleCheck size={12} /> Fixed
                    </button>
                  )}
                  {bug.status === 'new' && (
                    <button
                      onClick={() => updateBug(bug.id, 'in_progress')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                    >
                      <Clock size={12} /> In progress
                    </button>
                  )}
                  {bug.status !== 'closed' && (
                    <button
                      onClick={() => updateBug(bug.id, 'closed')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] transition-colors"
                    >
                      Close
                    </button>
                  )}
                  {bug.status === 'closed' && (
                    <button
                      onClick={() => updateBug(bug.id, 'new')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white/[0.04] text-muted-foreground hover:bg-white/[0.08] transition-colors"
                    >
                      Reopen
                    </button>
                  )}
                  <button
                    onClick={() => deleteBug(bug.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-colors ml-auto"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
