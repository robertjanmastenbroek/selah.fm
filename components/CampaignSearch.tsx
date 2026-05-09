'use client';

import { useState } from 'react';

const PLATFORMS = ['all', 'tiktok', 'instagram', 'youtube'];

interface CampaignSearchProps {
  onSearch: (query: string, platform: string, minCPM: number) => void;
}

export default function CampaignSearch({ onSearch }: CampaignSearchProps) {
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('all');
  const [minCPM, setMinCPM] = useState(0);

  const handleChange = () => {
    onSearch(query, platform, minCPM);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); handleChange(); }}
          placeholder="Search campaigns or genres..."
          className="flex-1 bg-bg-card border border-white/10 rounded-xl px-4 py-3 text-text text-sm
                     placeholder:text-muted focus:outline-none focus:border-gold/50 transition-all" />
      </div>
      <div className="flex gap-2">
        {PLATFORMS.map((p) => (
          <button key={p} onClick={() => { setPlatform(p); handleChange(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${platform === p ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-bg-card text-muted border border-white/5 hover:border-white/10'}`}>
            {p === 'all' ? 'All' : p}
          </button>
        ))}
        <select value={minCPM} onChange={(e) => { setMinCPM(Number(e.target.value)); handleChange(); }}
          className="bg-bg-card border border-white/5 rounded-lg px-2 py-1.5 text-xs text-muted focus:outline-none focus:border-gold/30">
          <option value="0">Min CPM</option>
          <option value="1">$1+</option>
          <option value="2">$2+</option>
          <option value="3">$3+</option>
        </select>
      </div>
    </div>
  );
}
