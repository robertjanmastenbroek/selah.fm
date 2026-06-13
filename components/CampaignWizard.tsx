'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ImageUpload from '@/components/ImageUpload';
import GalleryUpload, { type GalleryItem } from '@/components/GalleryUpload';
import { useToast } from '@/components/Toast';
import { trackCreateCampaign } from '@/lib/analytics';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CampaignWizard({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  // Step 1 fields
  const [coverArt, setCoverArt] = useState('');

  // Step 2 fields
  const [trackTitle, setTrackTitle] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [trackUrl, setTrackUrl] = useState('');
  const [cpm, setCpm] = useState('1');
  const [maxPayout, setMaxPayout] = useState('10');
  const [driveUrl, setDriveUrl] = useState('');
  const [hashtags, setHashtags] = useState('#selahfm');
  const [requiredHashtags, setRequiredHashtags] = useState('');
  const [requireFtc, setRequireFtc] = useState(false);
  const [minVideoLength, setMinVideoLength] = useState('');
  const [captionReq, setCaptionReq] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['tiktok']);
  const [requirements, setRequirements] = useState('');

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  // TikTok only — platform selector removed

  const reset = () => {
    setStep(1);
    setCoverArt('');
    setTrackTitle('');
    setCampaignTitle('');
    setTrackUrl('');
    setCpm('1');
    setMaxPayout('10');
    setDriveUrl('');
    setHashtags('#selahfm');
    setRequiredHashtags('');
    setRequireFtc(false);
    setMinVideoLength('');
    setCaptionReq('');
    setPlatforms(['tiktok', 'instagram', 'youtube']);
    setRequirements('');
  };

  const getRequirementsTemplate = () => `📌 LICENSE REQUIREMENTS (all submissions must follow):
1. The song must be clearly audible as the primary audio in your video.
   If you sing, rap, or talk over the track, your submission won't qualify
   unless it's a remix or cover of the song itself.
2. Tag @theartist + #selahfm in your video description.

🎵 Use the official audio — no screen recordings or re-uploads

💰 Max payout per video: $500.00

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

  const createCampaign = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle,
          title: campaignTitle || null,
          trackUrl,
          coverArtUrl: coverArt,
          galleryImages: [],
          cpmRate: parseFloat(cpm),
          budget: 50,
          maxPayout: parseInt(maxPayout),
          driveUrl,
          hashtags: hashtags || undefined,
          requirements: requirements || undefined,
          requiredHashtags: requiredHashtags || undefined,
          requireFtc,
          minVideoLength: minVideoLength ? parseInt(minVideoLength) : null,
          captionRequirements: captionReq || undefined,
          platforms,
        }),
      });
      if (!res.ok) { const err = await res.json(); addToast(err.error || 'Failed to create campaign', 'error'); setLoading(false); return; }
      const created = await res.json();
      trackCreateCampaign(trackTitle, 0);
      addToast('Campaign created! Now fund it to start.', 'success');
      reset();
      onClose();
      onCreated();
      // Redirect to checkout
      window.location.href = `/checkout?type=deposit&campaignId=${created.id}`;
    } catch { addToast('Network error — try again', 'error'); setLoading(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={() => { reset(); onClose(); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg">New campaign</h2>
              <button onClick={() => { reset(); onClose(); }} className="p-1 rounded-lg hover:bg-white/[0.06]">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            {/* Progress */}
            <div className="flex gap-2 mb-6">
              {[1, 2].map(s => (
                <div key={s} className={`flex-1 h-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-white/[0.06]'}`} />
              ))}
            </div>

            {/* Step 1: Cover */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold mb-1">Campaign cover</h3>
                  <p className="text-sm text-muted-foreground">Upload a high-quality cover image. Campaigns with great visuals get 3× more submissions.</p>
                </div>
                <ImageUpload onImage={setCoverArt} currentImage={coverArt} />
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => { reset(); onClose(); }} className="flex-1">Cancel</Button>
                  <Button onClick={() => setStep(2)} disabled={!coverArt} className="flex-1">Continue</Button>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Track details</h3>
                <Input value={trackTitle} onChange={e => { setTrackTitle(e.target.value); if (!campaignTitle) setCampaignTitle(`Earn by creating content for "${e.target.value}"`); }} placeholder="Track name" />
                <Input value={campaignTitle} onChange={e => setCampaignTitle(e.target.value)} placeholder="Campaign headline (shown to creators)" />
                <Input value={trackUrl} onChange={e => setTrackUrl(e.target.value)} placeholder="Spotify or SoundCloud link" />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">CPM ($ per 1M views)</label>
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      {[{v:"0.5",l:"$0.50"},{v:"1",l:"$1",rec:true},{v:"5",l:"$5"}].map(t => (
                        <button key={t.v} type="button" onClick={() => setCpm(t.v)}
                          className={`relative rounded-lg py-2 text-center transition-all border text-xs ${
                            cpm === t.v ? 'border-primary bg-primary/[0.08] text-primary' : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground'
                          }`}>
                          {t.rec && <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[8px] font-bold text-emerald-400">Best</span>}
                          {t.l}
                        </button>
                      ))}
                    </div>
                    <Input type="number" min="0.1" step="0.1" value={cpm} onChange={e => setCpm(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Max payout ($)</label>
                    <Input type="number" min="1" value={maxPayout} onChange={e => setMaxPayout(e.target.value)} />
                  </div>
                </div>

                {/* TikTok only — platform selector removed */}
                <input type="hidden" name="platforms" value="tiktok" />

                <Input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="Recommended hashtags (optional)" />
                <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <span className="text-sm font-semibold whitespace-nowrap" style={{ color: '#D6A85F' }}>#selahfm</span>
                  <span className="text-[10px]" style={{ color: '#6B6760' }}>+</span>
                  <input value={requiredHashtags.replace('#selahfm', '').trim()} onChange={e => setRequiredHashtags('#selahfm ' + e.target.value)}
                    placeholder="@artist additional tags"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" id="wiz-ftc" checked={requireFtc} onChange={e => setRequireFtc(e.target.checked)} className="rounded" />
                  <label htmlFor="wiz-ftc" className="text-xs text-muted-foreground">Require FTC (#ad)</label>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">Requirements & guidelines</label>
                    <button type="button" onClick={() => setRequirements(getRequirementsTemplate())} className="text-[10px] text-primary hover:underline">Use template</button>
                  </div>
                  <textarea value={requirements} onChange={e => setRequirements(e.target.value)} rows={4}
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/30 resize-y" />
                </div>

                <Card className="bg-white/[0.02]"><CardContent className="p-4 text-sm text-muted-foreground">
                  Creators earn your full CPM rate. A 20% platform premium is added on deposits.
                </CardContent></Card>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                  <Button onClick={createCampaign} disabled={loading || !trackTitle} className="flex-1">
                    {loading ? 'Creating...' : 'Launch campaign'}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
