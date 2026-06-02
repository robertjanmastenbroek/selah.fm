'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music4, ArrowRight, Loader2 } from 'lucide-react';

interface Props {
  displayName: string | null;
}

export default function SpotifyConnectPrompt({ displayName }: Props) {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (!displayName) { setHasProfile(false); return; }
    // Check if this user already has an artist profile
    fetch(`/api/artist/search?q=${encodeURIComponent(displayName)}&limit=1`)
      .then(r => r.json())
      .then(d => {
        const exists = d.artists?.length > 0;
        setHasProfile(exists);
      })
      .catch(() => setHasProfile(null));
  }, [displayName]);

  // Don't show if we don't know yet or if they already have a profile
  if (hasProfile === null || hasProfile === true) return null;

  return (
    <Link href="/dashboard/connect-spotify">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/5 border border-primary/15 hover:border-primary/30 transition-all duration-200 overflow-hidden group cursor-pointer">
        <div className="p-5 flex items-center gap-4">
          {/* Icon */}
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Music4 size={22} className="text-primary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">
              Connect your artist profile
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Link your Spotify artist page — we'll automatically fetch your tracks, artwork, and stats.
            </p>
          </div>

          {/* Arrow */}
          <div className="shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>
    </Link>
  );
}
