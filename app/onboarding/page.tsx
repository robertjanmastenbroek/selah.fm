'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Music4, Clapperboard, ArrowRight, Check, ArrowLeft, Sparkles, Search, Loader2 } from 'lucide-react';

const genreOptions = ['Pop','Hip-Hop','Electronic','Rock','Indie','R&B','Jazz','Classical','Country','Metal'];
const platformOptions = ['TikTok','Instagram Reels','YouTube Shorts','Facebook'];
const cpmTiers = [
  { value: 0.5, label: 'Basic', cpmDisplay: '$0.50', per1M: '$500', desc: 'Good for testing' },
  { value: 2, label: 'Popular', cpmDisplay: '$2', per1M: '$2K', desc: 'Attracts quality creators', recommended: true },
  { value: 5, label: 'Premium', cpmDisplay: '$5', per1M: '$5K', desc: 'Top creators compete for your track' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<'artist'|'creator'|null>(null);
  // Read role from URL param (passed from signup) to skip duplicate step
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'artist' || roleParam === 'creator') {
      setRole(roleParam);
      setStep(1); // Skip role selection step
    }
  }, []);
  const [name, setName] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [cpm, setCpm] = useState(2);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  // Connect Spotify state
  const [connectQuery, setConnectQuery] = useState('');
  const [connectResults, setConnectResults] = useState<any[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [claiming, setClaiming] = useState<string|null>(null);
  const [claimedId, setClaimedId] = useState<string|null>(null);
  // Connect Stripe state
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeDone, setStripeDone] = useState(false);

  // Check if returning from Stripe onboarding
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') === 'success') setStripeDone(true);
  }, []);

  // Persist onboarding state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('selah-onboarding');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.role) setRole(state.role);
        if (state.name) setName(state.name);
        if (state.genres) setGenres(state.genres);
        if (state.platforms) setPlatforms(state.platforms);
        if (state.cpm) setCpm(state.cpm);
        if (typeof state.step === 'number' && state.step > 0) setStep(state.step);
      } catch (e: any) { console.error('Unhandled error in onboarding/page.tsx:', e); }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('selah-onboarding', JSON.stringify({ step, role, name, genres, platforms, cpm }));
  }, [step, role, name, genres, platforms, cpm]);

  // Artist: 3 steps. Creator: 5 steps.
  const artistSteps = 4;
  const creatorSteps = 6;
  const totalSteps = role === 'artist' ? artistSteps : creatorSteps;

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleConnectSearch = async () => {
    const q = connectQuery.trim();
    if (!q || q.length < 2) { setConnectError('Type at least 2 characters'); return; }
    setConnectError(''); setConnecting(true);
    try {
      const res = await fetch(`/api/artists?search=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      setConnectResults(data.artists || []);
      if (!data.artists?.length) setConnectError('No artists found. Try a different search.');
    } catch { setConnectError('Search failed'); }
    setConnecting(false);
  };

  const handleClaim = async (artist: any) => {
    setClaiming(artist.id); setConnectError('');
    try {
      const res = await fetch(`/api/artists/${artist.slug}/claim`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.error) setConnectError(data.error);
      else setClaimedId(artist.id);
    } catch { setConnectError('Failed to claim'); }
    setClaiming(null);
  };

  const skipConnect = () => { setStep(s => Math.min(s + 1, 3)); };

  const handleStripeConnect = async () => {
    setStripeLoading(true);
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else if (data.error) setConnectError(data.error);
    } catch { setConnectError('Failed to connect Stripe'); }
    setStripeLoading(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Update user profile
      const meRes = await fetch('/api/auth/me', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          user_type: role,
          genres: genres.join(', '),
          tiktok_handle: platforms.includes('TikTok') ? '@pending' : null,
          instagram_handle: platforms.includes('Instagram Reels') ? '@pending' : null,
          youtube_handle: platforms.includes('YouTube Shorts') ? '@pending' : null,
          facebook_handle: platforms.includes('Facebook') ? '@pending' : null,
          preferredCpm: cpm * 100,
        }),
      });
      const meData = await meRes.json();

      // If artist: create artist profile + on-page artist record
      if (role === 'artist' && name) {
        await fetch('/api/artist/claim', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artistName: name,
            genres: genres,
            userId: meData?.user?.id,
          }),
        }).catch(e => console.error('Artist claim error:', e));
      }

      // Clear onboarding state on completion
      localStorage.removeItem('selah-onboarding');
      setDone(true);
      setTimeout(() => router.push(role === 'artist' ? '/dashboard' : '/browse'), 2000);
    } catch { setSaving(false); }
  };

  // Confetti
  const particles = done ? Array.from({length:30},(_,i)=>({id:i,x:Math.random()*100,delay:Math.random()*1.5,size:Math.random()*6+4,color:['#4338CA','#8B9FFF','#81C784','#FFD54F'][i%4]})):[];

  if (done) return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.35) 0%, #0F0F23 60%), #0F0F23'}}>
      <div className="absolute inset-0 z-0">
        <img src="/images/success.png" alt="" className="w-full h-full object-cover opacity-10" />
      </div>
      {particles.map(p=><div key={p.id} className="absolute rounded-full" style={{left:`${p.x}%`,top:'50%',width:`${p.size}px`,height:`${p.size}px`,backgroundColor:p.color,animationDelay:`${p.delay}s`,opacity:0,animation:`confettiFall ${1.5+p.delay}s ease-out forwards`}}/>)}
      <motion.div className="text-center space-y-4 z-10" initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{duration:0.5}}>
        <Sparkles size={48} className="mx-auto text-primary" />
        <h2 className="text-2xl font-bold">{role==='artist'?"You're all set!":"You're ready to earn!"}</h2>
        <p className="text-muted-foreground">{role==='artist'?'Head to your dashboard to create your first campaign.':'Browse campaigns and start creating content.'}</p>
      </motion.div>
      <style>{`@keyframes confettiFall{0%{opacity:1;transform:translateY(-50vh) rotate(0deg)}100%{opacity:0;transform:translateY(50vh) rotate(720deg)}}`}</style>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.35) 0%, #0F0F23 60%), #0F0F23'}}>
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-10">
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary rounded-full" initial={{width:0}} animate={{width:`${((step+1)/totalSteps)*100}%`}} transition={{duration:0.4,ease:'easeOut'}}/>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">Step {step+1} of {totalSteps}</p>
        </div>

        {step>0&&<button onClick={prevStep} className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"><ArrowLeft size={14}/> Back</button>}

        <AnimatePresence mode="wait">
          {/* ── STEP 0: Role ─────────────────────────────────── */}
          {step===0&&(
            <motion.div key="s0" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}} className="space-y-6">
              <div><h2 className="text-2xl font-bold mb-2">What brings you here?</h2><p className="text-muted-foreground text-sm">We&apos;ll personalize your experience.</p></div>
              <div className="grid grid-cols-2 gap-3">
                {[{role:'artist'as const,icon:Music4,title:"I'm an artist",desc:'I want to promote my music'},{role:'creator'as const,icon:Clapperboard,title:"I'm a creator",desc:'I want to earn money creating content'}].map(r=>{const I=r.icon;return(
                  <button key={r.role} onClick={()=>{setRole(r.role);nextStep();}} className="p-5 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] hover:border-primary/30 hover:bg-white/[0.05] transition-all text-left space-y-2">
                    <I size={28} strokeWidth={1.5} className="text-primary/60"/>
                    <div className="font-semibold text-sm">{r.title}</div><div className="text-xs text-muted-foreground">{r.desc}</div>
                  </button>
                )})}
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Name ─────────────────────────────────── */}
          {step===1&&(
            <motion.div key="s1" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}} className="space-y-5">
              <h2 className="text-2xl font-bold">{role==='artist'?"What's your artist name?":"What's your creator name?"}</h2>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder={role==='artist'?'e.g. Luna Park':'e.g. MiaCreates'}
                className="w-full rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] px-4 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"
                autoFocus onKeyDown={e=>e.key==='Enter'&&name&&nextStep()}/>
              {name&&<button onClick={nextStep} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">Continue <ArrowRight size={16}/></button>}
            </motion.div>
          )}

          {/* ── ARTIST STEP 2: Genres ────────────────────────── */}
          {step===2&&role==='artist'&&(
            <motion.div key="s2a" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}} className="space-y-5">
              <h2 className="text-2xl font-bold">What genre is your music?</h2>
              <p className="text-muted-foreground text-sm">Pick one or more — helps creators find you.</p>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map(g=>{const sel=genres.includes(g);return(
                  <button key={g} onClick={()=>setGenres(prev=>sel?prev.filter(x=>x!==g):[...prev,g])}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${sel?'bg-primary text-primary-foreground':'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] hover:border-primary/20'}`}>{g}</button>
                )})}
              </div>
              <button onClick={save} disabled={saving||!name} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                {saving?'Setting up...':'Go to dashboard →'}
              </button>
              <p className="text-xs text-muted-foreground text-center">You can create your first campaign from the dashboard.</p>
            </motion.div>
          )}

          {/* ── CREATOR STEP 2: Platforms ────────────────────── */}
          {step===2&&role==='creator'&&(
            <motion.div key="s2c" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}} className="space-y-5">
              <h2 className="text-2xl font-bold">Where do you create content?</h2>
              <p className="text-muted-foreground text-sm">Pick your platforms — helps artists find you on the right channels.</p>
              <div className="space-y-2">
                {platformOptions.map(p=>{const sel=platforms.includes(p);return(
                  <button key={p} onClick={()=>setPlatforms(prev=>sel?prev.filter(x=>x!==p):[...prev,p])}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${sel?'border-primary bg-primary/[0.04]':'border-white/[0.06] bg-white/[0.02] hover:border-primary/20'}`}>
                    <div className="font-medium text-sm flex items-center gap-2">{sel?<Check size={16} className="text-primary"/>:<div className="w-4 h-4"/>}{p}</div>
                  </button>
                )})}
              </div>
              {platforms.length>0&&<button onClick={nextStep} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">Continue <ArrowRight size={16}/></button>}
            </motion.div>
          )}

          {/* ── CREATOR STEP 3: Genres ───────────────────────── */}
          {step===3&&role==='creator'&&(
            <motion.div key="s3c" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}} className="space-y-5">
              <h2 className="text-2xl font-bold">What&apos;s your style?</h2>
              <p className="text-muted-foreground text-sm">Pick your genres — helps match you with the right campaigns.</p>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map(g=>{const sel=genres.includes(g);return(
                  <button key={g} onClick={()=>setGenres(prev=>sel?prev.filter(x=>x!==g):[...prev,g])}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${sel?'bg-primary text-primary-foreground':'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] hover:border-primary/20'}`}>{g}</button>
                )})}
              </div>
              {genres.length>0&&<button onClick={nextStep} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">Continue <ArrowRight size={16}/></button>}
            </motion.div>
          )}

          {/* ── ARTIST STEP 3: Connect Spotify ──────────────── */}
          {step===3&&role==='artist'&&(
            <motion.div key="s3a" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}} className="space-y-5">
              <h2 className="text-2xl font-bold">Connect your artist profile</h2>
              <p className="text-muted-foreground text-sm">Search for your artist profile and claim it to link your music to your account.</p>
              <input
                value={connectQuery} onChange={e=>setConnectQuery(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&handleConnectSearch()}
                placeholder="Search your artist name..."
                className="w-full rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"
              />
              <button onClick={handleConnectSearch} disabled={connecting||!connectQuery.trim()}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                {connecting?<><Loader2 size={16} className="animate-spin"/> Searching...</>:<>Search <Search size={16}/></>}
              </button>
              {connectError&&<p className="text-xs text-red-400">{connectError}</p>}
              {connectResults.length>0&&(
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {connectResults.map((r:any)=>(
                    <button key={r.id} onClick={()=>handleClaim(r)} disabled={claiming===r.id}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        claimedId===r.id?'bg-emerald-500/10 border border-emerald-500/20':'bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 hover:bg-white/[0.05]'
                      }`}>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/[0.04] shrink-0">
                        {r.spotify_image_url?<img src={r.spotify_image_url} alt="" className="w-full h-full object-cover"/>:<Music4 size={18} className="m-auto text-white/20"/>}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-semibold truncate">{r.artist_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{r.genres?.slice(0,2).join(', ')||'Artist'}</p>
                      </div>
                      {claiming===r.id?<Loader2 size={16} className="animate-spin shrink-0"/>:claimedId===r.id?<Check size={16} className="text-emerald-400 shrink-0"/>:<ArrowRight size={16} className="text-muted-foreground/30 shrink-0"/>}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={skipConnect} className="flex-1 py-3 bg-white/[0.04] text-muted-foreground rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-all">Skip</button>
                {claimedId&&<button onClick={nextStep} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">Continue →</button>}
              </div>
            </motion.div>
          )}

          {/* ── CREATOR STEP 4: CPM ──────────────────────────── */}
          {step===4&&role==='creator'&&(
            <motion.div key="s4c" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}} className="space-y-5">
              <h2 className="text-2xl font-bold">Set your rate</h2>
              <p className="text-muted-foreground text-sm">This is your preferred CPM. Artists see this when they browse creators. You can change it anytime.</p>
              <div className="grid grid-cols-3 gap-3">
                {cpmTiers.map(t=>{
                  const selected=cpm===t.value;
                  return(
                    <button key={t.value} onClick={()=>setCpm(t.value)}
                      className={`relative p-4 rounded-xl border-2 text-center transition-all ${selected?'border-primary bg-primary/[0.04]':'border-white/[0.06] bg-white/[0.02] hover:border-primary/30'}`}>
                      {t.recommended&&<span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-[9px] text-primary-foreground font-semibold">Popular</span>}
                      <div className="text-xl font-bold mt-1">{t.cpmDisplay}</div>
                      <div className="text-[10px] text-muted-foreground">CPM</div>
                      <div className="text-[11px] text-muted-foreground/70 mt-1">{t.per1M}/1M</div>
                      <div className="text-[9px] text-muted-foreground/50 mt-1">{t.desc}</div>
                    </button>
                  );
                })}
              </div>
              <div className="rounded-xl bg-gradient-to-br from-indigo-500/[0.04] to-emerald-500/[0.02] border border-indigo-500/10 p-4 text-sm text-muted-foreground">
                At <span className="text-foreground font-semibold">${cpm}</span> CPM, you&apos;d earn <span className="text-foreground font-semibold">${(cpm * 1000).toFixed(0)}</span> per 1M views — nothing deducted.
              </div>
              <button onClick={save} disabled={saving||!name} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                {saving?'Setting up...':"I'm ready to earn →"}
              </button>
              <p className="text-xs text-muted-foreground text-center">You can change this anytime in Settings.</p>
            </motion.div>
          )}

          {/* ── CREATOR STEP 5: Connect Stripe ──────────────── */}
          {step===5&&role==='creator'&&(
            <motion.div key="s5c" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}} className="space-y-5">
              <h2 className="text-2xl font-bold">Set up your payouts</h2>
              <p className="text-muted-foreground text-sm">
                Connect Stripe to receive payments. You&apos;ll be redirected to Stripe to complete the setup.
              </p>

              <div className="rounded-2xl bg-gradient-to-br from-indigo-500/[0.04] to-emerald-500/[0.02] border border-indigo-500/10 p-5 text-center space-y-4">
                {stripeDone ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto"><Check size={24} className="text-emerald-400" /></div>
                    <p className="font-semibold text-sm">Stripe connected!</p>
                    <button onClick={nextStep} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                      Continue →
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/></svg>
                    </div>
                    <p className="font-semibold text-sm mb-1">Get paid for your content</p>
                    <p className="text-xs text-muted-foreground">Stripe handles your payout info securely.</p>
                    <button onClick={handleStripeConnect} disabled={stripeLoading}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                      {stripeLoading ? <><Loader2 size={16} className="animate-spin"/> Opening Stripe...</> : 'Connect Stripe →'}
                    </button>
                    <button onClick={nextStep} className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                      Skip for now
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
