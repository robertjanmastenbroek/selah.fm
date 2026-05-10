'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import CreatorAvatar from '@/components/CreatorAvatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TikTok, Instagram, YouTube } from '@/components/SocialIcons';
import { Megaphone, Eye, FileText, ArrowRight, Users, Search } from 'lucide-react';

interface Artist { id: string; display_name: string; bio: string; total_campaigns: number; active_campaigns: number; total_budget_cents: number; total_spent_cents: number; total_submissions: number; total_views: number; tiktok_handle: string; instagram_handle: string; youtube_handle: string; spotify_url: string; monthly_listeners: number | null; }

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const fetchArtists = (search = '') => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    fetch(`/api/artists?${params}`).then(r=>r.json()).then(d=>{setArtists(d.artists||[])}).catch(()=>setArtists([])).finally(()=>setLoading(false));
  };
  useEffect(()=>{fetchArtists();},[]);
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchArtists(searchText); };

  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';

  return (
    <div className="min-h-screen" style={{background:bg}}>
      <Header />
      <main className="page-container">
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Artists</h1>
          <p className="text-muted-foreground text-sm">{artists.length} artists running campaigns</p>
        </motion.div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input type="text" value={searchText} onChange={e=>setSearchText(e.target.value)}
              placeholder="Search artists..." className="w-full rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"/>
          </div>
        </form>

        {loading ? (
          <div className="campaign-grid">{[1,2,3].map(i=><div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden"><div className="h-24 bg-white/[0.02]"/><div className="p-5 space-y-3"><Skeleton className="h-6 w-1/3"/><Skeleton className="h-4 w-2/3"/><Skeleton className="h-12 w-full"/></div></div>)}</div>
        ) : artists.length===0?(
          <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="text-center py-20">
            <Users size={48} className="mx-auto mb-6 text-muted-foreground/20" strokeWidth={1}/>
            <h2 className="text-xl font-semibold mb-2">No artists yet</h2>
            <p className="text-muted-foreground text-sm">Artists appear when they create their first campaign.</p>
          </motion.div>
        ):(
          <div className="campaign-grid">
            {artists.map((a,i)=>{const spent=(a.total_spent_cents||0)/100;const views=a.total_views||0;return(
              <motion.div key={a.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.06,duration:0.4}} whileHover={{y:-2}} onClick={() => router.push(`/artists/${a.id}`)} className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden flex flex-col cursor-pointer">
                {/* Gradient header */}
                <div className="h-28 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent relative flex items-center justify-center">
                  <CreatorAvatar name={a.display_name} size="xl"/>
                  <div className="absolute top-3 right-3"><Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{a.active_campaigns} active</Badge></div>
                </div>
                <div className="p-5 flex flex-col flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{a.display_name}</h3>
                    <p className="text-xs text-muted-foreground">{a.total_campaigns} total campaigns</p>
                    {/* Social verification badges */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {a.tiktok_handle && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ff0050]/10 text-[#ff0050] flex items-center gap-1"><TikTok size={10}/>{a.tiktok_handle.replace('@','')}</span>}
                      {a.instagram_handle && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E1306C]/10 text-[#E1306C] flex items-center gap-1"><Instagram size={10}/>{a.instagram_handle.replace('@','')}</span>}
                      {a.youtube_handle && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FF0000]/10 text-[#FF0000] flex items-center gap-1"><YouTube size={10}/>{a.youtube_handle.replace('@','')}</span>}
                      {a.monthly_listeners && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1DB954]/10 text-[#1DB954] flex items-center gap-1">{(a.monthly_listeners/1000).toFixed(0)}K monthly</span>}
                    </div>
                  </div>
                  
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.06]">
                    {[
                      {value:`$${spent.toFixed(0)}`,label:'Spent',icon:Megaphone},
                      {value:views>=1000?`${(views/1000).toFixed(1)}K`:views,label:'Views',icon:Eye},
                      {value:a.total_submissions,label:'Submissions',icon:FileText},
                    ].map(s=>{const I=s.icon;return(
                      <div key={s.label} className="text-center">
                        <I size={12} className="mx-auto mb-1 text-primary/40"/>
                        <div className="text-sm font-bold">{s.value}</div>
                        <div className="text-[10px] text-muted-foreground">{s.label}</div>
                      </div>
                    )})}
                  </div>

                  <div className="mt-auto" onClick={e => e.stopPropagation()}>
                    <Link href={`/browse?search=${encodeURIComponent(a.display_name)}`}>
                      <Button variant="outline" size="sm" className="w-full text-xs group">
                        View campaigns <ArrowRight size={12} className="ml-1 transition-transform group-hover:translate-x-0.5"/>
                      </Button>
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
