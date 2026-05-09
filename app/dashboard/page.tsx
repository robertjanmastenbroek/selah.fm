'use client';

import { useState, useEffect } from 'react';
import BottomNav from '@/components/BottomNav';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';

interface Campaign {
  id: string;
  trackTitle: string;
  cpmRate: number;
  budget: number;
  spent: number;
  views: number;
  submissions: number;
}

export default function ArtistDashboard() {
  const [step, setStep] = useState<'create' | 'live'>('live');
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { addToast } = useToast();

  // Campaign form
  const [trackTitle, setTrackTitle] = useState('');
  const [trackUrl, setTrackUrl] = useState('');
  const [cpm, setCpm] = useState('3');
  const [budget, setBudget] = useState('500');
  const [maxPayout, setMaxPayout] = useState('100');

  // Load campaigns on mount
  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCampaigns(data.map((c: any) => ({
            id: c.id,
            trackTitle: c.track_title || c.trackTitle,
            cpmRate: c.cpm_rate_cents ? c.cpm_rate_cents / 100 : (c.cpm || 3),
            budget: c.total_budget_cents ? c.total_budget_cents / 100 : (c.budget || 500),
            spent: c.budget_remaining_cents
              ? (c.total_budget_cents - c.budget_remaining_cents) / 100
              : (c.spent || 0),
            views: c.total_verified_views || c.views || 0,
            submissions: parseInt(c.approved_submissions || c.submissions || '0'),
          })));
        }
      })
      .catch(() => {
        // No API yet — show placeholder
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle,
          trackUrl,
          cpmRate: parseInt(cpm),
          budget: parseInt(budget),
          maxPayout: parseInt(maxPayout),
        }),
      });

      const data = await res.json();

      if (data.error) {
        // API not available — save locally
        const newCampaign: Campaign = {
          id: Date.now().toString(),
          trackTitle,
          cpmRate: parseInt(cpm),
          budget: parseInt(budget),
          spent: 0,
          views: 0,
          submissions: 0,
        };
        setCampaigns(prev => [newCampaign, ...prev]);
        addToast('Campaign created (local mode — DB not connected)', 'info');
      } else {
        // Reload campaigns
        setCampaigns(prev => [...prev, {
          id: data.id,
          trackTitle: data.track_title || trackTitle,
          cpmRate: data.cpm_rate_cents ? data.cpm_rate_cents / 100 : parseInt(cpm),
          budget: parseInt(budget),
          spent: 0,
          views: 0,
          submissions: 0,
        }]);
        addToast('Campaign launched!', 'success');
      }

      // Reset form
      setTrackTitle('');
      setTrackUrl('');
      setCpm('3');
      setBudget('500');
      setMaxPayout('100');
      setStep('live');
    } catch (err) {
      // API not available — save locally anyway
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        trackTitle,
        cpmRate: parseInt(cpm),
        budget: parseInt(budget),
        spent: 0,
        views: 0,
        submissions: 0,
      };
      setCampaigns(prev => [newCampaign, ...prev]);
      addToast('Campaign created (database coming soon)', 'info');
      setTrackTitle('');
      setTrackUrl('');
      setStep('live');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBudget = async (campaignId: string) => {
    try {
      const res = await fetch('/api/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100, campaignId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        addToast('Stripe not configured — add STRIPE_SECRET_KEY to Railway', 'error');
      }
    } catch {
      addToast('Stripe not available yet', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-void pb-20">
      {/* Top bar */}
      <div className="sticky top-0 bg-void/95 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center justify-between z-10">
        <span className="font-display text-gold text-lg">SendMusic.io</span>
        <div className="flex items-center gap-3">
          <NotificationBell />
          {step === 'live' && (
            <button onClick={() => setStep('create')} className="btn-gold text-sm !py-2 !px-4">+ New</button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {step === 'create' ? (
          <>
            <h1 className="text-2xl font-bold text-ivory mb-2">Create campaign</h1>
            <p className="text-muted text-sm mb-8">Set your terms. Creators promote your track. You approve and pay for views.</p>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="text-sm text-muted mb-1.5 block">Track name</label>
                <input value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)}
                  placeholder="My Song Title" required
                  className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg
                             placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all" />
              </div>

              <div>
                <label className="text-sm text-muted mb-1.5 block">Track link</label>
                <input value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)}
                  placeholder="spotify.com/track/..." required
                  className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg
                             placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted mb-1.5 block">CPM ($/1K views)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                    <input value={cpm} onChange={(e) => setCpm(e.target.value)}
                      type="number" min="1" max="20"
                      className="w-full bg-void-card border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-ivory text-lg focus:outline-none focus:border-gold/50 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted mb-1.5 block">Budget ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                    <input value={budget} onChange={(e) => setBudget(e.target.value)}
                      type="number" min="100" step="100"
                      className="w-full bg-void-card border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-ivory text-lg focus:outline-none focus:border-gold/50 transition-all" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted mb-1.5 block">Max payout per video ($)</label>
                <p className="text-xs text-muted/60 mb-2">One viral clip won't drain your budget</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                  <input value={maxPayout} onChange={(e) => setMaxPayout(e.target.value)}
                    type="number" min="10"
                    className="w-full bg-void-card border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-ivory text-lg focus:outline-none focus:border-gold/50 transition-all" />
                </div>
              </div>

              {cpm && budget && (
                <div className="bg-gold/5 border border-gold/10 rounded-xl p-4 text-sm">
                  <span className="text-gold">Estimate: </span>
                  <span className="text-muted">
                    ${budget} budget ÷ ${cpm} CPM = up to{' '}
                    <span className="text-ivory">{Math.floor((parseInt(budget) / parseInt(cpm)) * 1000).toLocaleString()}</span> views.
                  </span>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-gold w-full text-lg !py-3.5 !rounded-xl">
                {loading ? 'Creating...' : 'Launch campaign'}
              </button>

              <button type="button" onClick={() => setStep('live')}
                className="w-full text-muted text-sm py-2 hover:text-ivory">
                ← Back to campaigns
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ivory mb-6">Your campaigns</h1>

            {campaigns.length === 0 && (
              <div className="card-elevated text-center py-12">
                <div className="text-4xl mb-3">📊</div>
                <div className="text-ivory font-semibold mb-2">No campaigns yet</div>
                <p className="text-muted text-sm mb-6">Create your first campaign and let creators promote your music.</p>
                <button onClick={() => setStep('create')} className="btn-gold">Create campaign</button>
              </div>
            )}

            <div className="space-y-4">
              {campaigns.map((c) => (
                <div key={c.id} className="card-elevated">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold text-ivory text-lg">{c.trackTitle}</div>
                      <div className="text-muted text-sm">${c.cpmRate} CPM · ${c.budget} budget</div>
                    </div>
                    <div className="bg-gold/10 text-gold text-xs font-bold px-3 py-1 rounded-full">LIVE</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-gold text-xl font-bold">{c.submissions}</div>
                      <div className="text-muted text-xs">submissions</div>
                    </div>
                    <div>
                      <div className="text-gold text-xl font-bold">{c.views >= 1000 ? `${(c.views / 1000).toFixed(1)}K` : c.views}</div>
                      <div className="text-muted text-xs">views</div>
                    </div>
                    <div>
                      <div className="text-gold text-xl font-bold">${c.spent}</div>
                      <div className="text-muted text-xs">of ${c.budget}</div>
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 bg-void rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full" style={{ width: `${Math.min((c.spent / c.budget) * 100, 100)}%` }} />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <a href="/review" className="flex-1 btn-outline text-sm !py-2 text-center">Review ({c.submissions})</a>
                    <button onClick={() => handleAddBudget(c.id)} className="flex-1 btn-gold text-sm !py-2">Add budget</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav role="artist" />
    </div>
  );
}
