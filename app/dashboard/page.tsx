'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import ImageUpload from '@/components/ImageUpload';
import GalleryUpload, { type GalleryItem } from '@/components/GalleryUpload';
import CampaignCover from '@/components/CampaignCover';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/Toast';
import { trackCreateCampaign, trackFundCampaign } from '@/lib/analytics';
import { Plus, Edit3, ExternalLink } from 'lucide-react';
import StripePaymentModal from '@/components/StripePaymentModal';
import PaymentSuccess from '@/components/PaymentSuccess';

interface Campaign {
  id: string; trackTitle: string; coverArt: string; cpmRate: number;
  budget: number; spent: number; views: number; submissions: number; status: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [depositModal, setDepositModal] = useState(false);
  const [depositSecret, setDepositSecret] = useState('');
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositCampaign, setDepositCampaign] = useState<{ id: string; title: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [coverArt, setCoverArt] = useState('');
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState('');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [trackTitle, setTrackTitle] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');  // Display title (can differ from track title)
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
  const [platforms, setPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube', 'facebook']);
  const [shareCampaign, setShareCampaign] = useState<{ id: string; title: string } | null>(null);

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const platformOptions = [
    { id: 'tiktok', label: 'TikTok', color: '#ff0050' },
    { id: 'instagram', label: 'Reels', color: '#E1306C' },
    { id: 'youtube', label: 'Shorts', color: '#FF0000' },
    { id: 'facebook', label: 'Facebook', color: '#1877F2' },
  ];

  const totalViews = campaigns.reduce((s, c) => s + c.views, 0);
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalSubmissions = campaigns.reduce((s, c) => s + c.submissions, 0);
  const activeCount = campaigns.filter(c => c.status === 'active').length;

  const createCampaign = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackTitle, title: campaignTitle || null, trackUrl, coverArtUrl: coverArt, galleryImages: [], cpmRate: parseFloat(cpm), budget: parseInt(budget), maxPayout: parseInt(maxPayout), driveUrl, hashtags: hashtags || undefined, requirements: requirements || undefined, requiredHashtags: requiredHashtags || undefined, requireFtc, minVideoLength: minVideoLength ? parseInt(minVideoLength) : null, captionRequirements: captionReq || undefined, platforms }),
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

  const startEdit = (c: Campaign) => {
    // Pre-fill edit fields from campaign data
    const raw = rawCampaigns.find((r: any) => r.id === c.id);
    if (!raw) return;
    setEditingId(c.id);
    setTrackTitle(raw.track_title || '');
    setCampaignTitle(raw.title || '');
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
    setDriveUrl(raw.content_assets_url || '');
    // YouTube video + gallery images
    setYoutubeVideoUrl(raw.youtube_video_url || '');
    try {
      const gallery = raw.gallery_images
        ? (typeof raw.gallery_images === 'string' ? JSON.parse(raw.gallery_images) : raw.gallery_images)
        : [];
      // Map to GalleryItem format if it's a simple array of URLs (legacy format)
      if (Array.isArray(gallery) && gallery.length > 0) {
        if (typeof gallery[0] === 'string') {
          // Legacy: plain URL array → convert to GalleryItem
          setGalleryItems(gallery.map((url: string, i: number) => ({
            id: crypto.randomUUID(),
            type: url.includes('youtube') ? 'video' as const : 'image' as const,
            url,
          })));
        } else if (gallery[0] && typeof gallery[0] === 'object' && 'type' in gallery[0]) {
          // New format: already GalleryItem[]
          setGalleryItems(gallery);
        }
      } else {
        setGalleryItems([]);
      }
    } catch { setGalleryItems([]); }
    // Parse platforms from JSON array or default to all
    try {
      const existingPlatforms = raw.platforms ? JSON.parse(raw.platforms) : null;
      if (Array.isArray(existingPlatforms)) setPlatforms(existingPlatforms);
    } catch { setPlatforms(['tiktok', 'instagram', 'youtube', 'facebook']); }
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${editingId}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle,
          title: campaignTitle || null,
          trackUrl,
          maxPayout: parseInt(maxPayout),
          requirements, hashtags,
          requiredHashtags, requireFtc,
          minVideoLength: minVideoLength ? parseInt(minVideoLength) : null,
          captionRequirements: captionReq,
          coverArtUrl: coverArt || undefined,
          contentAssetsUrl: driveUrl || null,
          youtubeVideoUrl: youtubeVideoUrl || null,
          galleryImages: galleryItems.length > 0 ? galleryItems : null,
          platforms,
        }),
      });
      if (!res.ok) { const err = await res.json(); addToast(err.error || 'Failed to save', 'error'); setEditSaving(false); return; }
      const updated = await res.json();
      // Optimistic cache update: immediately update the SWR cache with the returned data
      mutate(
        (current: any) => ({
          ...current,
          campaigns: (current?.campaigns || []).map((c: any) =>
            c.id === editingId ? { ...c, ...updated } : c
          ),
        }),
        { revalidate: false }
      );
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
                <p className="text-muted-foreground text-sm">
                  Upload a high-quality cover image. Campaigns with great visuals get 3× more submissions.
                </p>
                <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-3 text-xs text-amber-400/80 flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>A cover image is <strong>required</strong>. We recommend uploading 3-5 images for the best results.</span>
                </div>
                <ImageUpload onImage={setCoverArt} currentImage={coverArt} />
                {!coverArt && (
                  <p className="text-xs text-muted-foreground/60 text-center">Upload a cover image to continue</p>
                )}
                {coverArt && <Button onClick={() => setWizardStep(2)} className="w-full">Continue</Button>}
                <Button variant="ghost" onClick={() => setStep('list')} className="w-full">Cancel</Button>
              </div>
            )}
            {wizardStep === 2 && (
              <div className="max-w-lg mx-auto space-y-4 animate-slide-up">
                <h1 className="section-title">Track details</h1>
                <p className="text-muted-foreground text-sm mb-6">Tell creators what they'll be promoting.</p>
                <Input value={trackTitle} onChange={e => { setTrackTitle(e.target.value); if (!campaignTitle) setCampaignTitle(`Earn by creating content for "${e.target.value}"`); }} placeholder="Track name" />
                <div className="space-y-1">
                  <Input value={campaignTitle} onChange={e => setCampaignTitle(e.target.value)} placeholder="Campaign headline (shown to creators)" />
                  <p className="text-[10px] text-muted-foreground">This is the headline creators see. Make it compelling!</p>
                  {/* Title suggestions */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {trackTitle && [
                      `Earn by creating content for "${trackTitle}"`,
                      `Get paid to promote "${trackTitle}"`,
                      `Make TikToks for "${trackTitle}" — earn per view`,
                      `"${trackTitle}" needs your content — submit & earn`,
                      `Create videos for "${trackTitle}" and get paid`,
                    ].map((suggestion, i) => (
                      <button key={i} type="button" onClick={() => setCampaignTitle(suggestion)}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                          campaignTitle === suggestion
                            ? 'border-primary bg-primary/[0.08] text-primary'
                            : 'border-white/[0.06] text-muted-foreground hover:border-white/[0.12]'
                        }`}
                      >
                        {suggestion.slice(0, 60)}{suggestion.length > 60 ? '…' : ''}
                      </button>
                    ))}
                  </div>
                </div>
                <Input value={trackUrl} onChange={e => setTrackUrl(e.target.value)} placeholder="Spotify or SoundCloud link" />
                <div className="space-y-2">
                  <label className="text-sm font-medium">📦 Creator resource pack (Google Drive)</label>
                  <Input value={driveUrl} onChange={e => setDriveUrl(e.target.value)} placeholder="https://drive.google.com/drive/folders/..." />
                  <div className="rounded-xl bg-amber-500/[0.04] border border-amber-500/10 p-3 text-xs text-muted-foreground space-y-2 leading-relaxed">
                    <p className="font-semibold text-amber-400/80">⚠️ This is essential — don&apos;t skip it.</p>
                    <p>Creators can&apos;t use screen recordings or re-uploaded audio. They need <strong>your actual master audio files</strong> to create valid submissions that count toward views.</p>
                    <p>Include the following in your Google Drive folder:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      <li><strong>Master track</strong> — .wav and .mp3 versions</li>
                      <li><strong>Cover art</strong> — high-resolution album/single artwork</li>
                      <li><strong>Reference videos</strong> — any existing clips creators can use (B-roll, lyrics videos, behind-the-scenes)</li>
                      <li><strong>Brand assets</strong> — logos, press photos, anything that helps creators make quality content</li>
                    </ul>
                    <p className="text-amber-400/60">💡 Campaigns with a resource pack get <strong>3× more submissions</strong> because creators have everything they need to start immediately.</p>
                  </div>
                </div>
                <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="Recommended hashtags (optional)" />
                <Input value={requiredHashtags} onChange={e => setRequiredHashtags(e.target.value)} placeholder="Required hashtags — creators MUST include these" />
                <div className="flex items-center gap-3 py-1">
                  <input type="checkbox" id="ftc" checked={requireFtc} onChange={e => setRequireFtc(e.target.checked)} className="rounded" />
                  <label htmlFor="ftc" className="text-sm text-muted-foreground">Require FTC disclosure hashtag (#ad, #paidpartner)</label>
                </div>
                <Input value={minVideoLength} onChange={e => setMinVideoLength(e.target.value)} type="number" placeholder="Minimum video length (seconds)" />
                <Input value={captionReq} onChange={e => setCaptionReq(e.target.value)} placeholder="Caption requirements (optional)" />
                
                {/* Platform selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Accepted platforms</label>
                  <div className="grid grid-cols-2 gap-2">
                    {platformOptions.map(p => {
                      const active = platforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlatform(p.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-medium transition-all ${
                            active
                              ? 'border-primary/40 bg-primary/[0.06] text-foreground'
                              : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.12]'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            active ? 'border-primary bg-primary' : 'border-white/[0.12]'
                          }`}>
                            {active && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                          </div>
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Content requirements & guidelines</label>
                  <textarea
                    value={requirements}
                    onChange={e => setRequirements(e.target.value)}
                    placeholder={`Tell creators what kind of content you want:\n\n• Dance challenge using the chorus hook\n• Behind-the-scenes studio footage\n• Reaction video to the drop\n• Duet with your vocals\n• 15-30 seconds minimum\n• Show your face or keep it anonymous\n\nBe specific — the clearer your requirements, the better the submissions.`}
                    rows={6}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/30 resize-y"
                  />
                </div>

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
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-2 block">Cover image</label>
                    <ImageUpload onImage={setCoverArt} currentImage={coverArt} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Track title</label>
                    <Input value={trackTitle} onChange={e => setTrackTitle(e.target.value)} className="text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Campaign headline (shown to creators)</label>
                    <Input value={campaignTitle} onChange={e => setCampaignTitle(e.target.value)} className="text-sm" placeholder="E.g. Earn by creating content for this track" />
                    <div className="flex flex-wrap gap-1">
                      {trackTitle && [
                        `Earn by creating content for "${trackTitle}"`,
                        `Get paid to promote "${trackTitle}"`,
                        `Make TikToks for "${trackTitle}" — earn per view`,
                      ].map((s, i) => (
                        <button key={i} type="button" onClick={() => setCampaignTitle(s)}
                          className={`text-[9px] px-2 py-0.5 rounded-full border transition-colors ${
                            campaignTitle === s ? 'border-primary bg-primary/[0.08] text-primary' : 'border-white/[0.06] text-muted-foreground hover:border-white/[0.12]'
                          }`}
                        >{s.slice(0, 50)}{s.length > 50 ? '…' : ''}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Spotify/SoundCloud URL</label>
                    <Input value={trackUrl} onChange={e => setTrackUrl(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">📦 Creator resource pack (Google Drive)</label>
                    <Input value={driveUrl} onChange={e => setDriveUrl(e.target.value)} className="text-sm" placeholder="https://drive.google.com/drive/folders/..." />
                    <p className="text-[10px] text-muted-foreground mt-1">Share a folder with your master track (.wav + .mp3), cover art, and reference videos.</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-2">💡 <strong>CPM rate is locked</strong> once a campaign has submissions. To change your rate, create a new campaign.</p>
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
                    <textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={4} className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/30 resize-y" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">YouTube video URL (demo/intro)</label>
                    <Input value={youtubeVideoUrl} onChange={e => setYoutubeVideoUrl(e.target.value)} className="text-sm" placeholder="https://youtube.com/watch?v=..." />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-2 block">Gallery images & videos (shown as carousel)</label>
                    <GalleryUpload items={galleryItems} onChange={setGalleryItems} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-2 block">Accepted platforms</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {platformOptions.map(p => {
                        const active = platforms.includes(p.id);
                        return (
                          <button key={p.id} type="button" onClick={() => togglePlatform(p.id)}
                            className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs font-medium transition-all ${
                              active ? 'border-primary/40 bg-primary/[0.06]' : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground'
                            }`}>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                              active ? 'border-primary bg-primary' : 'border-white/[0.12]'
                            }`}>
                              {active && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                            </div>
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
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
                    <Card key={c.id} className="animate-slide-up overflow-hidden cursor-pointer hover:border-primary/20 transition-colors" style={{ animationDelay: `${i * 60}ms` }} onClick={() => router.push(`/c/${c.id}`)}>
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
                          <div className="space-y-2 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2">
                              <Input type="number" min="5" value={fundingAmount} onChange={e => setFundingAmount(e.target.value)} className="flex-1" autoFocus />
                              <Button onClick={async (e) => {
                                e.stopPropagation();
                                const amt = parseInt(fundingAmount); if (amt < 5) { addToast('Minimum $5', 'error'); return; }
                                const r = await fetch('/api/stripe', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ amount: amt, campaignId: c.id }) });
                                const d = await r.json();
                                if (d.clientSecret) {
                                  setDepositSecret(d.clientSecret);
                                  setDepositCampaign({ id: c.id, title: c.trackTitle });
                                  setDepositModal(true);
                                  setFundingId(null);
                                } else { addToast(d.error || 'Could not start payment', 'error'); }
                              }}>Fund ${fundingAmount}</Button>
                            </div>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setFundingId(null); }} className="w-full">Cancel</Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); window.location.href = '/review'; }}>Review ({c.submissions})</Button>
                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); startEdit(c); }} title="Edit campaign"><Edit3 size={14} /></Button>
                            <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setFundingId(c.id); setFundingAmount('10'); }}>Add budget</Button>
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

        {/* On-platform deposit modal + celebration */}
        <StripePaymentModal
          open={depositModal}
          onClose={() => setDepositModal(false)}
          onSuccess={() => { setDepositModal(false); setDepositSuccess(true); }}
          clientSecret={depositSecret}
          title={depositCampaign?.title || 'Campaign'}
          subtitle="Add funds to your campaign budget"
          amount={parseInt(fundingAmount)}
          mode="deposit"
        />
        <PaymentSuccess
          open={depositSuccess}
          mode="deposit"
          amount={parseInt(fundingAmount)}
          campaignTitle={depositCampaign?.title}
          campaignId={depositCampaign?.id}
          onClose={() => setDepositSuccess(false)}
        />
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
