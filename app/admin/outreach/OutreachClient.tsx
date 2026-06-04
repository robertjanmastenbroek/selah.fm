'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface Video {
  id: string; artist_name: string; track_name: string; instagram_handle: string;
  video_url: string; cover_art_url: string; caption: string; campaign_slug: string;
  status: string; mpt_task_id: string; error_message: string; created_at: string;
}

interface Stats { queue: number; generating: number; pending: number; approved: number; posted: number; }

export default function OutreachDashboard() {
  const [stats, setStats] = useState<Stats>({ queue: 1196, generating: 0, pending: 0, approved: 0, posted: 0 });
  const [videos, setVideos] = useState<Video[]>([]);
  const [tab, setTab] = useState<'generating' | 'pending' | 'approved' | 'failed'>('pending');
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState('');
  const [localMpt, setLocalMpt] = useState<boolean | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // ── Detect local MPT ──
  useEffect(() => {
    fetch('http://localhost:3000/api/mpt/health')
      .then(r => r.json()).then(d => setLocalMpt(d.ok === true)).catch(() => setLocalMpt(false));
  }, []);

  // ── Auto-refresh ──
  const refresh = useCallback(async () => {
    try {
      const [qRes, vRes] = await Promise.all([
        fetch('/api/admin/outreach/instagram?status=pending&limit=1'),
        fetch('/api/admin/outreach/videos?status=all&limit=50'),
      ]);
      const q = await qRes.json(); const v = await vRes.json();
      setStats({ queue: q.total || 1196, generating: v.stats?.generating || 0, pending: v.stats?.pending || 0, approved: v.stats?.approved || 0, posted: v.stats?.posted || 0 });
      setVideos(v.videos || []);
    } catch (e: any) { console.error('Unhandled error in admin/outreach/OutreachClient.tsx:', e); }
  }, []);

  useEffect(() => {
    mountedRef.current = true; refresh();
    pollRef.current = setInterval(refresh, 4000);
    return () => { mountedRef.current = false; if (pollRef.current) clearInterval(pollRef.current); };
  }, [refresh]);

  // ── Generate — uses local MPT if available, otherwise production API ──
  async function handleGenerate(count: number) {
    setGenerating(true);
    setGenProgress(`Picking ${count} artists...`);

    if (localMpt) {
      // LOCAL MPT PATH: fetch artist data, generate via localhost, store via production API
      try {
        const qRes = await fetch(`/api/admin/outreach/videos?status=queue&limit=${count}`);
        const { artists } = await qRes.json();
        if (!artists?.length) { setGenProgress('No artists available'); setTimeout(() => setGenerating(false), 3000); return; }

        let done = 0;
        for (const a of artists) {
          if (!mountedRef.current) break;
          setGenProgress(`Generating with MPT: ${done}/${artists.length}...`);

          try {
            const localRes = await fetch('http://localhost:3000/api/mpt/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                artistName: a.artist_name, trackName: a.track_name,
                genre: (typeof a.genres === 'string' ? JSON.parse(a.genres) : a.genres || [])[0] || 'indie',
                coverArtUrl: a.cover_art_url, campaignSlug: a.campaign_slug,
                instagramHandle: a.instagram_handle,
              }),
            });

            if (localRes.ok) {
              const { videoUrl, caption, dmTemplate } = await localRes.json();
              // Store via production API
              await fetch('/api/admin/outreach/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'store_local', artist_id: a.artist_id, campaign_id: a.campaign_id, video_url: videoUrl, caption, dm_message: dmTemplate, instagram_handle: a.instagram_handle, artist_name: a.artist_name, track_name: a.track_name, cover_art_url: a.cover_art_url, campaign_slug: a.campaign_slug }),
              });
            }
            done++;
          } catch (e: any) { done++; }
        }

        setGenProgress(`✅ ${done} videos generated with MPT`);
        setTab('pending');
      } catch (e: any) { setGenProgress(`Error: ${e.message}`); }
    } else {
      // PRODUCTION FALLBACK: cover art only
      try {
        const res = await fetch('/api/admin/outreach/videos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'batch', count }),
        });
        const data = await res.json();
        const fallbacks = (data.results || []).filter((r: any) => r.fallback);
        setGenProgress(`${fallbacks.length} ready for review (MPT unavailable — using cover art)`);
        setTab('pending');
      } catch (e: any) { setGenProgress(`Error: ${e.message}`); }
    }

    setTimeout(() => { if (mountedRef.current) { setGenerating(false); setGenProgress(''); refresh(); } }, 3000);
  }

  async function handleAction(id: string, status: string) {
    await fetch('/api/admin/outreach/videos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    refresh();
  }

  const filteredVideos = videos.filter(v => {
    if (tab === 'generating') return v.status === 'generating';
    if (tab === 'pending') return v.status === 'pending_review';
    if (tab === 'approved') return v.status === 'approved';
    if (tab === 'failed') return v.status === 'failed';
    return true;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outreach</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {localMpt === null ? 'Checking MPT...' :
             localMpt ? '🎬 MPT connected — generating real videos' :
             '⚠️ MPT not detected — using cover art'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleGenerate(3)} disabled={generating}
            className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm hover:bg-white/[0.06] transition-colors disabled:opacity-40">+3</button>
          <button onClick={() => handleGenerate(5)} disabled={generating}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 ${localMpt ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20' : 'bg-primary/10 border border-primary/20 hover:bg-primary/20'}`}>
            {generating ? genProgress?.slice(0, 30) || '...' : localMpt ? '🎬 Generate 5 (MPT)' : '🎬 Generate 5'}
          </button>
          <a href="/admin/outreach/instagram" className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm hover:bg-white/[0.06] transition-colors">💬 DM Queue</a>
        </div>
      </div>

      {generating && genProgress && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-sm flex items-center gap-2">
          <span className="animate-pulse">⏳</span>
          <span className="text-muted-foreground">{genProgress}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto pb-1">
        {[
          { key: 'queue', label: 'Queue', value: stats.queue, color: 'bg-white/[0.04]' },
          { key: 'generating', label: 'Generating', value: stats.generating, color: 'bg-amber-500/10 text-amber-400' },
          { key: 'pending', label: 'Pending', value: stats.pending, color: 'bg-primary/10 text-primary' },
          { key: 'approved', label: 'Approved', value: stats.approved, color: 'bg-green-500/10 text-green-400' },
          { key: 'posted', label: 'Posted', value: stats.posted, color: 'bg-white/[0.04]' },
        ].map((s, i) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <button onClick={() => setTab(s.key as any)} className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors ${s.color} ${tab === s.key ? 'ring-1 ring-white/10' : 'hover:opacity-80'}`}>
              {s.label} <span className="font-mono">{s.value}</span>
            </button>
            {i < 4 && <span className="text-muted-foreground/20">→</span>}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredVideos.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {tab === 'generating' ? 'No videos generating.' : tab === 'pending' ? 'No videos pending review.' : tab === 'approved' ? 'No approved videos.' : 'No failed videos.'}
            </p>
            <button onClick={() => handleGenerate(5)} disabled={generating} className="mt-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm hover:bg-primary/20 transition-colors">🎬 Generate 5</button>
          </div>
        )}

        {filteredVideos.map(v => (
          <div key={v.id} className={`bg-white/[0.02] border rounded-xl overflow-hidden transition-all ${v.status === 'generating' ? 'border-amber-500/10' : v.status === 'pending_review' ? 'border-white/[0.06] hover:border-white/[0.12]' : v.status === 'approved' ? 'border-green-500/10' : v.status === 'failed' ? 'border-red-500/10' : 'border-white/[0.04]'}`}>
            <div className="aspect-[9/16] bg-black/20 relative">
              {v.video_url && v.video_url !== v.cover_art_url ? (
                <video src={v.video_url} className="w-full h-full object-cover" controls preload="metadata" />
              ) : (
                <img src={v.cover_art_url || '/images/og-image.jpg'} alt="" className="w-full h-full object-cover" />
              )}
              {v.status === 'generating' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-2">
                  <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                  <span className="text-xs text-amber-400 animate-pulse">Rendering...</span>
                </div>
              )}
              {v.status === 'failed' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-1">
                  <span className="text-lg">❌</span><span className="text-xs text-red-400">{v.error_message?.slice(0, 40)}</span>
                </div>
              )}
              {v.status === 'approved' && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px]">✓ Approved</div>
              )}
            </div>
            <div className="p-2.5 space-y-1.5">
              <div>
                <p className="text-xs font-medium truncate">{v.artist_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">"{v.track_name}"</p>
                <p className="text-[10px] text-muted-foreground/40">@{v.instagram_handle}</p>
              </div>
              {v.caption && (
                <details className="text-[10px]"><summary className="text-muted-foreground/50 cursor-pointer hover:text-muted-foreground">📝 Caption</summary>
                  <pre className="text-muted-foreground whitespace-pre-wrap mt-1 bg-black/10 rounded p-1.5 max-h-20 overflow-y-auto">{v.caption}</pre>
                </details>
              )}
              <div className="flex gap-1 pt-1">
                {v.status === 'pending_review' && (<>
                  <button onClick={() => handleAction(v.id, 'approved')} className="flex-1 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-[10px] font-medium hover:bg-green-500/20">Approve</button>
                  <button onClick={() => handleAction(v.id, 'generating')} className="flex-1 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-medium hover:bg-amber-500/20">Retry</button>
                  <button onClick={() => handleAction(v.id, 'rejected')} className="px-2 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-medium hover:bg-red-500/20">✕</button>
                </>)}
                {v.status === 'failed' && (
                  <button onClick={() => handleAction(v.id, 'generating')} className="flex-1 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-[10px] font-medium hover:bg-amber-500/20">Retry</button>
                )}
                {v.status === 'generating' && <span className="text-[10px] text-amber-400/60">Waiting for MPT...</span>}
                {v.status === 'approved' && (
                  <a href={`https://selah.fm/c/${v.campaign_slug}`} target="_blank" className="flex-1 py-1.5 text-center text-[10px] text-green-400/60 hover:text-green-400">Ready → DM Queue</a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
