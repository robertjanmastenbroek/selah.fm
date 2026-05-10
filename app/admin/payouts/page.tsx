'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AdminPayoutsPage() {
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/submissions?campaignId=all').then(r=>r.json()).then(d=>setSubs((d||[]).filter((s:any)=>s.payout_amount_cents>0)));
  }, []);

  const total = subs.reduce((sum:number,s:any)=>sum+(s.payout_amount_cents||0),0)/100;

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold mb-1">Payouts</h1><p className="text-muted-foreground text-sm">{subs.length} payouts · ${total.toFixed(2)} total</p></div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          {label:'Total Paid',value:`$${total.toFixed(0)}`},
          {label:'Paid Out',value:subs.filter((s:any)=>s.payout_status==='paid').length},
          {label:'Processing',value:subs.filter((s:any)=>s.payout_status==='processing').length},
        ].map(s=>(<div key={s.label} className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-4 text-center"><div className="text-xl font-bold text-primary">{s.value}</div><div className="text-[10px] text-muted-foreground mt-1">{s.label}</div></div>))}
      </div>
      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06] text-muted-foreground text-xs">
              <th className="text-left py-3 px-4 font-medium">Track</th><th className="text-left py-3 px-4 font-medium">Creator</th><th className="text-left py-3 px-4 font-medium">Amount</th><th className="text-left py-3 px-4 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {subs.map(s=>(
                <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-3 px-4">{s.track_title||'—'}</td>
                  <td className="py-3 px-4">{s.creator_name||'—'}</td>
                  <td className="py-3 px-4 font-semibold">${((s.payout_amount_cents||0)/100).toFixed(2)}</td>
                  <td className="py-3 px-4"><span className={`text-[10px] px-2 py-0.5 rounded-full ${s.payout_status==='paid'?'bg-success/10 text-success':'bg-muted text-muted-foreground'}`}>{s.payout_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
