'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

export default function CampaignSearch({ onListFilter }: { onListFilter: (filters: any) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [minCpm, setMinCpm] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search-as-you-type with 300ms debounce (skip initial mount)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onListFilter({ search, platform, minCpm: minCpm ? parseFloat(minCpm) : undefined });
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // Apply platform/minCpm immediately
  const applyListFilters = (p?: string, c?: string) => {
    const plat = p ?? platform;
    const cpm = c ?? minCpm;
    onListFilter({ search, platform: plat, minCpm: cpm ? parseFloat(cpm) : undefined });
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
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tracks or artists..."
            autoFocus
          />
          <select
            value={platform}
            onChange={e => { setPlatform(e.target.value); applyListFilters(e.target.value, minCpm); }}
            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="">All platforms</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
          <Input
            value={minCpm}
            onChange={e => { setMinCpm(e.target.value); applyListFilters(platform, e.target.value); }}
            placeholder="Min CPM ($)"
            type="number"
          />
          <button
            onClick={() => {
              setSearch(''); setPlatform(''); setMinCpm('');
              onListFilter({}); setOpen(false);
            }}
            className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
