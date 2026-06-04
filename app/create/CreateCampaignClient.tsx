'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Music4, DollarSign, FileText, Sparkles, ArrowRight, ArrowLeft, Check, LoaderCircle, Plus, Search, X } from 'lucide-react';

const cpmTiers = [
  { value: 0.5, label: 'Basic', cpmDisplay: '$0.50', per1M: '$500', desc: 'Good for testing' },
  { value: 2, label: 'Popular', cpmDisplay: '$2', per1M: '$2K', desc: 'Attracts quality creators', recommended: true },
  { value: 5, label: 'Premium', cpmDisplay: '$5', per1M: '$5K', desc: 'Top creators compete' },
];

const platformOptions = ['TikTok', 'Instagram Reels', 'YouTube Shorts', 'Facebook'];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [budget, setBudget] = useState(50);
  const [cpm, setCpm] = useState(2);
  const [platforms, setPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube']);
  const [requirements, setRequirements] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (!d.user) { window.location.href = '/login?redirect=/create'; return; }
        // Load user's existing tracks from API
        fetch('/api/artists/me', { credentials: 'include' })
          .then(r => r.json())
          .then(artistData => {
            if (Array.isArray(artistData?.tracks)) setTracks(artistData.tracks);
          })
          .catch(() => {});
      })
      .catch(() => { window.location.href = '/login?redirect=/create'; });
  }, []);

  const totalSteps = 4;
  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleCreate = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track_title: selectedTrack?.title || customTitle,
          track_url: selectedTrack?.spotify_url || customUrl || null,
          cover_art_url: selectedTrack?.cover_art_url || null,
          cpm_rate_cents: Math.round(cpm * 100),
          total_budget_cents: Math.round(budget * 100),
          platforms,
          requirements: requirements || 'Create a short-form video featuring this track. Use the official audio. Tag the artist.',
        }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setSaving(false); return; }
      setSuccess('Track added!');
      setTimeout(() => router.push(`/c/${data.campaign?.slug || data.campaign?.id}`), 1500);
    } catch { setError('Failed to create campaign'); setSaving(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.35) 0%, #0F0F23 60%), #0F0F23'}}>
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" initial={{width:0}} animate={{width:`${((step+1)/totalSteps)*100}%`}} transition={{duration:0.3}} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">Step {step+1} of {totalSteps}</p>
        </div>

        {step > 0 && (
          <button onClick={prevStep} className="mb-4 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft size={14} /> Back
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 0: Pick Track */}
          {step === 0 && (
            <motion.div key="s0" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-5">
              <h2 className="text-2xl font-bold">What track are you promoting?</h2>
              <p className="text-muted-foreground text-sm">Choose from your tracks or add a custom one.</p>

              {/* Existing tracks */}
              {tracks.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tracks.map(t => (
                    <button key={t.id} onClick={() => { setSelectedTrack(t); nextStep(); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedTrack?.id === t.id ? 'border-primary bg-primary/[0.04]' : 'border-white/[0.06] bg-white/[0.02] hover:border-primary/20'}`}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/[0.04] shrink-0">
                        {t.cover_art_url ? <img src={t.cover_art_url} alt="" className="w-full h-full object-cover" /> : <Music4 size={18} className="m-auto text-white/20" />}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold truncate">{t.title || t.track_title}</p>
                        {t.cpm_rate_cents && <p className="text-[10px] text-muted-foreground">${((t.cpm_rate_cents / 100) * 1000).toFixed(0)}/1M · {t.platforms?.join(', ') || 'All platforms'}</p>}
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground/30 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Custom track */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.06]" /></div>
                <div className="relative flex justify-center"><span className="px-3 text-[10px] text-muted-foreground/40 bg-[#0F0F23]">Or add a custom track</span></div>
              </div>
              <div className="space-y-3">
                <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="Track title" className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm focus:border-primary/30 focus:outline-none" />
                <input value={customUrl} onChange={e => setCustomUrl(e.target.value)} placeholder="Spotify / Apple Music URL (optional)" className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm focus:border-primary/30 focus:outline-none" />
                {customTitle && <button onClick={nextStep} className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90">Continue <ArrowRight size={16} className="inline" /></button>}
              </div>
            </motion.div>
          )}

          {/* STEP 1: Budget + CPM */}
          {step === 1 && (
            <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-5">
              <h2 className="text-2xl font-bold">Set your budget & rate</h2>
              <p className="text-muted-foreground text-sm">How much do you want to spend and what CPM attracts the best creators?</p>

              {/* Budget slider */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Budget: <span className="text-primary">${budget}</span></label>
                <input type="range" min={10} max={500} step={10} value={budget} onChange={e => setBudget(parseInt(e.target.value))}
                  className="w-full accent-primary" />
                <div className="flex justify-between text-[10px] text-muted-foreground/40"><span>$10</span><span>$500</span></div>
              </div>

              {/* CPM tiers */}
              <div className="grid grid-cols-3 gap-2">
                {cpmTiers.map(t => (
                  <button key={t.value} onClick={() => setCpm(t.value)}
                    className={`relative p-3 rounded-xl border-2 text-center transition-all ${cpm === t.value ? 'border-primary bg-primary/[0.04]' : 'border-white/[0.06] bg-white/[0.02] hover:border-primary/20'}`}>
                    {t.recommended && <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-[8px] text-white font-semibold whitespace-nowrap">Popular</span>}
                    <div className="text-lg font-bold mt-1">{t.cpmDisplay}</div>
                    <div className="text-[9px] text-muted-foreground">{t.per1M}/1M</div>
                  </button>
                ))}
              </div>

              <div className="rounded-xl bg-gradient-to-br from-indigo-500/[0.04] to-emerald-500/[0.02] border border-indigo-500/10 p-4 text-sm text-muted-foreground">
                {(() => {
                  const views = Math.floor((budget * 100) / (cpm * 100) * 1000);
                  return <>Your ${budget} budget at ${cpm} CPM attracts creators with <span className="text-foreground font-semibold">~{(views / 1000).toFixed(0)}K</span> total views.</>;
                })()}
              </div>

              <button onClick={nextStep} className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90">Continue <ArrowRight size={16} className="inline" /></button>
            </motion.div>
          )}

          {/* STEP 2: Requirements */}
          {step === 2 && (
            <motion.div key="s2" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-5">
              <h2 className="text-2xl font-bold">Track details</h2>
              <p className="text-muted-foreground text-sm">Tell creators what you're looking for.</p>

              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map(p => {
                    const key = p.toLowerCase().replace(/\s+/g, '');
                    const sel = platforms.includes(key);
                    return (
                      <button key={p} onClick={() => setPlatforms(prev => sel ? prev.filter(x => x !== key) : [...prev, key])}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${sel ? 'bg-primary text-white' : 'bg-white/[0.03] border border-white/[0.06] hover:border-primary/20'}`}>
                        {sel && <Check size={12} className="inline mr-1" />}{p}
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea value={requirements} onChange={e => setRequirements(e.target.value)}
                placeholder="Describe what kind of video you want. What style? Any specific elements? (Optional — we'll use a default)"
                className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-sm min-h-[120px] focus:border-primary/30 focus:outline-none resize-none" />

              <button onClick={nextStep} className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:opacity-90">Review campaign <ArrowRight size={16} className="inline" /></button>
            </motion.div>
          )}

          {/* STEP 3: Preview + Launch */}
          {step === 3 && (
            <motion.div key="s3" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="space-y-5">
              <h2 className="text-2xl font-bold">Ready to launch</h2>
              <p className="text-muted-foreground text-sm">Review your campaign before publishing.</p>

              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Music4 size={16} className="text-primary/60" />
                  <div><p className="text-sm font-semibold">{selectedTrack?.title || customTitle}</p><p className="text-[10px] text-muted-foreground">{customUrl ? 'Custom track' : 'Your track'}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign size={16} className="text-emerald-400/60" />
                  <div><p className="text-sm font-semibold">${budget} budget at ${cpm} CPM</p><p className="text-[10px] text-muted-foreground">{Math.floor(budget / (cpm * 0.001))} expected views</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-muted-foreground/40" />
                  <div><p className="text-sm truncate">{requirements || 'Default requirements'}</p><p className="text-[10px] text-muted-foreground">{platforms.join(', ')}</p></div>
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}
              {success && <p className="text-xs text-emerald-400 flex items-center gap-1"><Check size={12} /> {success}</p>}

              <button onClick={handleCreate} disabled={saving}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <><LoaderCircle size={16} className="animate-spin" /> Launching...</> : <><Sparkles size={16} /> Launch campaign</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
