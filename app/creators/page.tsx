'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import CreatorAvatar from '@/components/CreatorAvatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { TikTok, Instagram, YouTube } from '@/components/SocialIcons';

interface Creator { id: string; display_name: string; bio: string; genres: string; preferred_cpm_cents: number; tiktok_handle: string; instagram_handle: string; youtube_handle: string; profile_image_url: string; acceptance_rate: number; total_earned_cents: number; total_verified_views: number; total_submissions: number; }

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchCreators = (search = '') => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/creators?${params}`).then(r=>r.json()).then(data=>{setCreators(data.creators||[]);setTotal(data.total||0);}).finally(()=>setLoading(false));
  };

  useEffect(()=>{fetchCreators();},[]);
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchCreators(searchText); };

  return (
    <div className="min-h-screen" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A'}}>
      <Header />
      <main className="page-container">
        <div className="mb-8"><h1 className="text-3xl font-bold tracking-tight mb-1">Creators</h1><p className="text-muted-foreground text-sm">{total} creators available</p></div>

        <form onSubmit={handleSearch} className="mb-8">
          <input type="text" value={searchText} onChange={e=>setSearchText(e.target.value)}
            placeholder="Search creators..." className="w-full rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"/>
        </form>

        {loading ? (
          <div className="campaign-grid">{[1,2,3].map(i=><div key={i} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]"><div className="p-5 space-y-3"><Skeleton className="h-10 w-10 rounded-full"/><Skeleton className="h-5 w-1/2"/><Skeleton className="h-4 w-1/3"/><Skeleton className="h-6 w-full"/><Skeleton className="h-8 w-full"/></div></div>)}</div>
        ) : creators.length===0?(
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="text-center py-20">
            <Users size={48} className="mx-auto mb-6 text-muted-foreground/20" strokeWidth={1}/>
            <h2 className="text-xl font-semibold mb-2">No creators yet</h2>
            <p className="text-muted-foreground text-sm">Be the first creator to join.</p>
          </motion.div>
        ):(
          <div className="campaign-grid">
            {creators.map((c,i)=>{const earned=(c.total_earned_cents||0)/100;const views=c.total_verified_views||0;const acceptance=Math.round((c.acceptance_rate||0)*100);return(
              <motion.div key={c.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.05,duration:0.4}} whileHover={{y:-2}} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] flex flex-col">
                <div className="p-5 flex flex-col flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/creators/${c.id}`}><CreatorAvatar src={c.profile_image_url} name={c.display_name||'Creator'} size="md"/></Link>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link href={`/creators/${c.id}`} className="font-semibold hover:text-primary transition-colors block truncate">{c.display_name}</Link>
                        <span className="flex items-center gap-0.5">
                          {c.tiktok_handle && <span className="text-[#ff0050]/60"><TikTok size={12}/></span>}
                          {c.instagram_handle && <span className="text-[#E1306C]/60"><Instagram size={12}/></span>}
                          {c.youtube_handle && <span className="text-[#FF0000]/60"><YouTube size={12}/></span>}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{c.genres||'Various'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center py-2 border-y border-white/[0.06]">
                    <div><div className="font-bold text-sm">${earned.toFixed(0)}</div><div className="text-muted-foreground text-[10px]">earned</div></div>
                    <div><div className="font-bold text-sm">{views>=1000?`${(views/1000).toFixed(1)}K`:views}</div><div className="text-muted-foreground text-[10px]">views</div></div>
                    <div><div className="font-bold text-sm">{acceptance}%</div><div className="text-muted-foreground text-[10px]">accepted</div></div>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-xs text-muted-foreground">{c.total_submissions||0} submissions</span>
                    <Link href={`/creators/${c.id}`}><Button variant="outline" size="sm" className="text-xs">View profile →</Button></Link>
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
