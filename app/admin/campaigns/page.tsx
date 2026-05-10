'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/campaigns').then(r=>r.json()).then(d=>setCampaigns(d.campaigns||[]));
  }, []);

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-6">
      <div><h1 className="text-2xl font-bold mb-1">Campaigns</h1><p className="text-muted-foreground text-sm">{campaigns.length} campaigns</p></div>
      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06] text-muted-foreground text-xs">
              <th className="text-left py-3 px-4 font-medium">Track</th><th className="text-left py-3 px-4 font-medium">CPM</th><th className="text-left py-3 px-4 font-medium">Budget</th><th className="text-left py-3 px-4 font-medium">Status</th><th className="text-left py-3 px-4 font-medium">Submissions</th>
            </tr></thead>
            <tbody>
              {campaigns.map(c=>(
                <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-3 px-4">{c.track_title}</td>
                  <td className="py-3 px-4">${(c.cpm_rate_cents/100).toFixed(2)}</td>
                  <td className="py-3 px-4">${(c.total_budget_cents/100).toFixed(0)}</td>
                  <td className="py-3 px-4"><span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status==='active'?'bg-success/10 text-success':'bg-muted text-muted-foreground'}`}>{c.status}</span></td>
                  <td className="py-3 px-4">{c.approved_submissions||'0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
