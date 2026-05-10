'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Megaphone, FileCheck, Banknote, TrendingUp } from 'lucide-react';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/overview').then(r=>r.json()).then(setData);
  }, []);

  if (!data) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  if (data.error) return <div className="py-20 text-center text-destructive">Access denied — admin only</div>;

  const stats = [
    { label: 'Total Users', value: data.users, icon: Users },
    { label: 'Active Campaigns', value: data.activeCampaigns, icon: Megaphone },
    { label: 'Pending Reviews', value: data.pendingSubmissions, icon: FileCheck },
    { label: 'Paid Payouts', value: data.paidPayouts, icon: Banknote },
  ];

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
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><Banknote size={16} className="text-primary/60"/>Revenue</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total paid to creators</span><span className="font-semibold">${(data.totalPaidCents/100).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Platform revenue (25%)</span><span className="font-semibold text-primary">${(data.platformRevenueCents/100).toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total campaigns</span><span className="font-semibold">{data.campaigns}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Total submissions</span><span className="font-semibold">{data.submissions}</span></div>
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-primary/60"/>Quick Actions</h3>
          <div className="space-y-2">
            <a href="/admin/users" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">Manage Users →</a>
            <a href="/admin/campaigns" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">View Campaigns →</a>
            <a href="/admin/seed" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">Seed Demo Data →</a>
            <a href="/api/admin/seed" target="_blank" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">Run Seeder (API) →</a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
