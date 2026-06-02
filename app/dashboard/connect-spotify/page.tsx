'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import {
  Music4, Check, Loader2, AlertCircle, Sparkles,
  ExternalLink, DollarSign, UserCheck, Disc3,
} from 'lucide-react';

interface SpotifyPreview {
  artist: { spotifyId: string; name: string; imageUrl: string | null; followers: number; genres: string[] };
  tracks: { id: string; name: string; spotifyUrl: string; coverArtUrl: string | null }[];
  resolvedFrom: string;
  exists: boolean;
  existingProfile: { slug: string; name: string; imageUrl: string; trackCount: number } | null;
}

function formatFollowers(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export default function ConnectSpotifyPage() {
  const router = useRouter();
  const { data: sessionData, isLoading: authLoading } = useSWR('/api/auth/me', fetcher, swrConfig);
  const session = sessionData?.user || null;
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<SpotifyPreview | null>(null);
  const [success, setSuccess] = useState(false);

  const handleLookup = async () => {
    setError('');
    setPreview(null);
    if (!url.trim()) { setError('Paste your Spotify artist URL'); return; }
    if (!url.includes('spotify.com/')) { setError('Not a Spotify URL. Should look like: https://open.spotify.com/artist/...'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/spotify/artist-lookup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setPreview(data); }
    } catch { setError('Network error. Try again.'); }
    finally { setLoading(false); }
  };

  const handleConnect = async () => {
    if (!preview) return;
    setImporting(true);
    setError('');
    try {
      const res = await fetch('/api/spotify/import-artist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setImporting(false); }
      else {
        setSuccess(true);
        setTimeout(() => router.push(`/artist/${data.slug}`), 1500);
      }
    } catch { setError('Failed to connect. Try again.'); setImporting(false); }
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

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080817] gap-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <Check size={32} className="text-emerald-400" />
        </motion.div>
        <h1 className="text-xl font-bold">Profile connected!</h1>
        <p className="text-sm text-white/50">Redirecting to your artist page...</p>
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
              Connect your artist profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Paste your Spotify artist link. We'll fetch your tracks and create your profile automatically.
            </p>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Spotify artist URL</label>
            <div className="relative">
              <input
                type="text"
                value={url}
                onChange={e => { setUrl(e.target.value); setPreview(null); }}
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                placeholder="https://open.spotify.com/artist/..."
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-primary/40 rounded-xl pl-4 pr-4 py-4
                           text-sm text-white placeholder:text-white/20 focus:outline-none transition-colors font-mono"
                autoFocus
                disabled={loading}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/40">
              Your Spotify artist page URL. We only need the main artist link — works with track links too.
            </p>
          </div>

          <button
            onClick={handleLookup}
            disabled={loading || !url.trim()}
            className="w-full py-4 rounded-2xl font-bold text-sm transition-all
                       bg-gradient-to-r from-primary to-[#3730A3]
                       hover:shadow-[0_0_40px_rgba(67,56,202,0.3)]
                       disabled:opacity-40 disabled:cursor-not-allowed
                       active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Looking up...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Disc3 size={16} /> {preview ? 'Refresh from Spotify' : 'Look up my artist'}
              </span>
            )}
          </button>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="rounded-xl bg-red-500/5 border border-red-500/10 p-4 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />{error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview */}
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Artist card preview */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                  <div className="aspect-[3/1] bg-gradient-to-br from-primary/10 to-emerald-500/5 flex items-center justify-center">
                    {preview.artist.imageUrl ? (
                      <img src={preview.artist.imageUrl} alt={preview.artist.name}
                        className="h-full w-auto max-h-32 object-cover rounded-full shadow-lg" />
                    ) : (
                      <Music4 size={48} className="text-white/10" />
                    )}
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h2 className="text-lg font-bold">{preview.artist.name}</h2>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{formatFollowers(preview.artist.followers)} followers</span>
                        {preview.artist.genres.length > 0 && (
                          <>
                            <span>·</span>
                            <span>{preview.artist.genres.slice(0, 3).join(', ')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Track list */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles size={10} /> Top tracks on Spotify
                      </p>
                      {preview.tracks.slice(0, 5).map((t, i) => (
                        <div key={t.id} className="flex items-center gap-3 py-1">
                          {t.coverArtUrl ? (
                            <img src={t.coverArtUrl} alt="" className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-white/[0.04] flex items-center justify-center">
                              <Music4 size={12} className="text-white/20" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs truncate">{t.name}</p>
                          </div>
                          <a href={t.spotifyUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-muted-foreground/40 hover:text-white transition-colors">
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      ))}
                      {preview.tracks.length > 5 && (
                        <p className="text-[10px] text-muted-foreground/40 text-center pt-1">
                          + {preview.tracks.length - 5} more tracks
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Already exists notice */}
                {preview.exists && preview.existingProfile && (
                  <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-4 text-xs space-y-2">
                    <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <AlertCircle size={14} /> This artist is already in our system
                    </p>
                    <p className="text-muted-foreground">
                      {preview.existingProfile.name} already has {preview.existingProfile.trackCount} tracks on Selah.fm.
                      Connecting will merge new tracks from Spotify.
                    </p>
                  </div>
                )}

                {/* Connect button */}
                {!preview.exists && (
                  <button
                    onClick={handleConnect}
                    disabled={importing}
                    className="w-full py-4 rounded-2xl font-bold text-sm transition-all
                               bg-gradient-to-r from-emerald-500 to-emerald-600
                               hover:shadow-[0_0_40px_rgba(34,197,94,0.3)]
                               disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {importing ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> Connecting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <UserCheck size={16} /> Connect my artist profile
                      </span>
                    )}
                  </button>
                )}

                {/* Already exists → go to profile */}
                {preview.exists && preview.existingProfile && (
                  <button
                    onClick={() => router.push('/artist/' + preview.existingProfile?.slug)}
                    className="w-full py-4 rounded-2xl font-bold text-sm transition-all
                               bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08]
                               active:scale-[0.98]"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <UserCheck size={16} /> View your profile
                    </span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust */}
          <div className="text-center text-[10px] text-muted-foreground/30 space-y-1 pt-4">
            <p>We use the Spotify Web API to fetch your public artist data.</p>
            <p>We never store your Spotify credentials — read-only access.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
