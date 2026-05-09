'use client';

import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import NotificationBell from '@/components/NotificationBell';
import { useToast } from '@/components/Toast';

export default function ArtistDashboard() {
  const [step, setStep] = useState<'create' | 'live'>('create');

  // Campaign form
  const [trackTitle, setTrackTitle] = useState('');
  const [trackUrl, setTrackUrl] = useState('');
  const [cpm, setCpm] = useState('3');
  const [budget, setBudget] = useState('500');
  const [maxPayout, setMaxPayout] = useState('100');

  // Mock campaigns
  const [campaigns] = useState([
    { id: '1', track: 'Midnight Frequencies', cpm: 3, budget: 500, spent: 120, views: 40000, subs: 8 },
  ]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('live');
  };

  return (
    <div className="min-h-screen bg-void">
      {/* Top bar */}
      <div className="sticky top-0 bg-void/95 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center justify-between z-10">
        <span className="font-display text-gold text-lg">SendMusic.io</span>
        <div className="flex items-center gap-3">
          {step === 'live' && (
            <button onClick={() => setStep('create')} className="btn-gold text-sm !py-2 !px-4">+ New campaign</button>
          )}
          <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold">M</div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {step === 'create' ? (
          <>
            <h1 className="text-2xl font-bold text-ivory mb-2">Create campaign</h1>
            <p className="text-muted text-sm mb-8">Set your terms. Creators apply to promote your track.</p>

            <form onSubmit={handleCreate} className="space-y-5">
              {/* Track title */}
              <div>
                <label className="text-sm text-muted mb-1.5 block">Track name</label>
                <input
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  placeholder="My Song Title"
                  required
                  className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg
                             placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all"
                />
              </div>

              {/* Track URL */}
              <div>
                <label className="text-sm text-muted mb-1.5 block">Track link</label>
                <input
                  value={trackUrl}
                  onChange={(e) => setTrackUrl(e.target.value)}
                  placeholder="spotify.com/track/..."
                  required
                  className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg
                             placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all"
                />
              </div>

              {/* CPM + Budget row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted mb-1.5 block">CPM ($/1K views)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                    <input
                      value={cpm}
                      onChange={(e) => setCpm(e.target.value)}
                      type="number" min="1" max="20"
                      className="w-full bg-void-card border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-ivory text-lg
                                 focus:outline-none focus:border-gold/50 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted mb-1.5 block">Budget ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                    <input
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      type="number" min="100" step="100"
                      className="w-full bg-void-card border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-ivory text-lg
                                 focus:outline-none focus:border-gold/50 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Max payout */}
              <div>
                <label className="text-sm text-muted mb-1.5 block">Max payout per video ($)</label>
                <p className="text-xs text-muted/60 mb-2">One viral clip won't drain your budget</p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                  <input
                    value={maxPayout}
                    onChange={(e) => setMaxPayout(e.target.value)}
                    type="number" min="10"
                    className="w-full bg-void-card border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-ivory text-lg
                               focus:outline-none focus:border-gold/50 transition-all"
                  />
                </div>
              </div>

              {/* Quick math */}
              {cpm && budget && (
                <div className="bg-gold/5 border border-gold/10 rounded-xl p-4 text-sm">
                  <span className="text-gold">Estimate: </span>
                  <span className="text-muted">
                    ${budget} budget ÷ ${cpm} CPM = up to{' '}
                    <span className="text-ivory">{Math.floor((parseInt(budget) / parseInt(cpm)) * 1000).toLocaleString()}</span> views.
                    Max <span className="text-ivory">${maxPayout}</span> per video.
                  </span>
                </div>
              )}

              <button type="submit" className="btn-gold w-full text-lg !py-3.5 !rounded-xl">
                Launch campaign
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-ivory mb-6">Your campaigns</h1>
            <div className="space-y-4">
              {campaigns.map((c) => (
                <div key={c.id} className="card-elevated">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold text-ivory text-lg">{c.track}</div>
                      <div className="text-muted text-sm">${c.cpm} CPM · ${c.budget} budget</div>
                    </div>
                    <div className="bg-gold/10 text-gold text-xs font-bold px-3 py-1 rounded-full">LIVE</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-gold text-xl font-bold">{c.subs}</div>
                      <div className="text-muted text-xs">submissions</div>
                    </div>
                    <div>
                      <div className="text-gold text-xl font-bold">{(c.views / 1000).toFixed(1)}K</div>
                      <div className="text-muted text-xs">views</div>
                    </div>
                    <div>
                      <div className="text-gold text-xl font-bold">${c.spent}</div>
                      <div className="text-muted text-xs">spent of ${c.budget}</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-4 h-1.5 bg-void rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full" style={{ width: `${(c.spent / c.budget) * 100}%` }}></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <a href="/review" className="flex-1 btn-outline text-sm !py-2 text-center">Review submissions</a>
                    <button onClick={async () => {
                      const res = await fetch('/api/stripe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ amount: 100, campaignId: c.id }) });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                      else alert('Stripe not configured — add STRIPE_SECRET_KEY to Railway');
                    }} className="flex-1 btn-gold text-sm !py-2">Add budget</button>
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
