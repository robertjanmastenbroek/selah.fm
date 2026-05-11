'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/Toast';
import CreatorAvatar from '@/components/CreatorAvatar';
import ImageUpload from '@/components/ImageUpload';
import { TikTok, Instagram, YouTube, Spotify } from '@/components/SocialIcons';
import { User, Music4, DollarSign, Save, LogOut, Check, ArrowRight, Camera } from 'lucide-react';

export default function SettingsPage() {
  const { data: profileData, isLoading: profileLoading } = useSWR('/api/auth/me', fetcher, swrConfig);
  const profile = profileData?.user || null;
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [genres, setGenres] = useState('');
  const [cpm, setCpm] = useState('');
  const [tiktok, setTikTok] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYouTube] = useState('');
  const [facebook, setFacebook] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  // Fill form fields when profile loads (via shared SWR cache)
  useEffect(() => {
    if (!profile) return;
    setName(profile.name || '');
    setBio(profile.bio || '');
    setGenres(profile.genres || '');
    setCpm(profile.preferred_cpm_cents ? (profile.preferred_cpm_cents / 100).toFixed(0) : '');
    setTikTok(profile.tiktok_handle || '');
    setInstagram(profile.instagram_handle || '');
    setYouTube(profile.youtube_handle || '');
    setFacebook(profile.facebook_handle || '');
    setProfileImage(profile.profile_image_url || '');
  }, [profile]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, genres, preferredCpm: cpm,
          tiktok_handle: tiktok||null, instagram_handle: instagram||null, youtube_handle: youtube||null, facebook_handle: facebook||null,
          profile_image_url: profileImage||null }),
      });
      if (res.ok) {
        addToast('Profile saved', 'success');
      } else {
        const err = await res.json().catch(()=>({}));
        addToast(err.error||'Could not save','error');
      }
    } catch { addToast('Network error','error'); }
    finally { setSaving(false); }
  };

  const socials = [
    { key: 'tiktok', value: tiktok, set: setTikTok, label: 'TikTok', icon: TikTok, color: 'text-[#ff0050]', bg: 'bg-[#ff0050]/5' },
    { key: 'instagram', value: instagram, set: setInstagram, label: 'Instagram', icon: Instagram, color: 'text-[#E1306C]', bg: 'bg-[#E1306C]/5' },
    { key: 'youtube', value: youtube, set: setYouTube, label: 'YouTube', icon: YouTube, color: 'text-[#FF0000]', bg: 'bg-[#FF0000]/5' },
    { key: 'facebook', value: facebook, set: setFacebook, label: 'Facebook', icon: null, color: 'text-blue-400', bg: 'bg-blue-500/5' },
  ];
  const connectedCount = socials.filter(s=>s.value).length;

  if (profileLoading) return (
    <div className="min-h-screen" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A'}}>
      <Header /><main className="page-container max-w-lg"><Skeleton className="h-10 w-1/3 mb-8"/><Skeleton className="h-48 w-full mb-6 rounded-2xl"/><Skeleton className="h-40 w-full mb-6 rounded-2xl"/><Skeleton className="h-12 w-full rounded-xl"/></main>
    </div>
  );

  return (
    <div className="min-h-screen" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A'}}>
      <Header />
      <main className="page-container max-w-lg">
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
          <h1 className="text-2xl font-bold tracking-tight mb-8">Settings</h1>
        </motion.div>

        <div className="space-y-5">
          {/* ── Profile section ───────────────────────────────── */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.4}}>
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center gap-2 mb-1"><User size={16} strokeWidth={1.5} className="text-primary/60"/><h2 className="font-semibold text-sm">Profile</h2></div>
                <p className="text-xs text-muted-foreground mb-5">Your public identity on Selah.fm.</p>
              </div>
              <div className="p-6 pt-0 space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <CreatorAvatar src={profileImage||null} name={name||'You'} size="xl"/>
                  <div>
                    <p className="font-medium text-sm">{name||'Set your name'}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email||''}</p>
                    <button
                      onClick={() => document.getElementById('profile-pic-upload')?.click()}
                      className="mt-1.5 text-[10px] text-primary hover:underline flex items-center gap-1"
                    >
                      <Camera size={10} /> Change photo
                    </button>
                  </div>
                </div>
                <div className="hidden">
                  <input
                    id="profile-pic-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => setProfileImage(reader.result as string);
                      reader.readAsDataURL(f);
                    }}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Display name</label>
                  <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" className="w-full rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"/>
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Bio</label>
                  <input value={bio} onChange={e=>setBio(e.target.value)} placeholder="Tell others about yourself..." className="w-full rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"/>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block flex items-center gap-1"><Music4 size={10}/>Genres</label>
                    <input value={genres} onChange={e=>setGenres(e.target.value)} placeholder="pop, electronic..." className="w-full rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"/>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-1 block flex items-center gap-1"><DollarSign size={10}/>CPM rate</label>
                    <input type="number" value={cpm} onChange={e=>setCpm(e.target.value)} placeholder="2" className="w-full rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"/>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Social accounts ───────────────────────────────── */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2,duration:0.4}}>
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
              <div className="p-6 pb-0">
                <div className="flex items-center gap-2 mb-1"><Music4 size={16} strokeWidth={1.5} className="text-primary/60"/><h2 className="font-semibold text-sm">Social accounts</h2></div>
                <p className="text-xs text-muted-foreground mb-5">
                  {connectedCount>0?`${connectedCount} connected`:'Connect your accounts to get verified'} — verified profiles get more visibility.
                </p>
              </div>
              <div className="p-6 pt-0 space-y-3">
                {socials.map(s=>{const Icon=s.icon;const connected=!!s.value;return(
                  <div key={s.key} className={`rounded-xl ${s.bg} border ${connected?'border-white/[0.08]':'border-white/[0.04]'} p-4 flex items-center gap-3 transition-all`}>
                    <div className={`w-10 h-10 rounded-xl ${connected?`${s.bg}`:'bg-white/[0.02]'} flex items-center justify-center shrink-0 ${s.color}`}>
                      {Icon?<Icon size={18}/>:<span className="text-xs font-bold" style={{color:'inherit'}}>f</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{s.label}</span>
                        {connected&&<span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/10 text-success font-medium flex items-center gap-0.5"><Check size={10}/>Connected</span>}
                      </div>
                      <input value={s.value} onChange={e=>s.set(e.target.value)} placeholder={`@your${s.label.toLowerCase()}`}
                        className="w-full rounded-lg bg-transparent text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none"/>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </motion.div>

          {/* ── Platform status ────────────────────────────────── */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.25,duration:0.4}}>
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
              <h2 className="font-semibold text-sm mb-4">Connected platforms</h2>
              <div className="space-y-3">
                {[
                  { name:'Google', status:!!profile, color:'text-blue-400', bg:'bg-blue-500/10' },
                  { name:'TikTok', status:!!tiktok, color:'text-[#ff0050]', bg:'bg-[#ff0050]/10', icon:TikTok },
                  { name:'Instagram', status:!!instagram, color:'text-[#E1306C]', bg:'bg-[#E1306C]/10', icon:Instagram },
                  { name:'YouTube', status:!!youtube, color:'text-[#FF0000]', bg:'bg-[#FF0000]/10', icon:YouTube },
                  { name:'Facebook', status:!!facebook, color:'text-blue-400', bg:'bg-blue-500/10' },
                ].map(p=>{const Icon=p.icon;return(
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg ${p.bg} flex items-center justify-center`}>
                        {Icon?<Icon size={14}/>:<span className={`text-xs font-bold ${p.color}`}>G</span>}
                      </div>
                      <span className="text-sm">{p.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.status?'bg-success/10 text-success':'bg-muted text-muted-foreground'}`}>
                      {p.status?'Connected':'—'}
                    </span>
                  </div>
                )})}
              </div>
            </div>
          </motion.div>

          {/* ── Actions ────────────────────────────────────────── */}
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3,duration:0.4}} className="space-y-3">
            <button onClick={save} disabled={saving}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(91,127,255,0.2)] active:scale-[0.98]">
              {saving?'Saving...':<><Save size={16}/>Save changes</>}
            </button>
            <button onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'});router.push('/login');}}
              className="w-full py-2.5 text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-2">
              <LogOut size={14}/>Log out
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
