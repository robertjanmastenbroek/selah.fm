'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Music4, Clapperboard, ArrowRight, Check, ArrowLeft, Sparkles } from 'lucide-react';

const genreOptions = ['Pop','Hip-Hop','Electronic','Rock','Indie','R&B','Jazz','Classical','Country','Metal'];
const platformOptions = ['TikTok','Instagram Reels','YouTube Shorts','Facebook'];
const cpmPresets = [1, 2, 3, 5];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<'artist'|'creator'|null>(null);
  const [name, setName] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [cpm, setCpm] = useState(2);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  // Artist: 3 steps. Creator: 5 steps.
  const artistSteps = 3;
  const creatorSteps = 5;
  const totalSteps = role === 'artist' ? artistSteps : creatorSteps;

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/auth/me', {
        method: 'PATCH',
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
      setDone(true);
      setTimeout(() => router.push(role === 'artist' ? '/dashboard' : '/browse'), 2000);
    } catch { setSaving(false); }
  };

  // Confetti
  const particles = done ? Array.from({length:30},(_,i)=>({id:i,x:Math.random()*100,delay:Math.random()*1.5,size:Math.random()*6+4,color:['#5B7FFF','#8B9FFF','#81C784','#FFD54F'][i%4]})):[];

  if (done) return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.35) 0%, #0A0A0A 60%), #0A0A0A'}}>
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.35) 0%, #0A0A0A 60%), #0A0A0A'}}>
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

          {/* ── CREATOR STEP 4: CPM ──────────────────────────── */}
          {step===4&&role==='creator'&&(
            <motion.div key="s4c" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}} className="space-y-5">
              <h2 className="text-2xl font-bold">Set your rate</h2>
              <p className="text-muted-foreground text-sm">This is your preferred CPM — what you&apos;d like to earn per 1,000 views. Artists see this when they browse creators.</p>
              <div className="grid grid-cols-4 gap-2">
                {cpmPresets.map(b=>(
                  <button key={b} onClick={()=>setCpm(b)} className={`p-3 rounded-xl border-2 text-center transition-all ${cpm===b?'border-primary bg-primary/[0.04]':'border-white/[0.06] bg-white/[0.02] hover:border-primary/20'}`}>
                    <div className="text-lg font-bold">${b}</div><div className="text-[10px] text-muted-foreground">CPM</div>
                  </button>
                ))}
              </div>
              <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-4 text-sm text-muted-foreground">
                At ${cpm} CPM, you&apos;d earn <span className="text-foreground font-semibold">${(cpm*0.8).toFixed(2)}</span> per 1,000 views after the 20% platform fee.
              </div>
              <button onClick={save} disabled={saving||!name} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                {saving?'Setting up...':"I'm ready to earn →"}
              </button>
              <p className="text-xs text-muted-foreground text-center">You can change this anytime in Settings.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
