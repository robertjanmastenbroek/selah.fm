'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, Music, User, TrendingUp, X, ArrowRight } from 'lucide-react';

/**
 * Cmd+K / Ctrl+K command palette — searches artists, campaigns, and tracks.
 * Inspired by Notion's quick-switch.
 */
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: string; label: string; href: string; sublabel?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K / Ctrl+K toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Search when query changes
  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResults([]); return; }
    setLoading(true);
    const allResults: typeof results = [];
    try {
      // Artists
      const artistRes = await fetch(`/api/artists?search=${encodeURIComponent(q)}&limit=5`);
      const artistData = await artistRes.json();
      (artistData.artists || []).forEach((a: any) => {
        allResults.push({
          type: 'artist', label: a.artist_name,
          sublabel: a.genres?.slice(0, 2).join(', ') || 'Artist',
          href: `/artist/${a.slug}`,
        });
      });

      // Campaigns
      const campRes = await fetch(`/api/campaigns?search=${encodeURIComponent(q)}&limit=5`);
      const campData = await campRes.json();
      (campData.campaigns || []).forEach((c: any) => {
        allResults.push({
          type: 'campaign', label: c.track_title || c.title || 'Campaign',
          sublabel: c.artist_name || `${((c.cpm_rate_cents || 0) / 100).toFixed(2)} CPM`,
          href: `/c/${c.slug || c.id}`,
        });
      });
    } catch {}
    setResults(allResults);
    setSelectedIdx(0);
    setLoading(false);
  }, []);

  useEffect(() => { search(query); }, [query, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIdx]) {
      window.location.href = results[selectedIdx].href;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh]" role="dialog" aria-modal="true" aria-label="Command search" onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[#1C1C3A] border border-white/[0.08] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search size={16} className="text-muted-foreground/50 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search artists, campaigns..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
          />
          <button onClick={() => setOpen(false)} className="text-muted-foreground/30 hover:text-muted-foreground">
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground/50">
              <div className="w-3 h-3 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              Searching...
            </div>
          ) : results.length === 0 && query.length >= 2 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground/50">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : query.length < 2 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground/40">
              Type at least 2 characters to search
            </div>
          ) : (
            <div className="space-y-0.5">
              {results.map((r, i) => (
                <Link key={`${r.type}-${r.href}`} href={r.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    i === selectedIdx ? 'bg-primary/[0.08] text-foreground' : 'text-muted-foreground hover:bg-white/[0.03]'
                  }`}>
                  {r.type === 'artist' ? <User size={14} className="shrink-0 text-primary/60" /> :
                   r.type === 'campaign' ? <TrendingUp size={14} className="shrink-0 text-emerald-400/60" /> :
                   <Music size={14} className="shrink-0 text-muted-foreground/40" />}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{r.label}</p>
                    {r.sublabel && <p className="text-[10px] text-muted-foreground/50 truncate">{r.sublabel}</p>}
                  </div>
                  <ArrowRight size={12} className="shrink-0 text-muted-foreground/30" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-white/[0.04] text-[10px] text-muted-foreground/30">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span className="ml-auto">Esc Close</span>
        </div>
      </div>
    </div>
  );
}
