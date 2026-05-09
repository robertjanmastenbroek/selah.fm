'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import ImageUpload from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/Toast';
import { Plus } from 'lucide-react';

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
  const [driveUrl, setDriveUrl] = useState('');
  const [hashtags, setHashtags] = useState('#selahfm');
  const [requirements, setRequirements] = useState('');

  useEffect(() => {
    fetch('/api/campaigns').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setCampaigns(data.map((c: any) => ({
          id: c.id, trackTitle: c.track_title || c.trackTitle,
          coverArt: c.cover_art_url || '',
          cpmRate: (c.cpm_rate_cents || 0) / 100,
          budget: (c.total_budget_cents || 0) / 100,
          spent: ((c.total_budget_cents || 0) - (c.budget_remaining_cents || 0)) / 100,
          views: parseInt(c.total_verified_views || '0'),
          submissions: parseInt(c.approved_submissions || '0'),
        })));
      }
    }).catch(() => {});
  }, []);

  const createCampaign = async () => {
    setLoading(true);
    const newCamp: Campaign = {
      id: Date.now().toString(), trackTitle, coverArt,
      cpmRate: parseFloat(cpm), budget: parseInt(budget),
      spent: 0, views: 0, submissions: 0,
    };
    try {
      await fetch('/api/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackTitle, trackUrl, coverArtUrl: coverArt, cpmRate: parseFloat(cpm), budget: parseInt(budget), maxPayout: parseInt(maxPayout), driveUrl, hashtags, requirements }),
      });
    } catch {}
    setCampaigns(prev => [newCamp, ...prev]);
    addToast('Campaign live', 'success');
    setCoverArt(''); setTrackTitle(''); setCpm('1'); setBudget('25');
    setWizardStep(1); setStep('list'); setLoading(false);
  };

  const estimatedViews = Math.floor((parseInt(budget || '0') / parseFloat(cpm || '1')) * 1000);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="page-container">
        {step === 'wizard' ? (
          <>
            <div className="flex gap-2 mb-10">
              {[1, 2, 3].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= wizardStep ? 'bg-foreground' : 'bg-muted'}`} />
              ))}
            </div>
            {wizardStep === 1 && (
              <div className="max-w-lg mx-auto space-y-6 animate-slide-up">
                <h1 className="section-title">Campaign cover</h1>
                <p className="text-muted-foreground text-sm">A beautiful cover makes your campaign stand out.</p>
                <ImageUpload onImage={setCoverArt} currentImage={coverArt} />
                {coverArt && <Button onClick={() => setWizardStep(2)} className="w-full">Continue</Button>}
                <Button variant="ghost" onClick={() => setStep('list')} className="w-full">Cancel</Button>
              </div>
            )}
            {wizardStep === 2 && (
              <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
                <h1 className="section-title">Track details</h1>
                <p className="text-muted-foreground text-sm mb-6">Tell creators what they'll be promoting.</p>
                <Input value={trackTitle} onChange={e => setTrackTitle(e.target.value)} placeholder="Track name" />
                <Input value={trackUrl} onChange={e => setTrackUrl(e.target.value)} placeholder="Spotify or SoundCloud link" />
                <Input value={driveUrl} onChange={e => setDriveUrl(e.target.value)} placeholder="Google Drive link (optional)" />
                <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="Recommended hashtags" />
                <Input value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Requirements for creators (optional)" />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setWizardStep(1)} className="flex-1">Back</Button>
                  <Button onClick={() => setWizardStep(3)} disabled={!trackTitle} className="flex-1">Continue</Button>
                </div>
              </div>
            )}
            {wizardStep === 3 && (
              <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
                <h1 className="section-title">Budget</h1>
                <p className="text-muted-foreground text-sm mb-6">Pay only for verified views.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">CPM ($/1K views)</label>
                    <Input type="number" min="0.1" step="0.1" value={cpm} onChange={e => setCpm(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Budget ($)</label>
                    <Input type="number" min="5" step="5" value={budget} onChange={e => setBudget(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Max payout per submission ($)</label>
                  <Input type="number" min="1" value={maxPayout} onChange={e => setMaxPayout(e.target.value)} />
                </div>
                <Card className="bg-muted/50">
                  <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
                    <p>${budget} ÷ ${cpm} CPM ≈ <span className="text-foreground font-semibold">{estimatedViews.toLocaleString()}</span> estimated views</p>
                    <p className="text-xs">Creators earn 80% of payout after 20% platform fee. You pay exactly ${budget || '0'} — no hidden costs.</p>
                  </CardContent>
                </Card>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setWizardStep(2)} className="flex-1">Back</Button>
                  <Button onClick={createCampaign} disabled={loading} className="flex-1">
                    {loading ? 'Creating...' : 'Launch campaign'}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="section-title">Your campaigns</h1>
              <Button onClick={() => setStep('wizard')} size="sm">
                <Plus className="h-4 w-4 mr-1" /> New
              </Button>
            </div>

            {campaigns.length === 0 && (
              <Card className="text-center py-16 animate-fade-in">
                <CardContent>
                  <p className="text-6xl mb-4 opacity-10">♪</p>
                  <h2 className="text-lg font-medium mb-2">Create your first campaign</h2>
                  <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
                    Upload your track, set a CPM rate, and creators will promote it.
                  </p>
                  <Button onClick={() => setStep('wizard')}>Start your first campaign</Button>
                </CardContent>
              </Card>
            )}

            <div className="campaign-grid">
              {campaigns.map((c, i) => {
                const pct = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0;
                return (
                  <Card key={c.id} className="animate-slide-up overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                    {c.coverArt && (
                      <div className="h-40 overflow-hidden">
                        <img src={c.coverArt} alt={c.trackTitle} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg leading-tight">{c.trackTitle}</h3>
                          <p className="text-muted-foreground text-sm">${c.cpmRate} CPM · ${c.budget} budget</p>
                        </div>
                        <Badge variant="secondary">Live</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div><div className="font-bold text-lg">{c.submissions}</div><div className="text-muted-foreground text-xs">subs</div></div>
                        <div><div className="font-bold text-lg">{c.views >= 1000 ? `${(c.views / 1000).toFixed(1)}K` : c.views}</div><div className="text-muted-foreground text-xs">views</div></div>
                        <div><div className="font-bold text-lg">${c.spent}</div><div className="text-muted-foreground text-xs">of ${c.budget}</div></div>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                      {fundingId === c.id ? (
                        <div className="space-y-2 animate-slide-up">
                          <div className="flex gap-2">
                            <Input type="number" min="5" value={fundingAmount} onChange={e => setFundingAmount(e.target.value)} className="flex-1" autoFocus />
                            <Button onClick={async () => {
                              const amt = parseInt(fundingAmount);
                              if (amt < 5) { addToast('Minimum $5', 'error'); return; }
                              const r = await fetch('/api/stripe', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ amount: amt, campaignId: c.id }) });
                              const d = await r.json();
                              d.url ? window.location.href = d.url : addToast('Stripe not configured', 'error');
                              setFundingId(null);
                            }}>Fund ${fundingAmount}</Button>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setFundingId(null)} className="w-full">Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => window.location.href = '/review'}>
                            Review ({c.submissions})
                          </Button>
                          <Button size="sm" className="flex-1" onClick={() => { setFundingId(c.id); setFundingAmount('10'); }}>
                            Add budget
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
