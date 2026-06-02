'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Megaphone, FileCheck, Banknote, TrendingUp, Bug, DollarSign, Clock, Wallet, ArrowDownToLine } from 'lucide-react';

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

  const totalDeposited = (data.totalDepositedCents || 0) / 100;
  const budgetRemaining = (data.budgetRemainingCents || 0) / 100;
  const budgetSpent = (data.budgetSpentCents || 0) / 100;
  const paidPayoutsAmount = (data.paidPayoutsCents || 0) / 100;
  const processingPayoutsAmount = (data.processingPayoutsCents || 0) / 100;
  const totalPaidOut = (data.totalPaidOutCents || 0) / 100;
  const platformRev = (data.platformRevenueCents || 0) / 100;

  // Top row: key counts
  const counts = [
    { label: 'Total Users', value: data.users || 0, icon: Users, color: 'text-blue-400' },
    { label: 'Active Campaigns', value: data.activeCampaigns || 0, icon: Megaphone, color: 'text-purple-400' },
    { label: 'Total Submissions', value: data.submissions || 0, icon: FileCheck, color: 'text-amber-400' },
    { label: 'New Bugs', value: bugs, icon: Bug, color: 'text-red-400', href: '/admin/bugs' },
  ];

  // Money row: deposits and payouts
  const moneyStats = [
    { label: 'Total Deposited', value: `$${totalDeposited.toFixed(0)}`, sub: `${data.campaigns || 0} campaigns`, icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/5', border: 'border-emerald-500/10' },
    { label: 'Pending Payouts', value: `$${processingPayoutsAmount.toFixed(2)}`, sub: `${data.processingPayouts || 0} in transit`, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/10' },
    { label: 'Completed Payouts', value: `$${paidPayoutsAmount.toFixed(2)}`, sub: `${data.paidPayouts || 0} paid`, icon: Banknote, color: 'text-blue-400', bg: 'bg-blue-500/5', border: 'border-blue-500/10' },
    { label: 'Platform Revenue', value: `$${platformRev.toFixed(2)}`, sub: '20% on artist CPM', icon: DollarSign, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/10' },
  ];

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Admin Overview</h1>
        <p className="text-muted-foreground text-sm">Platform metrics at a glance.</p>
      </div>

      {/* Count cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {counts.map(s => {
          const I = s.icon;
          const card = (
            <div key={s.label} className={`rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5 ${s.href ? 'hover:border-red-500/20 transition-all cursor-pointer' : ''}`}>
              <I size={20} className={`${s.color} mb-3`} strokeWidth={1.5} />
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          );
          return s.href ? <a key={s.label} href={s.href} className="block">{card}</a> : card;
        })}
      </div>

      {/* Money cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {moneyStats.map(s => {
          const I = s.icon;
          return (
            <div key={s.label} className={`rounded-xl ${s.bg} backdrop-blur-xl border ${s.border} p-5`}>
              <I size={20} className={`${s.color} mb-3`} strokeWidth={1.5} />
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              <div className="text-[10px] text-muted-foreground/50 mt-0.5">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Detail panels */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Money flow */}
        <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-primary/60" />Money Flow
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total deposited by artists</span>
              <span className="font-semibold text-emerald-400">${totalDeposited.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Budget spent (to creators)</span>
              <span className="font-semibold">${budgetSpent.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Budget remaining</span>
              <span className="font-semibold text-muted-foreground">${budgetRemaining.toFixed(2)}</span>
            </div>
            <hr className="border-white/[0.06]" />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Paid to creators (completed)</span>
              <span className="font-semibold">${paidPayoutsAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pending payout (processing)</span>
              <span className="font-semibold text-amber-400">${processingPayoutsAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total paid + processing</span>
              <span className="font-semibold">${totalPaidOut.toFixed(2)}</span>
            </div>
            <hr className="border-white/[0.06]" />
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Platform revenue (20% fee)</span>
              <span className="font-semibold text-primary">${platformRev.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Review pipeline */}
        <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-6">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <FileCheck size={16} className="text-primary/60" />Review Pipeline
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pending review</span>
              <span className={`font-semibold ${data.pendingReviews > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                {data.pendingReviews || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Approved</span>
              <span className="font-semibold text-emerald-400">{data.approvedReviews || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Rejected</span>
              <span className="font-semibold text-red-400">{data.rejectedReviews || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total submissions</span>
              <span className="font-semibold">{data.submissions || 0}</span>
            </div>
            {data.pendingReviews === 0 && (
              <p className="text-[10px] text-muted-foreground/50 mt-2">All submissions have been reviewed. No pending items.</p>
            )}
          </div>

          <div className="mt-6 space-y-2">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-primary/60" />Quick Actions
            </h3>
            <a href="/admin/submissions" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">View Submissions →</a>
            <a href="/admin/payouts" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">Manage Payouts →</a>
            <a href="/admin/campaigns" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">View Campaigns →</a>
            <a href="/admin/users" className="block w-full py-2 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.06] text-sm transition-colors">Manage Users →</a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
