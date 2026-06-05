'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState, ErrorState } from '@/components/States';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, X, ExternalLink, Clock } from 'lucide-react';

interface EditSuggestion {
  id: string;
  user_id: string | null;
  artist_id: number;
  field_name: string;
  current_value: string | null;
  suggested_value: string;
  reason: string | null;
  status: string;
  created_at: string;
  artist_name?: string;
  artist_slug?: string;
}

const FIELD_LABELS: Record<string, string> = {
  bio: 'Bio',
  genre: 'Genre',
  track: 'Track listing',
  social_link: 'Social links',
  image: 'Images',
  other: 'Other',
};

export default function ModerationEditQueue() {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/admin/community/edit-suggestions?status=pending',
    fetcher,
    swrConfig
  );

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const suggestions: EditSuggestion[] = data?.suggestions || [];

  const handleAction = useCallback(async (id: string, status: 'approved' | 'rejected', moderatorNotes?: string) => {
    setActionLoading(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/community/edit/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, moderator_notes: moderatorNotes || null }),
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update');
      }
      // Remove from queue
      mutate(
        (current: any) => ({
          ...current,
          suggestions: (current?.suggestions || []).filter((s: EditSuggestion) => s.id !== id),
        }),
        false
      );
      // Revalidate
      mutate();
    } catch (e: any) {
      setActionError(e.message || 'Failed to update suggestion');
    }
    setActionLoading(null);
  }, [mutate]);

  const timeSince = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(ms / 3600000);
    if (hours < 1) return `${Math.floor(ms / 60000)}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (error) {
    return (
      <ErrorState
        message="Couldn't load edit suggestions."
        onRetry={() => mutate()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-12 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <EmptyState
        icon={<span className="text-4xl">📝</span>}
        title="No pending edits"
        description="No edit suggestions waiting for review. Come back later."
      />
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
          {actionError}
        </div>
      )}

      {suggestions.map((s) => (
        <Card key={s.id} className="overflow-hidden border-white/[0.06]">
          <CardContent className="p-5 space-y-3">
            {/* Header: artist + field + time */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <a
                    href={s.artist_slug ? `/artist/${s.artist_slug}` : '#'}
                    className="text-sm font-semibold hover:text-primary transition-colors truncate"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.artist_name || `Artist #${s.artist_id}`}
                  </a>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70 border border-primary/20">
                    {FIELD_LABELS[s.field_name] || s.field_name}
                  </span>
                  {s.artist_slug && (
                    <a href={`/artist/${s.artist_slug}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors">
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50">
                  <Clock size={10} />
                  <span>{timeSince(s.created_at)} ago</span>
                  {s.user_id && <span>· by user {s.user_id.slice(0, 8)}</span>}
                  {s.reason && <span>· "{s.reason}"</span>}
                </div>
              </div>
            </div>

            {/* Diff: old → new */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-2">
              {s.current_value && (
                <div>
                  <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider mb-1">Current</p>
                  <div className="text-[11px] text-muted-foreground/60 line-clamp-3 bg-red-500/5 px-2 py-1 rounded">
                    {s.current_value.length > 200 ? s.current_value.slice(0, 200) + '...' : s.current_value}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider mb-1">Suggested</p>
                <div className="text-[11px] text-foreground/80 line-clamp-3 bg-green-500/5 px-2 py-1 rounded">
                  {s.suggested_value.length > 200 ? s.suggested_value.slice(0, 200) + '...' : s.suggested_value}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(s.id, 'rejected')}
                disabled={actionLoading === s.id}
                className="flex-1 h-10 rounded-xl text-xs font-medium border border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <X size={13} /> Reject
              </button>
              <button
                onClick={() => handleAction(s.id, 'approved')}
                disabled={actionLoading === s.id}
                className="flex-1 h-10 rounded-xl text-xs font-semibold bg-green-600 hover:bg-green-500 text-white transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-lg shadow-green-600/20"
              >
                <Check size={13} /> Approve
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
