'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg hover:bg-muted transition-colors"
      >
        🔍 Search
      </button>
      {open && (
        <div className="absolute top-12 right-0 w-72 bg-popover border rounded-xl p-4 shadow-xl z-50 space-y-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Track name..." />
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">All platforms</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
          <Input
            value={minCpm}
            onChange={e => setMinCpm(e.target.value)}
            placeholder="Min CPM ($)"
            type="number"
          />
          <div className="flex gap-2">
            <Button onClick={apply} size="sm" className="flex-1">Apply</Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => {
                setSearch(''); setPlatform(''); setMinCpm('');
                onFilter({}); setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
