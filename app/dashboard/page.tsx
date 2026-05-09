'use client';

import { useState, useEffect } from 'react';
import TopNav from '@/components/TopNav';
import ImageUpload from '@/components/ImageUpload';
import { useToast } from '@/components/Toast';

interface Campaign {
  id: string;
  trackTitle: string;
  coverArt: string;
  cpmRate: number;
  budget: number;
  spent: number;
  views: number;
  submissions: number;
}

export default function DashboardPage() {
  const [step, setStep] = useState<'list' | 'wizard'>('list');
  const [wizardStep, setWizardStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { addToast } = useToast();

  const [coverArt, setCoverArt] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [trackUrl, setTrackUrl] = useState('');
  const [cpm, setCpm] = useState('3');
  const [budget, setBudget] = useState('500');
  const [maxPayout, setMaxPayout] = useState('100');

  useEffect(() => {
    fetch('/api/campaigns').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setCampaigns(data.map((c: any) => ({
          id: c.id, trackTitle: c.track_title || c.trackTitle,
          coverArt: c.cover_art_url || c.coverArt || '',
          cpmRate: c.cpm_rate_cents ? c.cpm_rate_cents / 100 : (c.cpm || 3),
          budget: c.total_budget_cents ? c.total_budget_cents / 100 : (c.budget || 500),
          spent: c.budget_remaining_cents ? (c.total_budget_cents - c.budget_remaining_cents) / 100 : 0,
          views: c.total_verified_views || c.views || 0,
          submissions: parseInt(c.approved_submissions || c.submissions || '0'),
        })));
      }
    }).catch(() => {});
  }, []);

  const createCampaign = async () => {
    setLoading(true);
    const newCamp: Campaign = {
      id: Date.now().toString(),
      trackTitle, coverArt,
      cpmRate: parseInt(cpm), budget: parseInt(budget),
      spent: 0, views: 0, submissions: 0,
    };

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackTitle, trackUrl, coverArtUrl: coverArt, cpmRate: parseInt(cpm), budget: parseInt(budget), maxPayout: parseInt(maxPayout) }),
      });
      const data = await res.json();
      if (!data.error && data.id) newCamp.id = data.id;
    } catch {}

    setCampaigns(prev => [newCamp, ...prev]);
    addToast('Campaign live!', 'success');
    setCoverArt(''); setTrackTitle(''); setTrackUrl(''); setCpm('3'); setBudget('500');
    setWizardStep(1); setStep('list'); setLoading(false);
  };

  const estimatedViews = Math.floor((parseInt(budget || '0') / parseInt(cpm || '1')) * 1000);

  return (
    <div className="min-h-screen bg-void">
      <TopNav />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 'wizard' ? (
          <>
            {/* Wizard progress */}
            <div className="flex items-center gap-2 mb-8">
              {[1, 2, 3].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full transition-all ${s <= wizardStep ? 'bg-gold' : 'bg-white/10'}`} />
              ))}
            </div>

            {/* Step 1: Cover art */}
            {wizardStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-ivory mb-1">Campaign cover</h1>
                  <p className="text-muted text-sm mb-6">A beautiful cover makes your campaign stand out in the feed.</p>
                </div>
                <ImageUpload onImage={setCoverArt} currentImage={coverArt} />
                {coverArt && (
                  <button onClick={() => setWizardStep(2)} className="btn-gold w-full !rounded-xl">
                    Next: Track details →
                  </button>
                )}
                <button onClick={() => setStep('list')} className="w-full text-muted text-sm py-2 hover:text-ivory">Cancel</button>
              </div>
            )}

            {/* Step 2: Track details */}
            {wizardStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-ivory mb-1">Track details</h1>
                  <p className="text-muted text-sm mb-6">Tell creators what they'll be promoting.</p>
                </div>
                <div>
                  <label className="text-sm text-muted mb-1.5 block">Track name</label>
                  <input value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)}
                    placeholder="My Song Title" required
                    className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all" />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1.5 block">Track link</label>
                  <input value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)}
                    placeholder="spotify.com/track/..." required
                    className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3.5 text-ivory text-lg placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setWizardStep(1)} className="flex-1 btn-outline !rounded-xl">← Back</button>
                  <button onClick={() => setWizardStep(3)} disabled={!trackTitle || !trackUrl}
                    className="flex-1 btn-gold !rounded-xl disabled:opacity-50">Next: Budget →</button>
                </div>
              </div>
            )}

            {/* Step 3: Budget + Launch */}
            {wizardStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-bold text-ivory mb-1">Budget & launch</h1>
                  <p className="text-muted text-sm mb-6">Set your CPM rate and total budget. You only pay for verified views.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted mb-1.5 block">CPM ($/1K views)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                      <input value={cpm} onChange={(e) => setCpm(e.target.value)} type="number" min="1" max="20"
                        className="w-full bg-void-card border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-ivory text-lg focus:outline-none focus:border-gold/50 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted mb-1.5 block">Budget ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                      <input value={budget} onChange={(e) => setBudget(e.target.value)} type="number" min="100" step="100"
                        className="w-full bg-void-card border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-ivory text-lg focus:outline-none focus:border-gold/50 transition-all" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted mb-1.5 block">Max payout per submission ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">$</span>
                    <input value={maxPayout} onChange={(e) => setMaxPayout(e.target.value)} type="number" min="10"
                      className="w-full bg-void-card border border-white/10 rounded-xl pl-8 pr-4 py-3.5 text-ivory text-lg focus:outline-none focus:border-gold/50 transition-all" />
                  </div>
                </div>
                <div className="bg-gold/5 border border-gold/10 rounded-xl p-4 text-sm">
                  <span className="text-gold">Estimate: </span>
                  <span className="text-muted">${budget} ÷ ${cpm} CPM = up to <span className="text-ivory">{estimatedViews.toLocaleString()}</span> views</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setWizardStep(2)} className="flex-1 btn-outline !rounded-xl">← Back</button>
                  <button onClick={createCampaign} disabled={loading || !budget}
                    className="flex-1 btn-gold !rounded-xl disabled:opacity-50">
                    {loading ? 'Launching...' : '🚀 Launch campaign'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-ivory">Your campaigns</h1>
              <button onClick={() => setStep('wizard')} className="btn-gold text-sm !py-2 !px-4 !rounded-xl">+ New campaign</button>
            </div>

            {campaigns.length === 0 && (
              <div className="card-elevated text-center py-16">
                <div className="text-5xl mb-4">🎬</div>
                <div className="text-ivory font-semibold text-lg mb-2">Create your first campaign</div>
                <p className="text-muted text-sm mb-8 max-w-sm mx-auto">Upload your track, set a CPM rate, and creators will promote it on TikTok, Reels, and Shorts.</p>
                <button onClick={() => setStep('wizard')} className="btn-gold !rounded-xl text-lg">Start your first campaign</button>
              </div>
            )}

            <div className="space-y-4">
              {campaigns.map((c) => (
                <div key={c.id} className="card-elevated overflow-hidden">
                  {c.coverArt && (
                    <div className="h-40 overflow-hidden -mx-8 -mt-8 mb-4">
                      <img src={c.coverArt} alt={c.trackTitle} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-semibold text-ivory text-lg">{c.trackTitle}</div>
                      <div className="text-muted text-sm">${c.cpmRate} CPM · ${c.budget} budget</div>
                    </div>
                    <div className="bg-gold/10 text-gold text-xs font-bold px-3 py-1 rounded-full">LIVE</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><div className="text-gold text-xl font-bold">{c.submissions}</div><div className="text-muted text-xs">submissions</div></div>
                    <div><div className="text-gold text-xl font-bold">{c.views >= 1000 ? `${(c.views / 1000).toFixed(1)}K` : c.views}</div><div className="text-muted text-xs">views</div></div>
                    <div><div className="text-gold text-xl font-bold">${c.spent}</div><div className="text-muted text-xs">of ${c.budget}</div></div>
                  </div>
                  <div className="mt-4 h-1.5 bg-void rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full" style={{ width: `${Math.min((c.spent / c.budget) * 100, 100)}%` }} />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <a href="/review" className="flex-1 btn-outline text-sm !py-2 text-center">Review ({c.submissions})</a>
                    <button onClick={async () => {
                      const r = await fetch('/api/stripe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ amount: 100, campaignId: c.id }) });
                      const d = await r.json();
                      d.url ? window.location.href = d.url : addToast('Add STRIPE_SECRET_KEY to Railway', 'error');
                    }} className="flex-1 btn-gold text-sm !py-2">Add budget</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
