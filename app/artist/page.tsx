'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function ArtistSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function search(generate = false) {
    if (query.length < 2) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/artist/search?q=${encodeURIComponent(query)}&generate=${generate}`);
      const data = await res.json();

      if (data.error) { setError(data.error); setResults([]); }
      else {
        setResults(data.artists || []);
        setSource(data.source || '');
        if (data.artists?.length === 0 && !generate && data.source === 'not_found') {
          setError('Artist not found. Try live search?');
        }
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') search(false);
  }

  function handleGenerate() {
    search(true);
  }

  function handleSelect(slug: string) {
    router.push(`/artist/${slug}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Hero */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold">Artist Dashboard</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            See any artist&apos;s complete stats across streaming and social media. Free. Updated daily.
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for any artist..."
            className="w-full px-5 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-lg placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
          />
          <button
            onClick={() => search(false)}
            disabled={loading || query.length < 2}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {/* Error / Not found */}
        {error && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>{error}</p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              🔍 Search Spotify & Deezer to generate card
            </button>
          </div>
        )}

        {/* Generating indicator */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            {source === 'live_generated' ? 'Fetching from Spotify & Deezer...' : 'Searching...'}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-2 text-left">
            <p className="text-xs text-muted-foreground">
              {source === 'database' ? `${results.length} found in our database` :
               source === 'live_generated' ? 'Generated from live data' :
               source === 'live_generated_deezer' ? 'Generated from Deezer' : ''}
            </p>
            {results.map((artist: any) => (
              <button
                key={artist.slug}
                onClick={() => handleSelect(artist.slug)}
                className="w-full flex items-center gap-4 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:border-primary/20 transition-colors text-left"
              >
                {artist.spotify_image_url ? (
                  <img src={artist.spotify_image_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center text-lg">🎵</div>
                )}
                <div>
                  <p className="font-medium">{artist.artist_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {artist.total_followers > 0 ? `${artist.total_followers.toLocaleString()} followers` : ''}
                    {artist.total_platforms ? ` · ${artist.total_platforms} platforms` : ''}
                  </p>
                </div>
                <span className="ml-auto text-xs text-primary/60">View →</span>
              </button>
            ))}
          </div>
        )}

        {/* Footer stats */}
        <div className="pt-8 border-t border-white/[0.04]">
          <p className="text-xs text-muted-foreground">
            2,038 artists tracked · 27 platforms · Updated daily
          </p>
          <p className="text-xs text-muted-foreground/40 mt-1">
            Powered by <a href="/" className="hover:text-primary">Selah.fm</a>
          </p>
        </div>
      </div>
    </div>
  );
}
