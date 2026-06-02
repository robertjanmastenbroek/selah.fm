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
  const genres = artist.genres
    ? (Array.isArray(artist.genres) ? artist.genres : [artist.genres])
    : [];
  const genre = genres[0] || '';
  const imageUrl = artist.spotify_image_url || '';
  const slug = artist.slug || '';
  const trackCount = artist.track_count || 0;
  const listeners = artist.monthly_listeners || 0;

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
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-emerald-500/5">
              <span className="text-3xl font-bold text-white/10">
                {artist.artist_name[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <h3 className="text-sm font-semibold truncate" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
            {artist.artist_name}
          </h3>

          {genre && (
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
              {genre}
            </p>
          )}

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
