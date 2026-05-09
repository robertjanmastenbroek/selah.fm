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
  const [fundingId, setFundingId] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState('10');

  const [coverArt, setCoverArt] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [trackUrl, setTrackUrl] = useState('');
  const [cpm, setCpm] = useState('1');
  const [budget, setBudget] = useState('25');
  const [maxPayout, setMaxPayout] = useState('10');

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
      cpmRate: parseFloat(cpm), budget: parseInt(budget),
      spent: 0, views: 0, submissions: 0,
    };

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackTitle, trackUrl, coverArtUrl: coverArt, cpmRate: parseFloat(cpm), budget: parseInt(budget), maxPayout: parseInt(maxPayout) }),
      });
      const data = await res.json();
      if (!data.error && data.id) newCamp.id = data.id;
    } catch {}

    setCampaigns(prev => [newCamp, ...prev]);
    addToast('Campaign live', 'success');
    setCoverArt(''); setTrackTitle(''); setTrackUrl(''); setCpm('1'); setBudget('25');
    setWizardStep(1); setStep('list'); setLoading(false);
  };

  const estimatedViews = Math.floor((parseInt(budget || '0') / parseFloat(cpm || '1')) * 1000);

  return (
    <div className="min-h-screen bg-void">
      <TopNav />

      <main className="max-w-2xl mx-auto px-4 py-8 md:py-10">
        {step === 'wizard' ? (
          <>
            <div className="flex items-center gap-2 mb-10">
              {[1, 2, 3].map(s => (
                <div key={s}
                  className={`flex-1 h-1 rounded-full transition-all duration-500 ${s <= wizardStep ? 'bg-gold' : 'bg-white/[0.06]'}`} />
              ))}
            </div>

            {wizardStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h1 className="section-title mb-1">Campaign cover</h1>
                  <p className="text-muted/50 text-sm">A beautiful cover makes your campaign stand out.</p>
                </div>
                <ImageUpload onImage={setCoverArt} currentImage={coverArt} />
                {coverArt && (
                  <button onClick={() => setWizardStep(2)} className="btn-primary w-full">
                    Next: Track details
                  </button>
                )}
                <button onClick={() => setStep('list')} className="btn-ghost w-full">Cancel</button>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h1 className="section-title mb-1">Track details</h1>
                  <p className="text-muted/50 text-sm">Tell creators what they'll be promoting.</p>
                </div>
                <div>
                  <label className="text-sm text-muted/60 mb-1.5 block">Track name</label>
                  <input value={trackTitle} onChange={(e) => setTrackTitle(e.target.value)}
                    placeholder="My Song Title" className="input-field" />
                </div>
                <div>
                  <label className="text-sm text-muted/60 mb-1.5 block">Track link</label>
                  <input value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)}
                    placeholder="spotify.com/track/..." className="input-field" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setWizardStep(1)} className="btn-secondary flex-1">Back</button>
                  <button onClick={() => setWizardStep(3)} disabled={!trackTitle || !trackUrl}
                    className="btn-primary flex-1">Next: Budget</button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <h1 className="section-title mb-1">Budget</h1>
                  <p className="text-muted/50 text-sm">Set your CPM rate and budget. Pay only for verified views.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted/60 mb-1.5 block">CPM ($/1K views)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40">$</span>
                      <input value={cpm} onChange={(e) => setCpm(e.target.value)}
                        type="number" min="0.1" max="50" step="0.1" className="input-field pl-8" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted/60 mb-1.5 block">Budget ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40">$</span>
                      <input value={budget} onChange={(e) => setBudget(e.target.value)}
                        type="number" min="5" step="5" className="input-field pl-8" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted/60 mb-1.5 block">Max payout per submission ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/40">$</span>
                    <input value={maxPayout} onChange={(e) => setMaxPayout(e.target.value)}
                      type="number" min="1" className="input-field pl-8" />
                  </div>
                </div>
                <div className="card-glass p-4 text-sm text-muted/60">
                  <span className="text-gold font-medium">${budget}</span> ÷ <span className="text-gold font-medium">${cpm}</span> CPM ≈ <span className="text-ivory font-semibold">{estimatedViews.toLocaleString()}</span> estimated views
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setWizardStep(2)} className="btn-secondary flex-1">Back</button>
                  <button onClick={createCampaign} disabled={loading || !budget}
                    className="btn-primary flex-1">
                    {loading ? 'Creating...' : 'Launch campaign'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="section-title">Your campaigns</h1>
              <button onClick={() => setStep('wizard')} className="btn-primary text-sm !py-2 !px-4">
                New campaign
              </button>
            </div>

            {campaigns.length === 0 && (
              <div className="card-glass text-center py-16 animate-fade-in">
                <div className="text-muted/30 text-[64px] mb-4 font-light">♪</div>
                <div className="text-ivory font-medium text-lg mb-2">Create your first campaign</div>
                <p className="text-muted/40 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                  Upload your track, set a CPM rate, and creators will promote it on TikTok, Reels, and Shorts.
                </p>
                <button onClick={() => setStep('wizard')} className="btn-primary">Start your first campaign</button>
              </div>
            )}

            <div className="space-y-4">
              {campaigns.map((c, i) => (
                <div key={c.id} className="card-glass p-5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                  {c.coverArt && (
                    <div className="h-36 rounded-xl overflow-hidden -mx-5 -mt-5 mb-4">
                      <img src={c.coverArt} alt={c.trackTitle} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-ivory font-semibold text-lg leading-tight">{c.trackTitle}</div>
                      <div className="text-muted/50 text-sm mt-0.5">${c.cpmRate} CPM · ${c.budget} budget</div>
                    </div>
                    <div className="bg-gold/10 text-gold text-[11px] font-semibold px-3 py-1.5 rounded-full">Live</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <div className="text-gold font-bold text-lg">{c.submissions}</div>
                      <div className="text-muted/40 text-[11px] mt-0.5">submissions</div>
                    </div>
                    <div>
                      <div className="text-gold font-bold text-lg">{c.views >= 1000 ? `${(c.views / 1000).toFixed(1)}K` : c.views}</div>
                      <div className="text-muted/40 text-[11px] mt-0.5">views</div>
                    </div>
                    <div>
                      <div className="text-gold font-bold text-lg">${c.spent}</div>
                      <div className="text-muted/40 text-[11px] mt-0.5">of ${c.budget}</div>
                    </div>
                  </div>
                  <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-gold rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((c.spent / c.budget) * 100, 100)}%` }} />
                  </div>
                  {fundingId === c.id ? (
                    <div className="space-y-3 animate-slide-up">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40 text-sm">$</span>
                          <input
                            value={fundingAmount}
                            onChange={(e) => setFundingAmount(e.target.value)}
                            type="number" min="5" step="5"
                            placeholder="10"
                            autoFocus
                            className="input-field pl-7 !py-2.5"
                          />
                        </div>
                        <button onClick={async () => {
                          const amt = parseInt(fundingAmount);
                          if (amt < 5) { addToast('Minimum $5', 'error'); return; }
                          const r = await fetch('/api/stripe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ amount: amt, campaignId: c.id }) });
                          const d = await r.json();
                          d.url ? window.location.href = d.url : addToast('Add STRIPE_SECRET_KEY to Railway', 'error');
                          setFundingId(null);
                        }} className="btn-primary text-sm !py-2.5 !px-4 flex-shrink-0">
                          Fund ${fundingAmount || '?'}
                        </button>
                      </div>
                      <button onClick={() => setFundingId(null)} className="btn-ghost text-xs w-full">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <a href="/review" className="btn-secondary text-sm flex-1 !py-2.5">Review ({c.submissions})</a>
                      <button onClick={() => { setFundingId(c.id); setFundingAmount('10'); }}
                        className="btn-primary text-sm flex-1 !py-2.5">Add budget</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
