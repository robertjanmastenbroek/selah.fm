'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AdminSeedPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSeed = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/seed', { credentials: 'include' });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-6">
      <div><h1 className="text-2xl font-bold mb-1">Seed Data</h1><p className="text-muted-foreground text-sm">Populate the database with demo users, campaigns, and submissions.</p></div>

      <button onClick={runSeed} disabled={loading} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
        {loading?'Seeding...':'Run Seed'}
      </button>

      {result && (
        <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] p-5 space-y-2">
          <p className="text-sm">Users: <span className="font-semibold">{result.users}</span></p>
          <p className="text-sm">Campaigns: <span className="font-semibold">{result.campaigns}</span></p>
          <p className="text-sm">Submissions: <span className="font-semibold">{result.submissions}</span></p>
          {result.error && <p className="text-sm text-destructive">{result.error}</p>}
        </div>
      )}
    </motion.div>
  );
}
