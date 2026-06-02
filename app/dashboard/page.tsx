'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import ActionTracker from '@/components/ActionTracker';
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
import { Plus, Edit3, ExternalLink, Copy, Check } from 'lucide-react';
import ArtistDashboardSection from '@/components/ArtistDashboardSection';


interface Campaign {
  id: string; slug: string; trackTitle: string; coverArt: string; cpmRate: number;
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
    id: c.id, slug: c.slug || c.id, trackTitle: c.track_title,
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
  const [refCopied, setRefCopied] = useState(false);
  const { addToast } = useToast();
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
        body: JSON.stringify({ trackTitle, title: campaignTitle || null, trackUrl, coverArtUrl: coverArt, galleryImages: [], cpmRate: parseFloat(cpm), budget: 0, maxPayout: parseInt(maxPayout), driveUrl, hashtags: hashtags || undefined, requirements: requirements || undefined, requiredHashtags: requiredHashtags || undefined, requireFtc, minVideoLength: minVideoLength ? parseInt(minVideoLength) : null, captionRequirements: captionReq || undefined, platforms }),
      });
      if (!res.ok) { const err = await res.json(); addToast(err.error || 'Failed to create campaign', 'error'); setLoading(false); return; }
      const created = await res.json();
      trackCreateCampaign(trackTitle, 0);
      mutate();
      addToast('Campaign created! Now fund it to start.', 'success');
      // Redirect to checkout for first deposit
      setCoverArt(''); setTrackTitle(''); setCpm('1');
      setWizardStep(1); setStep('list'); setLoading(false);
      router.push(`/checkout?type=deposit&campaignId=${created.id}`);
    } catch { addToast('Network error — try again', 'error'); setLoading(false); }
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

  const getRequirementsTemplate = () => `🎵 Use the official audio — no screen recordings or re-uploads

📱 Video format
• 15–60 seconds recommended
• Vertical (9:16) for TikTok/Reels/Shorts
• Public account — private videos can't be verified

🎬 Content ideas
• Dance or lip-sync to the track
• Behind-the-scenes of you listening
• Reaction video to the best part
• Duet with the original
• Show your creative process

✅ Must include
• The official audio as background
• ${requiredHashtags || '#ad if you\'re being paid'}

❌ Do NOT
• Use screen recordings of the track
• Re-upload without the official audio
• Use copyrighted material you don't own
• Submit private or deleted videos

💡 Tips
• The hook (first 15s) gets the most engagement
• Natural, authentic content outperforms polished ads
• Post during peak hours (7-9 PM your time)
• Tag @selahfm for a repost chance`;

  const [saveSuccess, setSaveSuccess] = useState(false);

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
      // Optimistic cache update
      mutate(
        (current: any) => ({
          ...current,
          campaigns: (current?.campaigns || []).map((c: any) =>
            c.id === editingId ? { ...c, ...updated } : c
          ),
        }),
        { revalidate: false }
      );
      // Show success animation then close
      setEditSaving(false);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingId(null);
      }, 1200);
      addToast('Campaign updated', 'success');
    } catch { addToast('Network error', 'error'); setEditSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="page-container">
        <ActionTracker userType={profile?.type} />
        {step === 'list' && <ArtistDashboardSection />}
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
              {[1, 2].map(s => (
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium">Content requirements & guidelines</label>
                    <button
                      type="button"
                      onClick={() => setRequirements(getRequirementsTemplate())}
                      className="text-[10px] text-primary hover:underline font-medium"
                    >
                      Use template
                    </button>
                  </div>
                  <textarea
                    value={requirements}
                    onChange={e => setRequirements(e.target.value)}
                    placeholder={`Tell creators what kind of content you want. Be specific — clear requirements get better submissions.\n\nExamples:\n• "Dance challenge using the chorus hook"\n• "Behind-the-scenes studio footage"\n• "Reaction video to the drop"\n• "Duet with your vocals"\n• "15-30 seconds minimum"\n\nOr click "Use template" above for a ready-made guide.`}
                    rows={6}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/30 resize-y"
                  />
                </div>

                {/* CPM & max payout */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">CPM ($/1M views)</label>
                    <Input type="number" min="0.1" step="0.1" value={cpm} onChange={e => setCpm(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Max payout per submission ($)</label>
                    <Input type="number" min="1" value={maxPayout} onChange={e => setMaxPayout(e.target.value)} />
                  </div>
                </div>
                <Card className="bg-muted/50"><CardContent className="p-4 text-sm text-muted-foreground space-y-2">
                  <p>Creators earn your full CPM rate. A 20% platform fee is added on top (your cost = CPM × 1.20).</p>
                  <p className="text-xs">After launching, you'll be prompted to make your first deposit to fund the campaign.</p>
                </CardContent></Card>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setWizardStep(1)} className="flex-1">Back</Button>
                  <Button onClick={createCampaign} disabled={loading || !trackTitle} className="flex-1">{loading ? 'Creating...' : 'Launch campaign'}</Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {profile && (
            <Card className="mb-6 border-accent/20 bg-accent/[0.03] animate-fade-in">
              <CardContent className="p-4 text-center space-y-2">
                <p className="text-sm font-medium">🔗 Share Selah.fm, earn 5% bonus</p>
                <p className="text-xs text-muted-foreground">
                  When a referred artist makes their first deposit, you both get 5% of it credited to your campaigns.
                </p>
                <div className="flex items-center gap-2 justify-center">
                  <code className="text-xs bg-muted px-3 py-1.5 rounded-lg font-mono max-w-[240px] truncate">selah.fm/login?ref={profile?.email || 'you@email.com'}</code>
                  <button
                    onClick={() => {
                      const link = `https://selah.fm/login?ref=${encodeURIComponent(profile?.email || '')}`;
                      navigator.clipboard.writeText(link).then(() => {
                        setRefCopied(true);
                        addToast('Referral link copied!', 'success');
                        setTimeout(() => setRefCopied(false), 2000);
                      }).catch(() => addToast('Failed to copy', 'error'));
                    }}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors flex items-center gap-1"
                  >
                    {refCopied ? <Check size={12} /> : <Copy size={12} />}
                    {refCopied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </CardContent>
            </Card>
            )}

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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-muted-foreground">Requirements & guidelines</label>
                      <button
                        type="button"
                        onClick={() => setRequirements(getRequirementsTemplate())}
                        className="text-[10px] text-primary hover:underline font-medium"
                      >
                        Use template
                      </button>
                    </div>
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
                  <Button onClick={handleEditSave} disabled={editSaving || !trackTitle || saveSuccess} className="flex-1 relative overflow-hidden">
                    {editSaving ? (
                      <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</span>
                    ) : saveSuccess ? (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                        <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                        </motion.span>
                        Saved
                      </motion.span>
                    ) : 'Save changes'}
                  </Button>
                </div>
                {/* Floating save confirmation */}
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -10 }}
                      className="absolute bottom-4 right-4 bg-emerald-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg flex items-center gap-2"
                    >
                      <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                      </motion.span>
                      Campaign updated
                    </motion.div>
                  )}
                </AnimatePresence>
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
                    <Card key={c.id} className="animate-slide-up overflow-hidden cursor-pointer hover:border-primary/20 transition-colors" style={{ animationDelay: `${i * 60}ms` }} onClick={() => router.push(`/c/${c.slug || c.id}`)}>
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
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); window.location.href = '/review'; }}>Review ({c.submissions})</Button>
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); startEdit(c); }} title="Edit campaign"><Edit3 size={14} /></Button>
                          <Link href={`/checkout?type=deposit&campaignId=${c.id}&amount=10`} onClick={(e) => e.stopPropagation()}><Button size="sm" className="flex-1 w-full">Add budget</Button></Link>
                        </div>
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
