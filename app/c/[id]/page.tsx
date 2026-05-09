'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/TopNav';

export default function CampaignPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => {
        const found = data.find((c: any) => c.id === params.id);
        if (found) setCampaign(found);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Header />
        <div className="page-container">
          <div className="card p-8 animate-pulse space-y-4">
            <div className="h-6 bg-bg-secondary rounded w-1/3" />
            <div className="h-4 bg-bg-secondary rounded w-2/3" />
            <div className="h-32 bg-bg-secondary rounded" />
          </div>
        </div>
      </div>
    );
  }

  const cpm = campaign?.cpm_rate_cents ? campaign.cpm_rate_cents / 100 : 0;
  const budget = campaign?.total_budget_cents ? campaign.total_budget_cents / 100 : 0;
  const remaining = campaign?.budget_remaining_cents ? campaign.budget_remaining_cents / 100 : 0;
  const spent = budget - remaining;
  const pct = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const subs = campaign?.approved_submissions || '0';

  return (
    <div className="min-h-screen bg-bg">
      <Header />
      <div className="page-container">
        <a href="/browse" className="text-text-muted text-sm hover:text-text mb-6 inline-block">← Back to Discover</a>

        <div className="card p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl text-text mb-2">
                {campaign?.track_title || `Campaign #${params.id}`}
              </h1>
              <p className="text-text-secondary">Music promotion campaign on TikTok, Reels & Shorts.</p>
            </div>
            <span className="bg-gold/10 text-gold text-sm font-semibold px-4 py-2 rounded-full">
              {campaign?.status || 'Active'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center mb-6">
            <div>
              <div className="text-gold font-bold text-2xl">${cpm.toFixed(2)}</div>
              <div className="text-text-muted text-sm mt-1">CPM per 1K views</div>
            </div>
            <div>
              <div className="text-gold font-bold text-2xl">${budget}</div>
              <div className="text-text-muted text-sm mt-1">Total budget</div>
            </div>
            <div>
              <div className="text-gold font-bold text-2xl">{subs}</div>
              <div className="text-text-muted text-sm mt-1">Submissions</div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Budget used</span>
              <span className="text-text">{pct}% · ${spent.toFixed(0)} of ${budget}</span>
            </div>
            <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>

          <a href="/login" className="btn-gold w-full text-lg">
            Join this campaign
          </a>
        </div>

        {/* SEO content */}
        <section className="card p-8 mb-8">
          <h2 className="font-display text-xl text-text mb-4">How it works</h2>
          <p className="text-text-secondary leading-relaxed mb-4">
            Artists post campaigns with CPM rates on SendMusic.io. Creators browse, pick tracks they love, 
            and make TikToks, Instagram Reels, or YouTube Shorts. They submit their content links, 
            and artists review and approve. Creators get paid for every verified view.
          </p>
          <p className="text-text-secondary leading-relaxed">
            No bots. No fake views. Every view is verified through platform APIs. 
            Artists set a max payout per submission so their budget stays safe.
          </p>
        </section>
      </div>
    </div>
  );
}
