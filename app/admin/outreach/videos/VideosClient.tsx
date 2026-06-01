'use client';

import { useEffect, useState } from 'react';

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

export default function VideosClient() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [stats, setStats] = useState<any>({});
  const [tab, setTab] = useState('pending_review');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [polling, setPolling] = useState<Set<string>>(new Set());

  useEffect(() => { loadVideos(); }, [tab]);

  // Poll generating videos
  useEffect(() => {
    const generatingVids = videos.filter(v => v.status === 'generating' && v.mpt_task_id);
    if (generatingVids.length === 0) return;

    const interval = setInterval(async () => {
      for (const v of generatingVids) {
        try {
          const res = await fetch(`/api/admin/outreach/mpt?task_id=${v.mpt_task_id}&post_id=${v.id}`);
          const data = await res.json();
          if (data.status === 'completed' || data.status === 'failed') {
            loadVideos(); // Refresh the list
            break;
          }
        } catch {}
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [videos]);

  async function loadVideos() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/outreach/videos?status=${tab}&limit=30`);
      const data = await res.json();
      setVideos(data.videos || []);
      setStats(data.stats || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleAction(id: string, status: string) {
    await fetch('/api/admin/outreach/videos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    loadVideos();
  }

  async function handleBatchGenerate() {
    await fetch('/api/admin/outreach/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'batch', count: 5 }),
    });
    setTab('generating');
    setTimeout(() => loadVideos(), 1000);
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Video Review</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.pending || 0} pending · {stats.approved || 0} approved · {stats.generating || 0} generating
          </p>
        </div>
        <button
          onClick={handleBatchGenerate}
          className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
        >
          🎬 Generate 5 More
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['pending_review', 'approved', 'generating', 'failed'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              tab === t ? 'bg-primary/20 text-primary' : 'bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06]'
            }`}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-2 gap-3">
        {videos.length === 0 && <p className="text-sm text-muted-foreground col-span-2">No videos in this tab</p>}
        {videos.map(v => (
          <div
            key={v.id}
            className={`bg-white/[0.02] border rounded-xl overflow-hidden transition-colors ${
              expanded === v.id ? 'border-white/[0.08]' : 'border-white/[0.04] hover:border-white/[0.06]'
            }`}
          >
            {/* Thumbnail */}
            <div
              className="aspect-[9/16] bg-black/20 relative cursor-pointer"
              onClick={() => setExpanded(expanded === v.id ? null : v.id)}
            >
              {v.video_url && v.video_url !== v.cover_art_url ? (
                <video src={v.video_url} className="w-full h-full object-cover" controls={expanded === v.id} />
              ) : (
                <img src={v.cover_art_url || '/images/og-image.jpg'} alt="" className="w-full h-full object-cover" />
              )}
              {v.status === 'generating' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-sm text-amber-400 animate-pulse">⏳ Generating...</div>
                </div>
              )}
              {v.status === 'failed' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-sm text-red-400">❌ Failed</div>
                </div>
              )}
            </div>

            {/* Info bar */}
            <div className="p-3">
              <p className="text-sm font-medium truncate">{v.artist_name}</p>
              <p className="text-xs text-muted-foreground truncate">"{v.track_name}" · @{v.instagram_handle}</p>
              {v.error_message && <p className="text-xs text-red-400 mt-1">{v.error_message}</p>}
            </div>

            {/* Expanded details */}
            {expanded === v.id && (
              <div className="px-3 pb-3 space-y-2 border-t border-white/[0.04] pt-3">
                {v.caption && (
                  <details>
                    <summary className="text-xs text-muted-foreground cursor-pointer">📝 Caption</summary>
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap mt-1 bg-black/10 rounded-lg p-2">{v.caption}</pre>
                  </details>
                )}
                <a
                  href={`https://selah.fm/c/${v.campaign_slug}`}
                  target="_blank"
                  className="text-xs text-primary/60 hover:text-primary block"
                >
                  🔗 View Campaign →
                </a>
                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {v.status === 'pending_review' && (
                    <>
                      <button onClick={() => handleAction(v.id, 'approved')} className="flex-1 py-2 bg-green-500/10 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/20">✓ Approve</button>
                      <button onClick={() => handleAction(v.id, 'generating')} className="flex-1 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/20">🔄 Retry</button>
                      <button onClick={() => handleAction(v.id, 'rejected')} className="flex-1 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20">✕ Skip</button>
                    </>
                  )}
                  {v.status === 'failed' && (
                    <button onClick={() => handleAction(v.id, 'generating')} className="flex-1 py-2 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/20">🔄 Retry</button>
                  )}
                  {v.status === 'approved' && (
                    <span className="text-xs text-green-400 py-2">✅ Ready to post — go to DM Queue</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
