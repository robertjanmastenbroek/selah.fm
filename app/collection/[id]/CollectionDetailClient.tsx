'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Music, ExternalLink, Trash2, ArrowLeft, Lock, Globe } from 'lucide-react';
import Header from '@/components/TopNav';

export default function CollectionDetailClient({ id }: { id: string }) {
  const [collection, setCollection] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingTrack, setRemovingTrack] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    loadCollection();
  }, [id]);

  const loadCollection = async () => {
    try {
      const res = await fetch(`/api/collections/${id}`, { credentials: 'include' });
      if (!res.ok) { setError('Collection not found'); setLoading(false); return; }
      const d = await res.json();
      setCollection(d.collection);
      setItems(d.items || []);
      // Check ownership
      const auth = await fetch('/api/auth/me', { credentials: 'include' });
      const authData = await auth.json();
      setIsOwner(authData.user?.id === d.collection?.user_id);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const removeTrack = async (trackId: string) => {
    if (!isOwner || removingTrack) return;
    setRemovingTrack(trackId);
    try {
      await fetch(`/api/collections/${id}/items?trackId=${trackId}`, {
        method: 'DELETE', credentials: 'include',
      });
      setItems(prev => prev.filter(i => i.track_id !== trackId));
    } catch {}
    setRemovingTrack(null);
  };

  if (loading) return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-white/[0.03] rounded-lg" />
          <div className="h-4 w-32 bg-white/[0.02] rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-white/[0.02] rounded-2xl" />)}
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F23' }}>
      <p className="text-muted-foreground">{error}</p>
    </div>
  );

  if (!collection) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F23' }}>
      <p className="text-muted-foreground">Collection not found</p>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="text-[11px] text-muted-foreground/40 mb-6">
          <Link href="/" className="hover:text-muted-foreground">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-muted-foreground/60">{collection.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              {collection.name}
            </h1>
            <p className="text-sm text-muted-foreground/60">
              {items.length} track{items.length !== 1 ? 's' : ''}
              {collection.owner_name && <span> · by {collection.owner_name}</span>}
              {!collection.owner_name && <span> · <Lock size={10} className="inline" /> private</span>}
            </p>
          </div>
        </div>

        {/* Track grid */}
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Music size={32} className="mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground/50">This collection is empty</p>
            <Link href="/browse" className="text-xs text-primary hover:underline mt-2 inline-block">
              Browse artists →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {items.map((item: any) => {
              const cpm = item.cpm_rate_cents ? `$${((item.cpm_rate_cents / 100) * 1000).toFixed(0)}/1M` : null;
              return (
                <div key={item.id} className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-primary/20 transition-all">
                  <Link href={`/c/${item.campaign_id}`}
                    className="block aspect-square bg-black/30 relative overflow-hidden">
                    {item.cover_art_url ? (
                      <img src={item.cover_art_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={24} className="text-white/10" />
                      </div>
                    )}
                    {/* CPM badge */}
                    {cpm && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 backdrop-blur-sm border border-emerald-500/20">
                        {cpm}
                      </span>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink size={20} className="text-white" />
                    </div>
                  </Link>
                  <div className="p-3">
                    <Link href={`/c/${item.campaign_id}`}
                      className="text-xs font-semibold truncate block hover:text-primary transition-colors">
                      {item.title}
                    </Link>
                    <Link href={`/artist/${item.artist_slug}`}
                      className="text-[10px] text-muted-foreground/60 hover:text-primary/70 transition-colors truncate block">
                      {item.artist_name}
                    </Link>
                  </div>
                  {isOwner && (
                    <button onClick={() => removeTrack(item.track_id)} disabled={removingTrack === item.track_id}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-all disabled:opacity-30"
                      title="Remove from collection">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <Link href="/browse" className="text-xs text-muted-foreground/50 hover:text-primary/70 transition-colors">
            <ArrowLeft size={12} className="inline mr-1" />
            Back to browse
          </Link>
        </div>
      </main>
    </div>
  );
}
