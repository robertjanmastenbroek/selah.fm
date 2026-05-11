'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Megaphone, FileCheck, Banknote, TrendingUp, Bug } from 'lucide-react';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [bugs, setBugs] = useState<number>(0);

  useEffect(() => {
    fetch('/api/admin/overview', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setData(d);
      })
      .catch(e => setError(e.message || 'Failed to load'));

    fetch('/api/bugs', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBugs(d.filter((b: any) => b.status === 'new').length); })
      .catch(() => {});
  }, []);

  if (error) {
    return (
      <Card className="text-center py-16">
        <CardContent>
          <p className="text-4xl mb-4 opacity-20">📊</p>
          <h2 className="text-lg font-medium mb-2">Couldn't load dashboard</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button onClick={() => { setError(''); setData(null); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <div className="py-20 space-y-8">
        <div className="animate-pulse space-y-3">
          <div className="h-8 w-48 bg-white/[0.04] rounded-lg" />
          <div className="h-4 w-64 bg-white/[0.04] rounded-lg" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/[0.03] rounded-xl border border-white/[0.06]" />)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: data.users || 0, icon: Users },
    { label: 'Active Campaigns', value: data.activeCampaigns || 0, icon: Megaphone },
    { label: 'Pending Reviews', value: data.pendingSubmissions || 0, icon: FileCheck },
    { label: 'Paid Payouts', value: data.paidPayouts || 0, icon: Banknote },
  ];

  const totalPaid = (data.totalPaidCents || 0) / 100;
  const platformRev = (data.platformRevenueCents || 0) / 100;
  const campaignCount = data.campaigns || 0;
  const submissionCount = data.submissions || 0;

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-8">
      <div><h1 className="text-2xl font-bold mb-1">Admin Overview</h1><p className="text-muted-foreground text-sm">Platform metrics at a glance.</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s=>{const I=s.icon;return(
          <div key={s.label} className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5">
            <I size={20} className="text-primary/60 mb-3" strokeWidth={1.5}/>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        )})}
        {/* Bugs card */}
        <a href="/admin/bugs" className="block rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5 hover:border-red-500/20 transition-all">
          <Bug size={20} className="text-red-400 mb-3" strokeWidth={1.5}/>
          <div className="text-2xl font-bold">{bugs}</div>
          <div className="text-xs text-muted-foreground mt-1">New Bugs</div>
        </a>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Banknote size={16} className="text-primary/60"/>Revenue</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total paid to creators</span><span className="font-semibold">${totalPaid.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Platform revenue (20%)</span><span className="font-semibold text-primary">${platformRev.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total campaigns</span><span className="font-semibold">{campaignCount}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total submissions</span><span className="font-semibold">{submissionCount}</span></div>
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-primary/60"/>Quick Actions</h3>
          <div className="space-y-2">
            <a href="/admin/users" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">Manage Users →</a>
            <a href="/admin/bugs" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">Review Bugs →</a>
            <a href="/admin/campaigns" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">View Campaigns →</a>
            <a href="/admin/seed" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">Seed Demo Data →</a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
