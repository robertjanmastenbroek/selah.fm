'use client';

import { useState } from 'react';

export default function CampaignSearch({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('all');
  const [minCpm, setMinCpm] = useState('0');

  return (
    <div className="space-y-3 mb-4">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); onSearch(e.target.value); }}
        placeholder="Search campaigns by track or artist..."
        className="w-full bg-void-card border border-white/10 rounded-xl px-4 py-3 text-ivory text-sm
                   placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all"
      />
      <div className="flex gap-2">
        {['all', 'tiktok', 'instagram', 'youtube'].map((p) => (
          <button key={p} onClick={() => setPlatform(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${platform === p ? 'bg-gold text-void' : 'bg-void-card text-muted hover:text-ivory'}`}>
            {p === 'all' ? 'All' : p}
          </button>
        ))}
        <select value={minCpm} onChange={(e) => setMinCpm(e.target.value)}
          className="bg-void-card border border-white/10 rounded-lg px-3 py-1.5 text-xs text-muted">
          <option value="0">Any CPM</option>
          <option value="2">$2+ CPM</option>
          <option value="3">$3+ CPM</option>
          <option value="5">$5+ CPM</option>
        </select>
      </div>
    </div>
  );
}
