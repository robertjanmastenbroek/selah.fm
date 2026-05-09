'use client';

import { useState } from 'react';

export default function CampaignSearch({ onFilter }: { onFilter: (filters: any) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [minCpm, setMinCpm] = useState('');

  const apply = () => {
    onFilter({ search, platform, minCpm: minCpm ? parseFloat(minCpm) : undefined });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="btn-ghost text-sm">
        🔍 Search
      </button>
      {open && (
        <div className="absolute top-12 right-0 w-72 bg-bg-secondary border border-border rounded-xl p-4 shadow-xl z-50 space-y-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Track name..." className="input-field" />
          <select value={platform} onChange={e => setPlatform(e.target.value)} className="input-field">
            <option value="">All platforms</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
          <input value={minCpm} onChange={e => setMinCpm(e.target.value)} placeholder="Min CPM ($)" type="number" className="input-field" />
          <div className="flex gap-2">
            <button onClick={apply} className="btn-primary text-sm flex-1">Apply</button>
            <button onClick={() => { setSearch(''); setPlatform(''); setMinCpm(''); onFilter({}); setOpen(false); }} className="btn-ghost text-sm flex-1">Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}
