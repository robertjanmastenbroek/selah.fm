'use client';

import { useState } from 'react';
import TopNav from '@/components/TopNav';

interface Campaign {
  id: string;
  trackTitle: string;
  artist: string;
  cpm: number;
  budget: number;
  spent: number;
  submissions: number;
  platforms: string[];
  coverArt?: string;
}

const MOCK: Campaign[] = [
  { id: '1', trackTitle: 'Midnight Frequencies', artist: 'RJM', cpm: 3, budget: 500, spent: 185, submissions: 8, platforms: ['tiktok', 'instagram', 'youtube'] },
  { id: '2', trackTitle: 'Desert Prayer', artist: 'Luna Sol', cpm: 4, budget: 300, spent: 85, submissions: 5, platforms: ['tiktok', 'instagram'] },
  { id: '3', trackTitle: 'Neon Cathedral', artist: 'SYNTHPRIEST', cpm: 2, budget: 800, spent: 340, submissions: 14, platforms: ['tiktok', 'youtube'] },
  { id: '4', trackTitle: 'River Baptism', artist: 'HOLYFREQ', cpm: 5, budget: 2000, spent: 400, submissions: 2, platforms: ['tiktok', 'instagram', 'youtube'] },
];

export default function BrowsePage() {
  const [campaigns] = useState(MOCK);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState<Record<string, string>>({});

  const handleJoin = (id: string) => {
    setJoined(prev => new Set([...prev, id]));
  };

  const handleSubmit = (campaignId: string) => {
    const url = submitUrl[campaignId];
    if (!url) return;
    setSubmitting(campaignId);
    setTimeout(() => {
      setSubmitting(null);
      setSubmitUrl(prev => ({ ...prev, [campaignId]: '' }));
      alert('Submitted! The artist will review your content.');
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-void">
      <TopNav />

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-10">
        <div className="mb-8">
          <h1 className="section-title mb-1">Browse campaigns</h1>
          <p className="text-muted/60 text-sm">Pick a track you love, create content, get paid for views.</p>
        </div>

        <div className="space-y-4">
          {campaigns.map((c, i) => {
            const isJoined = joined.has(c.id);
            const budgetPct = Math.round((c.spent / c.budget) * 100);
            const isSubmitting = submitting === c.id;

            return (
              <div key={c.id}
                className="card-glass p-5 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}>
                
                {/* Campaign header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-ivory font-semibold text-lg leading-tight">{c.trackTitle}</div>
                    <div className="text-muted/50 text-sm mt-0.5">{c.artist}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gold font-bold text-xl leading-none">${c.cpm}</div>
                    <div className="text-muted/40 text-[11px] mt-0.5">per 1K views</div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 text-xs text-muted/40 mb-3">
                  <span>{c.submissions} submissions</span>
                  <span>${c.budget - c.spent} remaining</span>
                  <div className="flex items-center gap-1">
                    {c.platforms.map(p => (
                      <span key={p} className="capitalize">{p}</span>
                    ))}
                  </div>
                </div>

                {/* Budget bar */}
                <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${budgetPct > 80 ? 'bg-crimson-light' : 'bg-gold'}`}
                    style={{ width: `${Math.min(budgetPct, 100)}%` }}
                  />
                </div>

                {/* Action */}
                {!isJoined ? (
                  <button onClick={() => handleJoin(c.id)} className="btn-primary w-full">
                    Join campaign
                  </button>
                ) : (
                  <div className="space-y-3 animate-slide-up">
                    <div className="flex gap-2">
                      <input
                        value={submitUrl[c.id] || ''}
                        onChange={(e) => setSubmitUrl(prev => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="Paste your TikTok, Reel, or Shorts link"
                        className="input-field flex-1"
                      />
                      <button
                        onClick={() => handleSubmit(c.id)}
                        disabled={!submitUrl[c.id] || isSubmitting}
                        className="btn-primary !px-5 whitespace-nowrap">
                        {isSubmitting ? (
                          <span className="inline-block w-4 h-4 border-2 border-void/30 border-t-void rounded-full animate-spin" />
                        ) : 'Submit'}
                      </button>
                    </div>
                    <p className="text-muted/30 text-[11px]">
                      Only content reaching the minimum view threshold will be reviewed.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
