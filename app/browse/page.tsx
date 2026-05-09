'use client';

import { useState } from 'react';

// Mock campaigns — in real app, fetched from DB
const MOCK_CAMPAIGNS = [
  {
    id: '1', track: 'Midnight Frequencies', artist: 'RJ Mastenbroek',
    cpm: 3, budget: 500, budgetRemaining: 380, maxPayout: 100,
    platforms: ['tiktok', 'instagram', 'youtube'],
    subs: 8, genre: 'Tribal Techno',
  },
  {
    id: '2', track: 'Desert Prayer', artist: 'Luna Sol',
    cpm: 4, budget: 1000, budgetRemaining: 920, maxPayout: 200,
    platforms: ['tiktok', 'instagram'],
    subs: 3, genre: 'Organic House',
  },
  {
    id: '3', track: 'Neon Cathedral', artist: 'SYNTHPRIEST',
    cpm: 2, budget: 300, budgetRemaining: 45, maxPayout: 50,
    platforms: ['tiktok', 'youtube'],
    subs: 15, genre: 'Psytrance',
  },
  {
    id: '4', track: 'River Baptism', artist: 'HOLYFREQ',
    cpm: 5, budget: 2000, budgetRemaining: 1800, maxPayout: 300,
    platforms: ['tiktok', 'instagram', 'youtube'],
    subs: 2, genre: 'Christian EDM',
  },
];

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: '🎵', instagram: '📸', youtube: '▶️',
};

export default function BrowsePage() {
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState('');

  const handleJoin = (id: string) => {
    setJoined(new Set([...joined, id]));
  };

  const handleSubmit = (campaignId: string) => {
    if (!submitUrl) return;
    setSubmitting(campaignId);
    setTimeout(() => {
      setSubmitting(null);
      setSubmitUrl('');
      alert('Submitted! The artist will review your content.');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-void">
      {/* Top bar */}
      <div className="sticky top-0 bg-void/95 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center justify-between z-10">
        <span className="font-display text-gold text-lg">Browse campaigns</span>
        <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold">C</div>
      </div>

      {/* Campaign feed */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {MOCK_CAMPAIGNS.map((c) => {
          const isJoined = joined.has(c.id);
          const budgetPct = Math.round(((c.budget - c.budgetRemaining) / c.budget) * 100);

          return (
            <div key={c.id} className="card-elevated overflow-hidden">
              {/* Track info */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-bold text-ivory text-lg">{c.track}</div>
                  <div className="text-muted text-sm">{c.artist} · {c.genre}</div>
                </div>
                <div className="bg-void-card rounded-lg px-3 py-2 text-center">
                  <div className="text-gold font-bold text-xl">${c.cpm}</div>
                  <div className="text-muted text-[10px] uppercase tracking-wider">per 1K views</div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-void rounded-lg p-2.5 text-center">
                  <div className="text-gold font-bold">${c.budgetRemaining}</div>
                  <div className="text-muted text-[10px]">remaining</div>
                </div>
                <div className="bg-void rounded-lg p-2.5 text-center">
                  <div className="text-gold font-bold">${c.maxPayout}</div>
                  <div className="text-muted text-[10px]">max per video</div>
                </div>
                <div className="bg-void rounded-lg p-2.5 text-center">
                  <div className="text-gold font-bold">{c.subs}</div>
                  <div className="text-muted text-[10px]">creators</div>
                </div>
              </div>

              {/* Budget bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>{budgetPct}% used</span>
                  <span>${c.budget} total</span>
                </div>
                <div className="h-1.5 bg-void rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${budgetPct > 80 ? 'bg-crimson-light' : 'bg-gold'}`}
                    style={{ width: `${budgetPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Platforms */}
              <div className="flex gap-2 mb-4">
                {c.platforms.map((p) => (
                  <span key={p} className="text-xs bg-void-card px-2 py-1 rounded-md text-muted">
                    {PLATFORM_ICONS[p]} {p}
                  </span>
                ))}
              </div>

              {/* Action */}
              {!isJoined ? (
                <button onClick={() => handleJoin(c.id)} className="btn-gold w-full !py-2.5 !rounded-xl text-sm">
                  Join campaign
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={submitUrl}
                      onChange={(e) => setSubmitUrl(e.target.value)}
                      placeholder="Paste your TikTok/Reel/Short link..."
                      className="flex-1 bg-void border border-white/10 rounded-lg px-3 py-2.5 text-ivory text-sm
                                 placeholder:text-muted focus:outline-none focus:border-gold/50"
                    />
                    <button
                      onClick={() => handleSubmit(c.id)}
                      disabled={!submitUrl || submitting === c.id}
                      className="btn-gold !py-2 !px-4 !rounded-lg text-sm whitespace-nowrap"
                    >
                      {submitting === c.id ? '...' : 'Submit'}
                    </button>
                  </div>
                  <p className="text-muted text-[11px]">
                    Only videos that reach the minimum view threshold will be reviewed for payout.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
