'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Header from '@/components/TopNav';
import CampaignCover from '@/components/CampaignCover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformBadge, Spotify } from '@/components/SocialIcons';
import { Eye, DollarSign, Users, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CampaignPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns/${params.id}`).then(r=>r.json()).then(d=>{if(d.error){setCampaign(null)}else{setCampaign(d)};setLoading(false);}).catch(()=>setLoading(false));
  }, [params.id]);

  const bg = 'radial-gradient(ellipse at 50% 0%, rgba(30,40,80,0.2) 0%, #0A0A0A 60%), #0A0A0A';

  if (loading) return (<div className="min-h-screen" style={{background:bg}}><Header /><main className="max-w-3xl mx-auto px-4 py-16 space-y-4"><Skeleton className="h-48 md:h-64 rounded-2xl"/><Skeleton className="h-6 w-1/3"/><Skeleton className="h-4 w-2/3"/></main></div>);
  if (!campaign) return (<div className="min-h-screen" style={{background:bg}}><Header /><main className="max-w-3xl mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-bold mb-4">Campaign not found</h1><Link href="/browse"><Button>Browse campaigns</Button></Link></main></div>);

  const budget = campaign.total_budget_cents/100;
  const remaining = campaign.budget_remaining_cents/100;
  const spent = budget - remaining;
  const cpm = campaign.cpm_rate_cents/100;
  const progress = budget>0 ? Math.min((spent/budget)*100,100) : 0;

  return (
    <div className="min-h-screen" style={{background:bg}}>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Cover */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} className="mb-8">
          <CampaignCover src={campaign.cover_art_url} title={campaign.track_title} className="h-48 md:h-64 rounded-2xl"/>
        </motion.div>

        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{campaign.track_title}</h1>
            <a href={campaign.track_url} target="_blank" rel="noopener" className="text-primary hover:underline text-sm inline-flex items-center gap-1">
              <Spotify size={14}/> Listen on Spotify <ArrowRight size={12}/>
            </a>
          </div>
          <Badge variant="outline" className="border-primary/20 text-primary text-xs">{campaign.status==='active'?'Live':campaign.status}</Badge>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[{label:'CPM',value:`$${cpm}`,icon:DollarSign},{label:'Budget',value:`$${budget}`,icon:null},{label:'Submissions',value:campaign.approved_submissions||'0',icon:Users},{label:'Views',value:parseInt(campaign.total_verified_views||'0').toLocaleString(),icon:Eye}].map((s,i)=>
            <div key={i} className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-4 text-center">
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          )}
        </motion.div>

        {/* Budget progress */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="mb-8">
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
            <div className="flex justify-between items-center mb-3"><span className="text-sm text-muted-foreground">Budget spent</span><span className="text-sm font-medium">${spent.toFixed(0)} of ${budget}</span></div>
            <Progress value={progress} className="h-2"/>
          </div>
        </motion.div>

        {/* Platforms + Hashtags */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.25}} className="grid md:grid-cols-2 gap-4 mb-8">
          {campaign.platforms?.length>0&&(
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
              <h3 className="font-semibold text-sm mb-3">Platforms</h3>
              <div className="flex gap-1.5 flex-wrap">{(campaign.platforms||[]).map((p:string)=><PlatformBadge key={p} platform={p}/>)}</div>
            </div>
          )}
          {campaign.recommended_hashtags&&(
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
              <h3 className="font-semibold text-sm mb-3">Hashtags</h3>
              <p className="text-sm text-muted-foreground">{campaign.recommended_hashtags}</p>
            </div>
          )}
        </motion.div>

        {/* Requirements */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="mb-8">
          <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5 space-y-4">
            <h3 className="font-semibold text-sm">Requirements for creators</h3>
            {(campaign as any).min_video_length_seconds>0&&<Badge variant="outline" className="text-[10px]">⏱ Min {(campaign as any).min_video_length_seconds}s</Badge>}
            {(campaign as any).required_hashtags&&<div><p className="text-[10px] text-muted-foreground mb-1">Required hashtags:</p><p className="text-sm font-mono text-primary">{(campaign as any).required_hashtags}</p></div>}
            {(campaign as any).require_ftc&&<Badge className="text-[10px] bg-warning/10 text-warning border-warning/20">FTC disclosure required (#ad, #paidpartner)</Badge>}
            {(campaign as any).caption_requirements&&<div><p className="text-[10px] text-muted-foreground mb-1">Caption:</p><p className="text-sm text-muted-foreground">{(campaign as any).caption_requirements}</p></div>}
            {campaign.requirements&&<div><p className="text-[10px] text-muted-foreground mb-1">Guidelines:</p><p className="text-sm text-muted-foreground whitespace-pre-wrap">{campaign.requirements}</p></div>}
            {!campaign.requirements&&!(campaign as any).required_hashtags&&!(campaign as any).min_video_length_seconds&&<p className="text-sm text-muted-foreground">No specific requirements — be creative!</p>}
          </div>
        </motion.div>

        {/* Content assets */}
        {campaign.content_assets_url&&(
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.35}} className="mb-8">
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
              <h3 className="font-semibold text-sm mb-3">Content assets</h3>
              <a href={campaign.content_assets_url} target="_blank" rel="noopener" className="text-primary hover:underline text-sm">Open Google Drive folder →</a>
            </div>
          </motion.div>
        )}

        {/* Back CTA */}
        <div className="text-center py-8">
          <Link href="/browse"><Button variant="outline" size="lg"><ArrowLeft size={16} className="mr-1"/> Back to browse</Button></Link>
        </div>
      </main>
    </div>
  );
}
