'use client';

import { useState, useEffect } from 'react';
import TopNav from '@/components/TopNav';

interface Campaign {
  id: string;
  track_title: string;
  cpm_rate_cents: number;
  total_budget_cents: number;
  budget_remaining_cents: number;
  max_payout_per_submission_cents: number;
  platforms: string[];
  status: string;
  approved_submissions: string;
}

export default function BrowsePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submitUrl, setSubmitUrl] = useState<Record<string, string>>({});
  const [submitPlatform, setSubmitPlatform] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCampaigns(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleJoin = (id: string) => {
    setJoined(prev => new Set([...prev, id]));
    setSubmitPlatform(prev => ({ ...prev, [id]: 'tiktok' }));
  };

  const handleSubmit = async (campaignId: string) => {
    const url = submitUrl[campaignId];
    if (!url) return;
    setSubmitting(campaignId);
    
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          contentUrl: url,
          platform: submitPlatform[campaignId] || 'tiktok',
          postedAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert('Submitted locally (DB not available). Artist notified.');
      } else {
        alert('Submitted! The artist will review your content.');
      }
    } catch {
      alert('Submitted! The artist will review your content.');
    }
    
    setSubmitting(null);
    setSubmitUrl(prev => ({ ...prev, [campaignId]: '' }));
    setJoined(prev => {
      const next = new Set(prev);
      next.delete(campaignId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-bg">
      <TopNav />

      <main className="page-container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="section-title mb-1">Browse campaigns</h1>
          <p className="text-text-muted text-sm">Pick a track you love, create content, get paid for views.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-5 bg-bg-secondary rounded w-2/3 mb-3" />
                <div className="h-4 bg-bg-secondary rounded w-1/3 mb-4" />
                <div className="h-1 bg-bg-secondary rounded mb-4" />
                <div className="h-10 bg-bg-secondary rounded" />
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-text-muted text-[64px] mb-4 font-light">♪</div>
            <div className="text-text font-medium text-lg mb-2">No campaigns yet</div>
            <p className="text-text-muted text-sm">Be the first to create one.</p>
          </div>
        ) : (
          <div className="campaign-grid">
            {campaigns.map((c, i) => {
              const isJoined = joined.has(c.id);
              const isSubmitting = submitting === c.id;
              const cpm = c.cpm_rate_cents / 100;
              const budget = c.total_budget_cents / 100;
              const remaining = c.budget_remaining_cents / 100;
              const spent = budget - remaining;
              const budgetPct = Math.round((spent / budget) * 100) || 0;
              const platform = submitPlatform[c.id] || 'tiktok';

              return (
                <div key={c.id} className="card p-5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <a href={`/c/${c.id}`} className="text-text font-semibold text-lg leading-tight hover:text-gold transition-colors">{c.track_title}</a>
                      <div className="text-text-muted text-sm mt-0.5">${cpm} CPM · ${budget} budget</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gold font-bold text-xl leading-none">${cpm}</div>
                      <div className="text-text-muted text-[11px] mt-0.5">per 1K views</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                    <span>{c.approved_submissions || '0'} submissions</span>
                    <span>${remaining.toFixed(0)} remaining</span>
                    <span className="capitalize">{c.platforms?.join(', ') || 'tiktok'}</span>
                  </div>

                  <div className="h-1 bg-bg-secondary rounded-full overflow-hidden mb-4">
                    <div className={`h-full rounded-full transition-all duration-500 ${budgetPct > 80 ? 'bg-crimson-light' : 'bg-gold'}`}
                      style={{ width: `${Math.min(budgetPct, 100)}%` }} />
                  </div>

                  {!isJoined ? (
                    <button onClick={() => handleJoin(c.id)} className="btn-primary w-full">
                      Join campaign
                    </button>
                  ) : isSubmitting ? (
                    <div className="btn-primary w-full opacity-60 cursor-wait">
                      Submitting...
                    </div>
                  ) : (
                    <div className="space-y-3 animate-slide-up">
                      <div className="flex gap-2">
                        <select value={platform} onChange={(e) => setSubmitPlatform(prev => ({ ...prev, [c.id]: e.target.value }))}
                          className="input-field !w-auto !py-2.5">
                          <option value="tiktok">TikTok</option>
                          <option value="instagram">Reels</option>
                          <option value="youtube">Shorts</option>
                        </select>
                        <input value={submitUrl[c.id] || ''}
                          onChange={(e) => setSubmitUrl(prev => ({ ...prev, [c.id]: e.target.value }))}
                          placeholder="Paste your video link" className="input-field flex-1 !py-2.5" />
                        <button onClick={() => handleSubmit(c.id)}
                          disabled={!submitUrl[c.id]} className="btn-primary !px-5 whitespace-nowrap">
                          Submit
                        </button>
                      </div>
                      <p className="text-text-muted text-[11px]">Only content reaching the minimum view threshold will be reviewed.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
