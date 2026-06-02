'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface Props {
  artist: {
    id: string;
    artist_name: string;
    genres?: string | string[];
    slug?: string;
    spotify_image_url?: string;
    track_count?: number;
    monthly_listeners?: number;
    total_followers?: number;
  };
}

export default function ArtistCard({ artist }: Props) {
  const genres = (() => {
    const raw = artist.genres;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [raw];
      } catch {
        // PostgreSQL array format: {punk,rock} or just plain text
        if (raw.startsWith('{') && raw.endsWith('}')) {
          return raw.slice(1, -1).split(',').map((g: string) => g.trim()).filter(Boolean);
        }
        return [raw];
      }
    }
    return [String(raw)];
  })();
  const genre = genres[0] || '';
  const rawImage = artist.spotify_image_url || '';
  // Only use real profile images (Spotify/i.scdn.co) — not track covers
  const isRealImage = rawImage && (rawImage.includes('scdn.co/image/ab676161') || rawImage.includes('deezer'));
  const imageUrl = isRealImage ? rawImage : '';
  const slug = artist.slug || '';
  const trackCount = artist.track_count || 0;
  const listeners = artist.monthly_listeners || 0;

  // Generate unique gradient from name
  const nameHash = (() => {
    let h = 0;
    const n = artist.artist_name || '';
    for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
    return Math.abs(h);
  })();
  const hues = [
    [250, 200], [200, 160], [160, 120], [50, 30],
    [340, 320], [220, 180], [30, 10],
  ];
  const [h1, h2] = hues[nameHash % hues.length];
  const s = 30 + (nameHash % 40);
  const l = 25 + (nameHash % 20);
  const gradient = `linear-gradient(135deg, hsl(${h1}, ${s}%, ${l}%), hsl(${h2}, ${s + 20}%, ${l + 10}%))`;
  const initial = (artist.artist_name || '?')[0]?.toUpperCase() || '?';

  return (
    <Link href={`/artist/${slug}`}>
      <motion.div
        whileHover={{ y: -2 }}
        className="h-full rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-primary/15 hover:bg-white/[0.04] transition-all duration-200"
      >
        {/* Image */}
        <div className="aspect-square bg-white/[0.02] relative overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={artist.artist_name} loading="lazy"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
              <span className="text-4xl font-bold text-white/20 select-none">
                {initial}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <h3 className="text-sm font-semibold truncate" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
            {artist.artist_name}
          </h3>

          {/* Genre tag with dynamic color */}
          {genre && (() => {
            const colors: Record<string, string> = {
              electronic: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20 text-blue-300',
              'hip-hop': 'from-amber-500/20 to-orange-500/10 border-amber-500/20 text-amber-300',
              pop: 'from-pink-500/20 to-rose-500/10 border-pink-500/20 text-pink-300',
              rock: 'from-red-500/20 to-orange-500/10 border-red-500/20 text-red-300',
              indie: 'from-violet-500/20 to-purple-500/10 border-violet-500/20 text-violet-300',
              'r&b': 'from-emerald-500/20 to-teal-500/10 border-emerald-500/20 text-emerald-300',
              jazz: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/20 text-yellow-300',
              metal: 'from-gray-500/20 to-zinc-500/10 border-gray-500/20 text-gray-300',
              folk: 'from-stone-500/20 to-amber-500/10 border-stone-500/20 text-stone-300',
              country: 'from-brown-500/20 to-yellow-500/10 border-amber-500/20 text-amber-300',
              ambient: 'from-sky-500/20 to-indigo-500/10 border-sky-500/20 text-sky-300',
              punk: 'from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/20 text-fuchsia-300',
              alternative: 'from-teal-500/20 to-cyan-500/10 border-teal-500/20 text-teal-300',
              experimental: 'from-rose-500/20 to-pink-500/10 border-rose-500/20 text-rose-300',
              latin: 'from-red-500/20 to-yellow-500/10 border-red-500/20 text-red-300',
            };
            const g = genre.toLowerCase();
            const colorClass = Object.entries(colors).find(([k]) => g.includes(k))?.[1] || 'from-primary/20 to-primary/5 border-primary/20 text-primary';
            return (
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${colorClass} border`}>
                {genre}
              </span>
            );
          })()}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {trackCount > 0 && (
                <span>{trackCount} {trackCount === 1 ? 'track' : 'tracks'}</span>
              )}
              {listeners > 0 && (
                <span>· {listeners >= 1000 ? `${(listeners / 1000).toFixed(1)}K` : listeners} ML</span>
              )}
            </div>
            <span className="text-[10px] text-primary/60 font-medium">View →</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
