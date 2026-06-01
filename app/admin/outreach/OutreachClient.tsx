'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OutreachStats {
  queueSize: number;
  pendingVideos: number;
  approvedVideos: number;
  generatingVideos: number;
  sentToday: number;
  repliedToday: number;
  claimedToday: number;
}

export default function OutreachDashboard() {
  const [stats, setStats] = useState<OutreachStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { loadStats(); }, []);

  async function loadStats() {
    setLoading(true);
    try {
      const [queueRes, videoRes, logRes] = await Promise.all([
        fetch('/api/admin/outreach/instagram?limit=1&status=pending'),
        fetch('/api/admin/outreach/videos?limit=1&status=pending_review'),
        fetch('/api/admin/outreach/instagram?limit=1&status=sent'),
      ]);
      const q = await queueRes.json();
      const v = await videoRes.json();
      setStats({
        queueSize: q.total || 1196,
        pendingVideos: v.stats?.pending || 0,
        approvedVideos: v.stats?.approved || 0,
        generatingVideos: v.stats?.generating || 0,
        sentToday: 0,
        repliedToday: 0,
        claimedToday: 0,
      });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleBatchGenerate() {
    setGenerating(true);
    try {
      await fetch('/api/admin/outreach/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'batch', count: 5 }),
      });
      await loadStats();
    } catch (e) { console.error(e); }
    setGenerating(false);
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!stats) return <div className="p-8 text-red-500">Failed to load</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Outreach Hub</h1>
        <p className="text-sm text-muted-foreground mt-1">Instagram DM + video content pipeline</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <div className="text-2xl font-bold">{stats.queueSize.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-1">Queue</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-400">{stats.generatingVideos}</div>
          <div className="text-xs text-muted-foreground mt-1">Generating</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <div className="text-2xl font-bold text-primary">{stats.pendingVideos}</div>
          <div className="text-xs text-muted-foreground mt-1">Pending Review</div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">{stats.approvedVideos}</div>
          <div className="text-xs text-muted-foreground mt-1">Approved</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleBatchGenerate}
          disabled={generating}
          className="py-3 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {generating ? 'Generating...' : '🎬 Generate 5 Videos'}
        </button>
        <Link
          href="/admin/outreach/videos"
          className="py-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-colors text-center"
        >
          📺 Review Videos
        </Link>
        <Link
          href="/admin/outreach/instagram"
          className="py-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-colors text-center"
        >
          💬 DM Queue
        </Link>
      </div>

      {/* Pipeline flow diagram */}
      <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-3">Pipeline</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-2 py-1 bg-white/[0.04] rounded">1,196 artists</span>
          <span>→</span>
          <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded">{stats.generatingVideos} generating</span>
          <span>→</span>
          <span className="px-2 py-1 bg-primary/10 text-primary rounded">{stats.pendingVideos} pending</span>
          <span>→</span>
          <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded">{stats.approvedVideos} approved</span>
          <span>→</span>
          <span className="px-2 py-1 bg-white/[0.04] rounded">📱 post + 💬 DM</span>
        </div>
      </div>
    </div>
  );
}
