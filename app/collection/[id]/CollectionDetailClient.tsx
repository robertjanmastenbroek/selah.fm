'use client';

import Link from 'next/link';
import Header from '@/components/TopNav';
import { Music2, ExternalLink, DollarSign, Users, ChevronRight, Sparkles } from 'lucide-react';

export default function CollectionDetailClient({ collection }: { collection: any }) {
  const items = collection.items || [];
  const owner = collection.owner_name || 'Anonymous';

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/40 mb-3">
            <Link href="/browse" className="hover:text-muted-foreground">Browse</Link>
            <span>/</span>
            <span className="text-muted-foreground/60">Collection</span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground mb-3">{collection.description}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground/50">
            <span className="flex items-center gap-1"><Users size={12} /> by {owner}</span>
            <span>·</span>
            <span>{items.length} track{items.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Track grid */}
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Music2 size={40} className="mx-auto mb-4 text-muted-foreground/20" />
            <h2 className="text-lg font-semibold mb-2">This collection is empty</h2>
            <p className="text-sm text-muted-foreground mb-6">Browse tracks and save your favorites to collections.</p>
            <Link href="/browse" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90">
              Browse tracks
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: any) => {
              const cpm = item.cpm_rate_cents ? `$${(item.cpm_rate_cents / 100).toFixed(2)}` : null;
              return (
                <Link key={item.id} href={`/artist/${item.artist_slug}/tracks/${item.track_id}`}
                  className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-primary/20 transition-all hover:-translate-y-0.5">
                  <div className="aspect-square bg-white/[0.02] overflow-hidden">
                    {item.cover_art_url ? (
                      <img src={item.cover_art_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music2 size={32} className="text-white/10" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.artist_name}</p>
                    {cpm && <p className="text-[10px] text-emerald-400/70">{cpm} CPM</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
