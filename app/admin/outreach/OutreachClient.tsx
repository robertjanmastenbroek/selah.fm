'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface Video {
  id: string;
  artist_name: string;
  track_name: string;
  instagram_handle: string;
  video_url: string;
  cover_art_url: string;
  caption: string;
  campaign_slug: string;
  status: string;
  mpt_task_id: string;
  error_message: string;
  created_at: string;
}

interface Stats { queue: number; generating: number; pending: number; approved: number; posted: number; sent: number; replied: number; claimed: number; }

export default function OutreachDashboard() {
  const [stats, setStats] = useState<Stats>({ queue: 1196, generating: 0, pending: 0, approved: 0, posted: 0, sent: 0, replied: 0, claimed: 0 });
  const [videos, setVideos] = useState<Video[]>([]);
  const [tab, setTab] = useState<'generating' | 'pending' | 'approved' | 'failed'>('pending');
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState('');
  const [genCount, setGenCount] = useState(0);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // ── Auto-refresh stats + poll generating videos ──
  const refresh = useCallback(async () => {
    try {
      const [qRes, vRes, igRes] = await Promise.all([
        fetch('/api/admin/outreach/instagram?status=pending&limit=1'),
        fetch('/api/admin/outreach/videos?status=all&limit=50'),
        fetch('/api/admin/outreach/instagram?status=sent&limit=1'),
      ]);
      const q = await qRes.json();
      const v = await vRes.json();
      setStats({
        queue: q.total || 1196,
        generating: v.stats?.generating || 0,
        pending: v.stats?.pending || 0,
        approved: v.stats?.approved || 0,
        posted: v.stats?.posted || 0,
        sent: 0, replied: 0, claimed: 0,
      });
      setVideos(v.videos || []);
    } catch {}
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    pollRef.current = setInterval(refresh, 4000);
    return () => { mountedRef.current = false; if (pollRef.current) clearInterval(pollRef.current); };
  }, [refresh]);

  // ── Generate videos with live progress ──
  async function handleGenerate(count: number) {
    setGenerating(true);
    setGenProgress(`Picking ${count} artists...`);
    setGenCount(0);

    try {
      const res = await fetch('/api/admin/outreach/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch', count }),
      });
      const data = await res.json();
      if (!mountedRef.current) return;

      const successes = (data.results || []).filter((r: any) => !r.error && !r.fallback);
      const fallbacks = (data.results || []).filter((r: any) => r.fallback);

      if (successes.length > 0) {
        setGenCount(successes.length);
        if (fallbacks.length > 0) {
          setGenProgress(`${successes.length} submitted to MPT, ${fallbacks.length} using cover art (MPT unavailable)`);
        } else {
          setGenProgress(`${successes.length} videos rendering — polling MPT for completion...`);
        }
        setTab('generating');
        // Start fast polling for the new videos
        let pollCount = 0;
        const fastPoll = setInterval(async () => {
          pollCount++;
          await refresh();
          if (!mountedRef.current || pollCount > 20) { clearInterval(fastPoll); }
        }, 2000);
        setTimeout(() => clearInterval(fastPoll), 45000);
      } else if (fallbacks.length > 0) {
        setGenProgress(`${fallbacks.length} ready for review (MPT unavailable — using cover art)`);
        setTab('pending');
      } else {
        setGenProgress('No new artists available in queue.');
      }
    } catch (e: any) {
      setGenProgress(`Error: ${e.message}`);
    }

    setTimeout(() => { if (mountedRef.current) { setGenerating(false); setGenProgress(''); } }, 4000);
  }

  // ── Video actions ──
  async function handleAction(id: string, status: string) {
    await fetch('/api/admin/outreach/videos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    refresh();
  }

  // ── Filter videos by tab ──
  const filteredVideos = videos.filter(v => {
    if (tab === 'generating') return v.status === 'generating';
    if (tab === 'pending') return v.status === 'pending_review';
    if (tab === 'approved') return v.status === 'approved';
    if (tab === 'failed') return v.status === 'failed';
    return true;
  });

  // ── Render ──
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outreach</h1>
          <p className="text-sm text-muted-foreground mt-1">Instagram content pipeline — generate → review → post → DM</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleGenerate(3)} disabled={generating}
            className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm hover:bg-white/[0.06] transition-colors disabled:opacity-40">
            +3
          </button>
          <button onClick={() => handleGenerate(5)} disabled={generating}
            className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40">
            {generating ? genProgress ? genProgress.slice(0, 30) + '...' : 'Generating...' : '🎬 Generate 5'}
          </button>
          <a href="/admin/outreach/instagram"
            className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm hover:bg-white/[0.06] transition-colors">
            💬 DM Queue
          </a>
        </div>
      </div>

      {/* Generation progress banner */}
      {generating && genProgress && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-sm flex items-center gap-2">
          <span className="animate-pulse">⏳</span>
          <span className="text-muted-foreground">{genProgress}</span>
        </div>
      )}

      {/* Pipeline flow */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto pb-1">
        {[
          { key: 'queue', label: 'Queue', value: stats.queue, color: 'bg-white/[0.04]' },
          { key: 'generating', label: 'Generating', value: stats.generating, color: 'bg-amber-500/10 text-amber-400' },
          { key: 'pending', label: 'Pending Review', value: stats.pending, color: 'bg-primary/10 text-primary' },
          { key: 'approved', label: 'Approved', value: stats.approved, color: 'bg-green-500/10 text-green-400' },
          { key: 'posted', label: 'Posted', value: stats.posted, color: 'bg-white/[0.04]' },
        ].map((s, i) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <button onClick={() => setTab(s.key as any)}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors ${s.color} ${tab === s.key ? 'ring-1 ring-white/10' : 'hover:opacity-80'}`}>
              {s.label} <span className="font-mono">{s.value}</span>
            </button>
            {i < 4 && <span className="text-muted-foreground/20">→</span>}
          </span>
        ))}
      </div>

      {/* Video feed */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredVideos.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {tab === 'generating' ? 'No videos generating. Click "Generate 5" to start.' :
               tab === 'pending' ? 'No videos pending review. Generate some first.' :
               tab === 'approved' ? 'No approved videos yet. Review pending ones.' :
               tab === 'failed' ? 'No failed videos. Everything is working.' :
               'No videos.'}
            </p>
            {tab !== 'generating' && (
              <button onClick={() => handleGenerate(5)} disabled={generating}
                className="mt-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm hover:bg-primary/20 transition-colors">
                🎬 Generate 5 Videos
              </button>
            )}
          </div>
        )}

        {filteredVideos.map(v => (
          <div key={v.id}
            className={`bg-white/[0.02] border rounded-xl overflow-hidden group transition-all ${
              v.status === 'generating' ? 'border-amber-500/10' :
              v.status === 'pending_review' ? 'border-white/[0.06] hover:border-white/[0.12]' :
              v.status === 'approved' ? 'border-green-500/10' :
              v.status === 'failed' ? 'border-red-500/10' : 'border-white/[0.04]'
            }`}>
            {/* Thumbnail */}
            <div className="aspect-[9/16] bg-black/20 relative">
              {v.video_url && v.video_url !== v.cover_art_url ? (
                <video src={v.video_url} className="w-full h-full object-cover" controls preload="metadata" />
              ) : (
                <img src={v.cover_art_url || '/images/og-image.jpg'} alt="" className="w-full h-full object-cover" />
              )}
              {/* Status overlay */}
              {v.status === 'generating' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-2">
                  <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  <span className="text-xs text-amber-400 animate-pulse">Rendering...</span>
                </div>
              )}
              {v.status === 'failed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-1">
                  <span className="text-lg">❌</span>
                  <span className="text-xs text-red-400">{v.error_message?.slice(0, 40) || 'Failed'}</span>
                </div>
              )}
              {v.status === 'approved' && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-medium">
                  ✓ Approved
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2.5 space-y-1.5">
              <div>
                <p className="text-xs font-medium truncate">{v.artist_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">"{v.track_name}"</p>
                <p className="text-[10px] text-muted-foreground/40">@{v.instagram_handle}</p>
              </div>

              {/* Caption preview */}
              {v.caption && (
                <details className="text-[10px]">
                  <summary className="text-muted-foreground/50 cursor-pointer hover:text-muted-foreground">📝 Caption</summary>
                  <pre className="text-muted-foreground whitespace-pre-wrap mt-1 bg-black/10 rounded p-1.5 max-h-20 overflow-y-auto">{v.caption}</pre>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-1 pt-1">
                {v.status === 'pending_review' && (
                  <>
                    <button onClick={() => handleAction(v.id, 'approved')}
                      className="flex-1 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-[10px] font-medium hover:bg-green-500/20 transition-colors">
                      Approve
                    </button>
                    <button onClick={() => handleAction(v.id, 'generating')}
                      className="flex-1 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-medium hover:bg-amber-500/20 transition-colors">
                      Retry
                    </button>
                    <button onClick={() => handleAction(v.id, 'rejected')}
                      className="px-2 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-medium hover:bg-red-500/20 transition-colors">
                      ✕
                    </button>
                  </>
                )}
                {v.status === 'failed' && (
                  <button onClick={() => handleAction(v.id, 'generating')}
                    className="flex-1 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-medium hover:bg-amber-500/20 transition-colors">
                    Retry
                  </button>
                )}
                {v.status === 'generating' && (
                  <span className="text-[10px] text-amber-400/60">Waiting for MPT...</span>
                )}
                {v.status === 'approved' && (
                  <a href={`https://selah.fm/c/${v.campaign_slug}`} target="_blank"
                    className="flex-1 py-1.5 text-center text-[10px] text-green-400/60 hover:text-green-400 transition-colors">
                    Ready → DM Queue
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
