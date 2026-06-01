'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Artist {
  display_name: string;
  latest_track_name: string;
  slug: string;
  spotify_image_url: string;
  total_followers: number;
  total_platforms: number;
}

function ArtistPlaceholder({ name }: { name: string }) {
  const colors = ['from-primary/30 to-purple-500/20', 'from-amber-500/20 to-red-500/20', 'from-green-500/20 to-teal-500/20', 'from-pink-500/20 to-rose-500/20', 'from-blue-500/20 to-cyan-500/20'];
  const color = colors[name.length % colors.length];
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center`}>
      <span className="text-2xl font-bold text-white/40">{initials}</span>
    </div>
  );
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const fetchArtists = useCallback(async (search = '', newOffset = 0, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '60', offset: String(newOffset) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/artists?${params}`);
      const d = await res.json();
      if (append) {
        setArtists(prev => [...prev, ...(d.artists || [])]);
      } else {
        setArtists(d.artists || []);
      }
      setTotal(d.total || 0);
      setOffset(newOffset + (d.artists?.length || 0));
      setHasMore((d.artists?.length || 0) >= 60);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchArtists(); }, [fetchArtists]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchArtists(searchText, 0);
  }

  function handleLoadMore() {
    fetchArtists(searchText, offset, true);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/[0.04]">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="max-w-6xl mx-auto px-6 py-16 relative">
          <h1 className="text-4xl font-bold tracking-tight mb-3">Artists</h1>
          <p className="text-muted-foreground text-lg mb-8">
            {total.toLocaleString()} artists tracked across 27 platforms. Discover their complete stats.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Search by artist name..."
                className="w-full px-5 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-base placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 focus:bg-white/[0.05] transition-all"
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading && artists.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-2xl bg-white/[0.03] mb-3" />
                <div className="h-4 bg-white/[0.03] rounded w-2/3 mx-auto mb-2" />
                <div className="h-3 bg-white/[0.03] rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg mb-2">No artists found for &quot;{searchText}&quot;</p>
            <p className="text-muted-foreground/60 text-sm">Try a different search term</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {artists.map(artist => (
                <button
                  key={artist.slug}
                  onClick={() => router.push(`/artist/${artist.slug}`)}
                  className="group text-left"
                >
                  {/* Photo */}
                  <div className="relative overflow-hidden rounded-2xl mb-3">
                    {artist.spotify_image_url ? (
                      <img
                        src={artist.spotify_image_url}
                        alt={artist.display_name}
                        className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <ArtistPlaceholder name={artist.display_name} />
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-2xl flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium">View →</span>
                    </div>
                  </div>

                  {/* Info */}
                  <p className="text-sm font-medium truncate">{artist.display_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {artist.total_followers > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        {artist.total_followers >= 1000
                          ? `${(artist.total_followers / 1000).toFixed(1)}K`
                          : artist.total_followers.toLocaleString()}
                      </span>
                    )}
                    {artist.total_platforms > 0 && (
                      <span className="text-[11px] text-muted-foreground/60">{artist.total_platforms} platforms</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-12">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl text-sm font-medium hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                >
                  {loading ? 'Loading...' : `Load More (${total - artists.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
