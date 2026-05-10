'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import CreatorAvatar from '@/components/CreatorAvatar';
import CreatorSubmissions from '@/components/CreatorSubmissions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TikTok, Instagram, YouTube } from '@/components/SocialIcons';
import { DollarSign, Eye, CheckCircle, Music4, ArrowLeft } from 'lucide-react';

interface Creator {
  id: string; display_name: string; bio: string; genres: string;
  preferred_cpm_cents: number; tiktok_handle: string; instagram_handle: string;
  youtube_handle: string; profile_image_url: string;
  acceptance_rate: number; total_earned_cents: number;
  total_verified_views: number; total_submissions: number;
}

function HireButton({ creatorId, creatorName, cpm }: { creatorId: string; creatorName: string; cpm: number }) {
  const [profile, setProfileState] = useState<any>(null);
  const router = useRouter();
  useEffect(() => { fetch('/api/auth/me').then(r => r.json()).then(d => setProfileState(d.user)); }, []);

  if (!profile) return (
    <div className="text-center space-y-3"><h3 className="font-semibold">Want this creator to promote your music?</h3><p className="text-sm text-muted-foreground">Sign in as an artist to hire them for your campaign.</p><Button className="w-full" onClick={() => router.push(`/login?redirect=/creators/${creatorId}`)}>Sign in to hire</Button></div>
  );
  if (profile.type === 'creator') return (
    <div className="text-center space-y-3"><h3 className="font-semibold">👋 Hey creator!</h3><p className="text-sm text-muted-foreground">Hire is for artists. Want to browse campaigns instead?</p><Button variant="secondary" className="w-full" onClick={() => router.push('/browse')}>Browse campaigns</Button></div>
  );
  return (
    <div className="text-center space-y-3">
      <h3 className="font-semibold">Want this creator to promote your music?</h3>
      <p className="text-sm text-muted-foreground">Hire them at their CPM rate or create a custom campaign.</p>
      <Button className="w-full" onClick={() => router.push(`/dashboard?hire=${creatorId}&cpm=${cpm}&name=${encodeURIComponent(creatorName)}`)}>
        Hire @{creatorName} — ${(cpm/100).toFixed(2)} CPM
      </Button>
    </div>
  );
}

export default function CreatorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/creators/${id}`).then(r=>r.json()).then(d=>{if(d.error){setCreator(null)}else{setCreator(d)};setLoading(false);}).catch(()=>setLoading(false));
  }, [id]);

  if (loading) return (<div className="min-h-screen" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A'}}><Header /><main className="page-container max-w-2xl"><Skeleton className="h-48 w-full rounded-2xl mb-4"/><Skeleton className="h-8 w-1/3 mb-2"/><Skeleton className="h-4 w-2/3"/></main><BottomNav/></div>);
  if (!creator) return (<div className="min-h-screen" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A'}}><Header /><main className="page-container max-w-2xl text-center py-20"><h2 className="text-xl font-bold mb-2">Creator not found</h2></main><BottomNav/></div>);

  const earned = (creator.total_earned_cents||0)/100;
  const views = creator.total_verified_views||0;
  const acceptance = Math.round((creator.acceptance_rate||0)*100);

  return (
    <div className="min-h-screen pb-20" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A'}}>
      <Header />
      <main className="page-container max-w-2xl">
        {/* Profile header */}
        <motion.div className="mb-8" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent"/>
            <div className="p-6 -mt-12 relative">
              <CreatorAvatar src={creator.profile_image_url} name={creator.display_name||'Creator'} size="xl"/>
              <div className="mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{creator.display_name}</h1>
                  <span className="flex items-center gap-1">
                    {creator.tiktok_handle && <span className="text-[#ff0050]/70"><TikTok size={14}/></span>}
                    {creator.instagram_handle && <span className="text-[#E1306C]/70"><Instagram size={14}/></span>}
                    {creator.youtube_handle && <span className="text-[#FF0000]/70"><YouTube size={14}/></span>}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {creator.tiktok_handle && <Badge variant="outline" className="text-[10px]">{creator.tiktok_handle.startsWith('@')?creator.tiktok_handle:'@'+creator.tiktok_handle}</Badge>}
                  {creator.instagram_handle && <Badge variant="outline" className="text-[10px]">{creator.instagram_handle.startsWith('@')?creator.instagram_handle:'@'+creator.instagram_handle}</Badge>}
                  {creator.youtube_handle && <Badge variant="outline" className="text-[10px]">{creator.youtube_handle.startsWith('@')?creator.youtube_handle:'@'+creator.youtube_handle}</Badge>}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-3 gap-3 mb-8" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1,duration:0.4}}>
          {[{value:`$${earned.toFixed(0)}`,label:'Earned',icon:DollarSign},{value:views>=1000?`${(views/1000).toFixed(1)}K`:views,label:'Views',icon:Eye},{value:`${acceptance}%`,label:'Accepted',icon:CheckCircle}].map((s,i)=>{const I=s.icon;return(
            <div key={i} className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-4 text-center">
              <I size={18} className="mx-auto mb-2 text-primary/60" strokeWidth={1.5}/>
              <div className="text-xl font-bold text-primary">{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          )})}
        </motion.div>

        {/* Bio */}
        {creator.bio && (
          <motion.div className="mb-8" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.15}}>
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Music4 size={16} strokeWidth={1.5} className="text-primary/60"/>About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{creator.bio}</p>
            </div>
          </motion.div>
        )}

        {/* Genres & CPM */}
        <motion.div className="grid grid-cols-2 gap-4 mb-8" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
            <h3 className="text-sm font-semibold mb-3">Genres</h3>
            <div className="flex gap-1 flex-wrap">{(creator.genres||'').split(',').slice(0,4).map(g=><Badge key={g} variant="secondary" className="text-[10px]">{g.trim()}</Badge>)}</div>
          </div>
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
            <h3 className="text-sm font-semibold mb-3">CPM Rate</h3>
            <div className="text-2xl font-bold text-primary">${(creator.preferred_cpm_cents/100).toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground mt-1">per 1,000 views</div>
          </div>
        </motion.div>

        {/* Submissions */}
        <motion.div className="mb-8" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.25}}>
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
            <h3 className="font-semibold mb-4">Recent submissions</h3>
            <CreatorSubmissions creatorId={id as string}/>
          </div>
        </motion.div>

        {/* Hire CTA */}
        <motion.div className="mb-6" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-primary/10 p-6">
            <HireButton creatorId={creator.id} creatorName={creator.display_name} cpm={creator.preferred_cpm_cents}/>
          </div>
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
