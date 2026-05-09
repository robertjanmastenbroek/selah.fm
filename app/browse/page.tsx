'use client';

import { useState } from 'react';
import TopNav from '@/components/TopNav';
import CampaignSearch from '@/components/CampaignSearch';

const MOCK = [
  { id: '1', title: 'Midnight Frequencies', artist: 'RJM', cpm: 3, budget: 500, spent: 120, cover: '', subs: 8 },
  { id: '2', title: 'Desert Prayer', artist: 'Luna Sol', cpm: 4, budget: 300, spent: 85, cover: '', subs: 5 },
  { id: '3', title: 'Neon Cathedral', artist: 'SYNTHPRIEST', cpm: 2, budget: 800, spent: 240, cover: '', subs: 14 },
];

export default function BrowsePage() {
  const [campaigns] = useState(MOCK);
  const [filtered, setFiltered] = useState(MOCK);

  const handleSearch = (q: string, platform: string, minCPM: number) => {
    let f = MOCK;
    if (q) f = f.filter(c => c.title.toLowerCase().includes(q.toLowerCase()) || c.artist.toLowerCase().includes(q.toLowerCase()));
    if (minCPM > 0) f = f.filter(c => c.cpm >= minCPM);
    setFiltered(f);
  };

  return (
    <div className="min-h-screen bg-void">
      <TopNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-ivory mb-4">Browse campaigns</h1>
        <CampaignSearch onSearch={handleSearch} />

        <div className="space-y-3 mt-6">
          {filtered.map(c => (
            <div key={c.id} className="card-elevated !p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold text-ivory">{c.title}</div>
                  <div className="text-muted text-xs">{c.artist}</div>
                </div>
                <div className="text-right">
                  <div className="text-gold font-bold text-lg">${c.cpm}</div>
                  <div className="text-muted text-[10px]">per 1K views</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted mb-3">
                <span>{c.subs} submissions</span>
                <span>${c.budget} budget</span>
                <span>{Math.round((c.spent / c.budget) * 100)}% used</span>
              </div>
              <div className="h-1 bg-void rounded-full overflow-hidden mb-3">
                <div className="h-full bg-gold rounded-full" style={{ width: `${(c.spent / c.budget) * 100}%` }} />
              </div>
              <button className="btn-gold w-full !py-2.5 !rounded-xl text-sm">Join campaign →</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
