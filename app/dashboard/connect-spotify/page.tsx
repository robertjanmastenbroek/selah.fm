'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { Search, Music4, UserCheck, Check, Loader2, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';

interface SearchResult {
  id: string;
  artist_name: string;
  genres: string[];
  slug: string;
  spotify_image_url: string | null;
  monthly_listeners: number | null;
  track_count: number;
}

export default function ConnectArtistPage() {
  const router = useRouter();
  const { data: sessionData, isLoading: authLoading } = useSWR('/api/auth/me', fetcher, swrConfig);
  const session = sessionData?.user || null;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [claimed, setClaimed] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q || q.length < 2) { setError('Type at least 2 characters'); return; }
    setError('');
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/artists?search=${encodeURIComponent(q)}&limit=20&sort=name`);
      const data = await res.json();
      setResults(data.artists || []);
    } catch { setError('Search failed'); }
    finally { setSearching(false); }
  };

  const handleClaim = async (artist: SearchResult) => {
    setClaiming(artist.id);
    setError('');
    try {
      const res = await fetch(`/api/artists/${artist.slug}/claim`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else {
        setClaimed(artist.id);
        setTimeout(() => router.push(`/artist/${artist.slug}`), 1200);
      }
    } catch { setError('Failed to claim. Try again.'); }
    finally { setClaiming(null); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080817]">
        <Loader2 size={24} className="animate-spin text-white/30" />
      </div>
    );
  }
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080817]">
        <p className="text-white/50">Sign in to connect your artist profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080817]">
      <div className="max-w-lg mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Music4 size={24} className="text-primary" />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              Find your artist profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Search for your name in our database. If you're here, you have tracks ready to be promoted.
            </p>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your artist name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSearched(false); }}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="e.g. Merhav Yah, Katie, We All Gonna Explode"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] focus:border-primary/40 rounded-xl px-4 py-4
                           text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors"
                autoFocus
                disabled={searching}
              />
              <button onClick={handleSearch} disabled={searching || query.trim().length < 2}
                className="px-5 py-4 rounded-xl font-bold text-sm transition-all
                           bg-gradient-to-r from-primary to-[#3730A3]
                           disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]">
                {searching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/40">
              Type your full artist name as it appears on streaming platforms.
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-xl bg-red-500/5 border border-red-500/10 p-4 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />{error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {searched && (
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {results.length === 0 ? (
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 text-center space-y-3">
                    <AlertCircle size={24} className="mx-auto text-muted-foreground/30" />
                    <h3 className="font-semibold text-sm">No artists found</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                      {query.length >= 2
                        ? `We don't have an artist called "${query}" in our system yet. Artists are added daily through our discovery pipeline.`
                        : 'Type at least 2 characters to search.'}
                    </p>
                    <div className="pt-2 text-xs text-muted-foreground/60 space-y-1">
                      <p>💡 Make sure you're searching with your exact artist name.</p>
                      <p>🔄 Check back later — new artists are added every day.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground/50">
                      Found {results.length} result{results.length !== 1 ? 's' : ''}
                    </p>
                    {results.map(artist => (
                      <div key={artist.id}
                        className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-colors">
                        <div className="p-4 flex items-center gap-4">
                          {/* Image */}
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-emerald-500/5 overflow-hidden shrink-0">
                            {artist.spotify_image_url ? (
                              <img src={artist.spotify_image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white/10">
                                {artist.artist_name[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold truncate">{artist.artist_name}</h3>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                              {artist.genres?.length > 0 && (
                                <span>{Array.isArray(artist.genres) ? artist.genres.slice(0, 2).join(', ') : artist.genres}</span>
                              )}
                              <span>{artist.track_count} track{artist.track_count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          {/* Action */}
                          {claimed === artist.id ? (
                            <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                              <Check size={14} /> Claimed!
                            </div>
                          ) : (
                            <button onClick={() => handleClaim(artist)}
                              disabled={claiming === artist.id}
                              className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold transition-all disabled:opacity-40 flex items-center gap-1.5">
                              {claiming === artist.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <><UserCheck size={14} /> Claim</>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Help section */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-3">
            <h3 className="text-sm font-semibold">How to find your Spotify artist link</h3>
            <ol className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">1.</span>
                <span>Open <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Spotify<ExternalLink size={10} /></a> and search for your artist name</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">2.</span>
                <span>Tap on your artist profile to open it</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">3.</span>
                <span>Tap the <strong>⋯</strong> menu and select <strong>"Share"</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold shrink-0">4.</span>
                <span>Copy the link — it should look like:<br />
                  <code className="text-[10px] bg-white/[0.04] px-2 py-1 rounded mt-1 block">https://open.spotify.com/artist/...</code>
                </span>
              </li>
            </ol>
            <p className="text-[10px] text-muted-foreground/40 pt-1">
              Once you find yourself in our database, claim your profile and you'll be able to manage your tracks, set CPM rates, and track donations.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
