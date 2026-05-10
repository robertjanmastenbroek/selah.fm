'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import CreatorAvatar from '@/components/CreatorAvatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TikTok, Instagram, YouTube } from '@/components/SocialIcons';
import { DollarSign, Eye, CheckCircle, ArrowRight, Users, Search } from 'lucide-react';

interface Creator { id: string; display_name: string; bio: string; genres: string; preferred_cpm_cents: number; tiktok_handle: string; instagram_handle: string; youtube_handle: string; profile_image_url: string; acceptance_rate: number; total_earned_cents: number; total_verified_views: number; total_submissions: number; }

export default function CreatorsClient({ initialCreators }: { initialCreators: Creator[] }) {
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchCreators = async (search = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/creators?${params}`);
      const d = await res.json();
      setCreators(d.creators || []);
    } catch { /* keep existing data */ }
    finally { setLoading(false); }
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchCreators(searchText); };

  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';

  return (
    <div className="min-h-screen" style={{background:bg}}>
      <Header />
      <main className="page-container">
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Creators</h1>
          <p className="text-muted-foreground text-sm">{creators.length} creators available</p>
        </motion.div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input type="text" value={searchText} onChange={e=>setSearchText(e.target.value)}
              placeholder="Search creators..." className="w-full rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"/>
          </div>
        </form>

        {loading && creators.length === 0 ? (
          <div className="campaign-grid">{[1,2,3].map(i=><div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden"><div className="h-24 bg-white/[0.02]"/><div className="p-5 space-y-3"><Skeleton className="h-6 w-1/3"/><Skeleton className="h-4 w-2/3"/><Skeleton className="h-12 w-full"/></div></div>)}</div>
        ) : creators.length===0?(
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="text-center py-20">
            <Users size={48} className="mx-auto mb-6 text-muted-foreground/20" strokeWidth={1}/>
            <h2 className="text-xl font-semibold mb-2">No creators yet</h2>
            <p className="text-muted-foreground text-sm">Be the first creator to join.</p>
          </motion.div>
        ):(
          <div className="campaign-grid">
            {creators.map((c,i)=>{const earned=(c.total_earned_cents||0)/100;const views=c.total_verified_views||0;const acceptance=Math.round((c.acceptance_rate||0)*100);return(
              <motion.div key={c.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.06,duration:0.4}} whileHover={{y:-2}} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden flex flex-col">
                <div className="h-28 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent relative flex items-center justify-center">
                  <Link href={`/creators/${c.id}`}><CreatorAvatar src={c.profile_image_url} name={c.display_name||'Creator'} size="xl"/></Link>
                  <div className="absolute top-3 left-3 flex items-center gap-1">
                    {c.tiktok_handle && <span className="w-6 h-6 rounded-full bg-[#ff0050]/10 flex items-center justify-center"><TikTok size={12}/></span>}
                    {c.instagram_handle && <span className="w-6 h-6 rounded-full bg-[#E1306C]/10 flex items-center justify-center"><Instagram size={12}/></span>}
                    {c.youtube_handle && <span className="w-6 h-6 rounded-full bg-[#FF0000]/10 flex items-center justify-center"><YouTube size={12}/></span>}
                  </div>
                  <div className="absolute top-3 right-3"><Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">${(c.preferred_cpm_cents/100).toFixed(0)} CPM</Badge></div>
                </div>
                <div className="p-5 flex flex-col flex-1 space-y-4">
                  <div>
                    <Link href={`/creators/${c.id}`} className="text-lg font-bold hover:text-primary transition-colors">{c.display_name}</Link>
                    <div className="flex gap-1 flex-wrap mt-1">{(c.genres||'Various').split(',').slice(0,3).map((g: string)=><Badge key={g} variant="secondary" className="text-[10px]">{g.trim()}</Badge>)}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.06]">
                    {[
                      {value:`$${earned.toFixed(0)}`,label:'Earned',icon:DollarSign},
                      {value:views>=1000?`${(views/1000).toFixed(1)}K`:views,label:'Views',icon:Eye},
                      {value:`${acceptance}%`,label:'Accepted',icon:CheckCircle},
                    ].map(s=>{const I=s.icon;return(
                      <div key={s.label} className="text-center"><I size={12} className="mx-auto mb-1 text-primary/40"/><div className="text-sm font-bold">{s.value}</div><div className="text-[10px] text-muted-foreground">{s.label}</div></div>
                    )})}
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{c.total_submissions||0} submissions</span>
                    <Link href={`/creators/${c.id}`}>
                      <Button variant="outline" size="sm" className="text-xs group">View profile <ArrowRight size={12} className="ml-1 transition-transform group-hover:translate-x-0.5"/></Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )})}
          </div>
        )}
      </main>
    </div>
  );
}
