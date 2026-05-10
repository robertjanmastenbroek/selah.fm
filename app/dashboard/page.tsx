'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import ImageUpload from '@/components/ImageUpload';
import CampaignCover from '@/components/CampaignCover';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/Toast';
import { trackCreateCampaign, trackFundCampaign } from '@/lib/analytics';
import { Plus, Edit3 } from 'lucide-react';

interface Campaign {
  id: string; trackTitle: string; coverArt: string; cpmRate: number;
  budget: number; spent: number; views: number; submissions: number; status: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const hireCreatorId = searchParams.get('hire') || '';
  const hireCreatorCpm = searchParams.get('cpm') || '';
  const hireCreatorName = searchParams.get('name') || '';

  // Profile is already fetched by TopNav via SWR shared cache — reuse it
  const { data: profileData } = useSWR('/api/auth/me', fetcher, swrConfig);
  const profile = profileData?.user || null;

  const { data: campaignsData, error, isLoading, mutate } = useSWR('/api/campaigns', fetcher, swrConfig);

  const rawCampaigns = campaignsData?.campaigns || [];
  const campaigns: Campaign[] = rawCampaigns.map((c: any) => ({
    id: c.id, trackTitle: c.track_title,
    coverArt: c.cover_art_url || '',
    cpmRate: (c.cpm_rate_cents || 0) / 100,
    budget: (c.total_budget_cents || 0) / 100,
    spent: ((c.total_budget_cents || 0) - (c.budget_remaining_cents || 0)) / 100,
    views: parseInt(c.total_verified_views || '0'),
    submissions: parseInt(c.approved_submissions || '0'),
    status: c.status || 'active',
  }));

  const [step, setStep] = useState<'list' | 'wizard'>(hireCreatorId ? 'wizard' : 'list');
  const [wizardStep, setWizardStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const [fundingId, setFundingId] = useState<string | null>(null);
  const [fundingAmount, setFundingAmount] = useState('10');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [coverArt, setCoverArt] = useState('');
  const [trackTitle, setTrackTitle] = useState('');
  const [trackUrl, setTrackUrl] = useState('');
  const [cpm, setCpm] = useState(hireCreatorCpm || '1');
  const [budget, setBudget] = useState('25');
  const [maxPayout, setMaxPayout] = useState('10');
  const [driveUrl, setDriveUrl] = useState('');
  const [hashtags, setHashtags] = useState('#selahfm');
  const [requirements, setRequirements] = useState('');
  const [requiredHashtags, setRequiredHashtags] = useState('');
  const [requireFtc, setRequireFtc] = useState(false);
  const [minVideoLength, setMinVideoLength] = useState('');
  const [captionReq, setCaptionReq] = useState('');
  const [shareCampaign, setShareCampaign] = useState<{ id: string; title: string } | null>(null);

  const totalViews = campaigns.reduce((s, c) => s + c.views, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalSubmissions = campaigns.reduce((s, c) => s + c.submissions, 0);
  const activeCount = campaigns.filter(c => c.status === 'active').length;

  const createCampaign = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackTitle, trackUrl, coverArtUrl: coverArt, cpmRate: parseFloat(cpm), budget: parseInt(budget), maxPayout: parseInt(maxPayout), driveUrl, hashtags, requirements, requiredHashtags, requireFtc, minVideoLength: minVideoLength ? parseInt(minVideoLength) : null, captionRequirements: captionReq }),
      });
      if (!res.ok) { const err = await res.json(); addToast(err.error || 'Failed to create campaign', 'error'); setLoading(false); return; }
      const created = await res.json();
      trackCreateCampaign(trackTitle, parseInt(budget));
      mutate(); // Revalidate campaign list
      addToast('Campaign live! Share it with your fans.', 'success');
      setShareCampaign({ id: created.id, title: trackTitle });
    } catch { addToast('Network error — try again', 'error'); }
    setCoverArt(''); setTrackTitle(''); setCpm('1'); setBudget('25');
    setWizardStep(1); setStep('list'); setLoading(false);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) { const err = await res.json(); addToast(err.error || 'Failed to update', 'error'); return; }
      mutate();
      addToast(newStatus === 'active' ? 'Campaign resumed' : 'Campaign paused', 'info');
    } catch { addToast('Network error', 'error'); }
  };

  const startEdit = (c: Campaign) => {
    // Pre-fill edit fields from campaign data
    const raw = rawCampaigns.find((r: any) => r.id === c.id);
    if (!raw) return;
    setEditingId(c.id);
    setTrackTitle(raw.track_title || '');
    setTrackUrl(raw.track_url || '');
    setCpm(String(c.cpmRate));
    setBudget(String(c.budget));
    setMaxPayout(String((raw.max_payout_per_submission_cents || 1000) / 100));
    setRequirements(raw.requirements || '');
    setHashtags(raw.recommended_hashtags || '#selahfm');
    setRequiredHashtags(raw.required_hashtags || '');
    setRequireFtc(raw.require_ftc || false);
    setMinVideoLength(raw.min_video_length_seconds ? String(raw.min_video_length_seconds) : '');
    setCaptionReq(raw.caption_requirements || '');
    setCoverArt(raw.cover_art_url || '');
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${editingId}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle, trackUrl,
          cpmRate: parseFloat(cpm),
          budget: parseInt(budget),
          maxPayout: parseInt(maxPayout),
          requirements, hashtags,
          requiredHashtags, requireFtc,
          minVideoLength: minVideoLength ? parseInt(minVideoLength) : null,
          captionRequirements: captionReq,
          coverArtUrl: coverArt || undefined,
        }),
      });
      if (!res.ok) { const err = await res.json(); addToast(err.error || 'Failed to save', 'error'); setEditSaving(false); return; }
      await mutate();
      addToast('Campaign updated!', 'success');
      setEditingId(null);
    } catch { addToast('Network error', 'error'); }
    setEditSaving(false);
  };

  const estimatedViews = Math.floor((parseInt(budget || '0') / parseFloat(cpm || '1')) * 1000);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        {step === 'wizard' ? (
          <>
            {hireCreatorName && wizardStep === 2 && (
              <Card className="mb-6 border-accent/20 bg-accent/5">
                <CardContent className="p-4 text-center text-sm">
                  🎯 Creating campaign for <strong>{decodeURIComponent(hireCreatorName)}</strong> at ${hireCreatorCpm} CPM
                </CardContent>
              </Card>
            )}
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
                <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="Recommended hashtags (optional)" />
                <Input value={requiredHashtags} onChange={e => setRequiredHashtags(e.target.value)} placeholder="Required hashtags — creators MUST include these" />
                <div className="flex items-center gap-3 py-1">
                  <input type="checkbox" id="ftc" checked={requireFtc} onChange={e => setRequireFtc(e.target.checked)} className="rounded" />
                  <label htmlFor="ftc" className="text-sm text-muted-foreground">Require FTC disclosure hashtag (#ad, #paidpartner)</label>
                </div>
                <Input value={minVideoLength} onChange={e => setMinVideoLength(e.target.value)} type="number" placeholder="Minimum video length (seconds)" />
                <Input value={captionReq} onChange={e => setCaptionReq(e.target.value)} placeholder="Caption requirements (optional)" />
                <Input value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Content requirements & guidelines" />
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
                  <div><label className="text-sm text-muted-foreground mb-1.5 block">CPM ($/1K views)</label><Input type="number" min="0.1" step="0.1" value={cpm} onChange={e => setCpm(e.target.value)} /></div>
                  <div><label className="text-sm text-muted-foreground mb-1.5 block">Budget ($)</label><Input type="number" min="5" step="5" value={budget} onChange={e => setBudget(e.target.value)} /></div>
                </div>
                <div><label className="text-sm text-muted-foreground mb-1.5 block">Max payout per submission ($)</label><Input type="number" min="1" value={maxPayout} onChange={e => setMaxPayout(e.target.value)} /></div>
                <Card className="bg-muted/50"><CardContent className="p-4 text-sm text-muted-foreground space-y-2">
                  <p>${budget} ÷ ${cpm} CPM ≈ <span className="text-foreground font-semibold">{estimatedViews.toLocaleString()}</span> estimated views</p>
                  <p className="text-xs">Creators earn 80% of payout after 20% platform fee. You pay exactly ${budget || '0'} — no hidden costs.</p>
                </CardContent></Card>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setWizardStep(2)} className="flex-1">Back</Button>
                  <Button onClick={createCampaign} disabled={loading} className="flex-1">{loading ? 'Creating...' : 'Launch campaign'}</Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {shareCampaign && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-primary/[0.06] backdrop-blur-xl border border-primary/20 p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">🎉 "{shareCampaign.title}" is live!</h3>
                    <p className="text-sm text-muted-foreground max-w-md">Share your campaign link with your fans and on social media.</p>
                    <div className="flex items-center gap-2 pt-1">
                      <code className="text-xs bg-white/[0.06] border border-white/[0.08] px-3 py-2 rounded-lg font-mono select-all">https://selah.fm/c/{shareCampaign.id}</code>
                      <button onClick={() => { navigator.clipboard.writeText(`https://selah.fm/c/${shareCampaign.id}`); addToast('Link copied!', 'success'); }} className="shrink-0 px-4 py-2 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs font-medium hover:bg-white/[0.1] transition-colors active:scale-[0.97]">Copy link</button>
                    </div>
                  </div>
                  <button onClick={() => setShareCampaign(null)} className="text-muted-foreground hover:text-foreground text-sm shrink-0">Dismiss</button>
                </div>
              </motion.div>
            )}

            <Card className="mb-6 border-accent/20 bg-accent/[0.03] animate-fade-in">
              <CardContent className="p-4 text-center space-y-2">
                <p className="text-sm font-medium">🔗 Invite artists & earn 5%</p>
                <p className="text-xs text-muted-foreground">
                  When a referred artist makes their first deposit, you both get 5% of it credited to your campaigns.
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="text-xs bg-muted px-3 py-1.5 rounded-lg font-mono">https://selah.fm/login?ref={profile?.email || 'you@email.com'}</code>
                </div>
              </CardContent>
            </Card>

            {campaigns.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                  { value: activeCount, label: 'Active' },
                  { value: totalSubmissions, label: 'Submissions' },
                  { value: totalViews >= 1000 ? `${(totalViews/1000).toFixed(1)}K` : totalViews, label: 'Total Views' },
                  { value: `$${totalSpent.toFixed(0)}`, label: 'Spent' },
                ].map(s => (
                  <Card key={s.label}><CardContent className="p-3 text-center"><div className="text-lg font-bold text-accent-foreground">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></CardContent></Card>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mb-6">
              <h1 className="section-title">Your campaigns</h1>
              <Button onClick={() => setStep('wizard')} size="sm"><Plus className="h-4 w-4 mr-1" /> New</Button>
            </div>

            {/* Inline edit form — appears when editing a campaign */}
            {editingId && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-primary/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm">Edit campaign</h2>
                  <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Track title</label>
                    <Input value={trackTitle} onChange={e => setTrackTitle(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Spotify/SoundCloud URL</label>
                    <Input value={trackUrl} onChange={e => setTrackUrl(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">CPM rate ($/1K views)</label>
                    <Input type="number" min="0.1" step="0.1" value={cpm} onChange={e => setCpm(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Budget ($)</label>
                    <Input type="number" min="5" step="5" value={budget} onChange={e => setBudget(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Max payout per submission ($)</label>
                    <Input type="number" min="1" value={maxPayout} onChange={e => setMaxPayout(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Min video length (seconds)</label>
                    <Input type="number" min="0" value={minVideoLength} onChange={e => setMinVideoLength(e.target.value)} className="text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Recommended hashtags</label>
                    <Input value={hashtags} onChange={e => setHashtags(e.target.value)} className="text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Required hashtags</label>
                    <Input value={requiredHashtags} onChange={e => setRequiredHashtags(e.target.value)} className="text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Caption requirements</label>
                    <Input value={captionReq} onChange={e => setCaptionReq(e.target.value)} className="text-sm" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Requirements & guidelines</label>
                    <Input value={requirements} onChange={e => setRequirements(e.target.value)} className="text-sm" />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" checked={requireFtc} onChange={e => setRequireFtc(e.target.checked)} /> Require FTC (#ad)
                  </label>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setEditingId(null)} className="flex-1">Cancel</Button>
                  <Button onClick={handleEditSave} disabled={editSaving || !trackTitle} className="flex-1">{editSaving ? 'Saving...' : 'Save changes'}</Button>
                </div>
              </motion.div>
            )}

            {error ? (
              <Card className="text-center py-16"><CardContent><h2 className="text-lg font-medium mb-2">Couldn't load campaigns</h2><p className="text-muted-foreground text-sm mb-4">Check your connection.</p><Button variant="outline" onClick={() => mutate()}>Retry</Button></CardContent></Card>
            ) : isLoading ? (
              <div className="campaign-grid">{[1,2].map(i => <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>)}</div>
            ) : campaigns.length === 0 ? (
              <Card className="text-center py-16 animate-fade-in">
                <CardContent>
                  <img src="/images/dashboard-mockup.png" alt="Create your first campaign" className="mx-auto mb-6 w-64 h-48 object-contain opacity-80 rounded-xl" loading="lazy" />
                  <h2 className="text-lg font-medium mb-2">Create your first campaign</h2>
                  <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">Upload your track, set a CPM rate, and creators will promote it.</p>
                  <Button onClick={() => setStep('wizard')}>Start your first campaign</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="campaign-grid">
                {campaigns.map((c, i) => {
                  const pct = c.budget > 0 ? Math.min((c.spent / c.budget) * 100, 100) : 0;
                  return (
                    <Card key={c.id} className="animate-slide-up overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
                      <CampaignCover src={c.coverArt} title={c.trackTitle} className="h-40" />
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div><h3 className="font-semibold text-lg leading-tight">{c.trackTitle}</h3><p className="text-muted-foreground text-sm">${c.cpmRate} CPM · ${c.budget} budget</p></div>
                          <Badge variant={c.status === 'active' ? 'default' : 'secondary'}>{c.status === 'active' ? 'Live' : c.status}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div><div className="font-bold text-lg">{c.submissions}</div><div className="text-muted-foreground text-xs">subs</div></div>
                          <div><div className="font-bold text-lg">{c.views >= 1000 ? `${(c.views/1000).toFixed(1)}K` : c.views}</div><div className="text-muted-foreground text-xs">views</div></div>
                          <div><div className="font-bold text-lg">${c.spent}</div><div className="text-muted-foreground text-xs">of ${c.budget}</div></div>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                        {fundingId === c.id ? (
                          <div className="space-y-2 animate-slide-up">
                            <div className="flex gap-2">
                              <Input type="number" min="5" value={fundingAmount} onChange={e => setFundingAmount(e.target.value)} className="flex-1" autoFocus />
                              <Button onClick={async () => {
                                const amt = parseInt(fundingAmount); if (amt < 5) { addToast('Minimum $5', 'error'); return; }
                                const r = await fetch('/api/stripe', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ amount: amt, campaignId: c.id }) });
                                const d = await r.json();
                                if (d.url) { trackFundCampaign(amt); window.location.href = d.url; } else { addToast('Stripe not configured', 'error'); }
                                setFundingId(null);
                              }}>Fund ${fundingAmount}</Button>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setFundingId(null)} className="w-full">Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.location.href = '/review'}>Review ({c.submissions})</Button>
                            <Button variant="outline" size="sm" onClick={() => startEdit(c)} title="Edit campaign"><Edit3 size={14} /></Button>
                            <Button size="sm" className="flex-1" onClick={() => { setFundingId(c.id); setFundingAmount('10'); }}>Add budget</Button>
                            <Button variant="ghost" size="sm" onClick={() => toggleStatus(c.id, c.status)} title={c.status === 'active' ? 'Pause' : 'Resume'}>{c.status === 'active' ? '⏸' : '▶'}</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background"><Header /><main className="page-container"><div className="space-y-4"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-40 w-full" /></div></main></div>}>
      <DashboardContent />
    </Suspense>
  );
}
