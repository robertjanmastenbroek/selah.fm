'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/TopNav';
import { Search } from 'lucide-react';

interface Artist {
  display_name: string;
  latest_track_name: string;
  slug: string;
  spotify_image_url: string;
  total_followers: number;
  total_platforms: number;
}

export default function ArtistsClient({ initialArtists }: { initialArtists: Artist[] }) {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  async function fetchArtists(search = '') {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/artists?${params}`);
      const d = await res.json();
      setArtists(d.artists || []);
    } catch {}
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) { e.preventDefault(); fetchArtists(searchText); }

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23' }}>
      <Header />
      <main className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Artists</h1>
          <p className="text-muted-foreground text-sm">{artists.length} artists tracked across 27 platforms</p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input
              type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
              placeholder="Search artists..." className="w-full rounded-xl bg-white/[0.03] border border-white/[0.06] pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors"
            />
          </div>
        </form>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-white/[0.04] mx-auto mb-3" />
                <div className="h-4 bg-white/[0.04] rounded w-2/3 mx-auto mb-2" />
                <div className="h-3 bg-white/[0.04] rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">No artists found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {artists.map((a, i) => (
              <div
                key={a.slug}
                onClick={() => router.push(`/artist/${a.slug}`)}
                className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center cursor-pointer hover:border-primary/20 transition-all hover:-translate-y-0.5"
              >
                {a.spotify_image_url ? (
                  <img src={a.spotify_image_url} alt="" className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border border-white/[0.06]" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/[0.04] mx-auto mb-3 flex items-center justify-center text-2xl">🎵</div>
                )}
                <p className="text-sm font-medium truncate">{a.display_name}</p>
                {a.latest_track_name && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">"{a.latest_track_name}"</p>
                )}
                <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-muted-foreground">
                  {a.total_followers > 0 && <span>{a.total_followers.toLocaleString()} followers</span>}
                  {a.total_platforms > 0 && <span>· {a.total_platforms} platforms</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
