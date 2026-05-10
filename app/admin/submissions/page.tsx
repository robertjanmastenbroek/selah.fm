'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AdminSubmissionsPage() {
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/submissions?campaignId=all').then(r=>r.json()).then(setSubs);
  }, []);

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-6">
      <div><h1 className="text-2xl font-bold mb-1">Submissions</h1><p className="text-muted-foreground text-sm">{subs.length} submissions</p></div>
      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06] text-muted-foreground text-xs">
              <th className="text-left py-3 px-4 font-medium">Track</th><th className="text-left py-3 px-4 font-medium">Creator</th><th className="text-left py-3 px-4 font-medium">Views</th><th className="text-left py-3 px-4 font-medium">Payout</th><th className="text-left py-3 px-4 font-medium">Status</th>
            </tr></thead>
            <tbody>
              {subs.map(s=>(
                <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-3 px-4">{s.track_title||'—'}</td>
                  <td className="py-3 px-4">{s.creator_name||'—'}</td>
                  <td className="py-3 px-4">{(s.views_verified||0).toLocaleString()}</td>
                  <td className="py-3 px-4">{s.payout_amount_cents?`$${(s.payout_amount_cents/100).toFixed(2)}`:'—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.payout_status==='paid'?'bg-success/10 text-success':s.review_status==='approved'?'bg-primary/10 text-primary':s.review_status==='rejected'?'bg-destructive/10 text-destructive':'bg-muted text-muted-foreground'}`}>
                      {s.payout_status==='paid'?'paid':s.review_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
