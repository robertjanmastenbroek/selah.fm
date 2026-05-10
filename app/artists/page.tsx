'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import CreatorAvatar from '@/components/CreatorAvatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, Users } from 'lucide-react';

interface Artist { id: string; display_name: string; bio: string; total_campaigns: number; active_campaigns: number; total_budget_cents: number; total_spent_cents: number; total_submissions: number; total_views: number; }

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchArtists = (search = '') => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/artists?${params}`).then(r=>r.json()).then(data=>{setArtists(data.artists||[]);setTotal(data.total||0);}).finally(()=>setLoading(false));
  };

  useEffect(()=>{fetchArtists();},[]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchArtists(searchText); };

  return (
    <div className="min-h-screen" style={{background:'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A'}}>
      <Header />
      <main className="page-container">
        <div className="mb-8"><h1 className="text-3xl font-bold tracking-tight mb-1">Artists</h1><p className="text-muted-foreground text-sm">{total} artists running campaigns</p></div>

        <form onSubmit={handleSearch} className="mb-8">
          <input type="text" value={searchText} onChange={e=>setSearchText(e.target.value)}
            placeholder="Search artists..." className="w-full rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"/>
        </form>

        {loading ? (
          <div className="campaign-grid">{[1,2,3].map(i=><div key={i} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]"><div className="p-5 space-y-3"><Skeleton className="h-10 w-10 rounded-full"/><Skeleton className="h-5 w-1/2"/><Skeleton className="h-4 w-1/3"/><Skeleton className="h-12 w-full"/></div></div>)}</div>
        ) : artists.length===0?(
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="text-center py-20">
            <Users size={48} className="mx-auto mb-6 text-muted-foreground/20" strokeWidth={1}/>
            <h2 className="text-xl font-semibold mb-2">No artists yet</h2>
            <p className="text-muted-foreground text-sm">Artists appear here when they create their first campaign.</p>
          </motion.div>
        ):(
          <div className="campaign-grid">
            {artists.map((a,i)=>{const spent=(a.total_spent_cents||0)/100;const views=a.total_views||0;return(
              <motion.div key={a.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.05,duration:0.4}} whileHover={{y:-2}} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] flex flex-col">
                <div className="p-5 flex flex-col flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <CreatorAvatar name={a.display_name} size="md"/>
                    <div><h3 className="font-semibold">{a.display_name}</h3><p className="text-xs text-muted-foreground">{a.active_campaigns} active · {a.total_campaigns} total</p></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center py-2 border-y border-white/[0.06]">
                    <div><div className="font-bold text-sm">${spent.toFixed(0)}</div><div className="text-muted-foreground text-[10px]">spent</div></div>
                    <div><div className="font-bold text-sm">{views>=1000?`${(views/1000).toFixed(1)}K`:views}</div><div className="text-muted-foreground text-[10px]">views</div></div>
                    <div><div className="font-bold text-sm">{a.total_submissions}</div><div className="text-muted-foreground text-[10px]">submissions</div></div>
                  </div>
                  <div className="mt-auto"><Link href={`/browse?search=${encodeURIComponent(a.display_name)}`}><Button variant="outline" size="sm" className="w-full text-xs">View campaigns →</Button></Link></div>
                </div>
              </motion.div>
            )})}
          </div>
        )}
      </main>
    </div>
  );
}
