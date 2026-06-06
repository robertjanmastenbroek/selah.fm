'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music, Film, Eye, Sparkles, ChevronRight, ChartBar, ExternalLink, Heart, Bookmark, Check } from 'lucide-react';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import EarnModal from '@/components/EarnModal';

// ════════════════════════════════════════════════════════════
// EARNINGS CALCULATOR
// ════════════════════════════════════════════════════════════

function EarningsCalculator({ cpmCents }: { cpmCents: number }) {
  const cpmDollars = cpmCents / 100;
  const [views, setViews] = useState(10000);
  const earnings = (views / 1000) * cpmDollars * 0.8;

  const presets = [
    { label: '1K', value: 1000 },
    { label: '10K', value: 10000 },
    { label: '100K', value: 100000 },
    { label: '1M', value: 1000000 },
  ];

  const closestPreset = useMemo(() =>
    presets.reduce((prev, curr) =>
      Math.abs(curr.value - views) < Math.abs(prev.value - views) ? curr : prev
    ), [views]);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-indigo-500/[0.03] border border-white/[0.06] p-5">
      <div className="flex items-center gap-2 mb-4">
        <ChartBar size={16} className="text-indigo-400" />
        <h3 className="font-semibold text-sm">How much you could earn</h3>
      </div>

      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-muted-foreground">Your estimated views</span>
          <span className="text-sm font-bold text-white">
            {views >= 1000000 ? `${(views / 1000000).toFixed(1)}M` : views >= 1000 ? `${(views / 1000).toFixed(0)}K` : views.toLocaleString()} views
          </span>
        </div>
        <input type="range" min={100} max={5000000} step={100} value={views}
          onChange={(e) => setViews(parseInt(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-white/[0.08]
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-indigo-500/40"
          style={{ background: `linear-gradient(to right, rgb(99,102,241) ${(views / 5000000) * 100}%, rgba(255,255,255,0.08) ${(views / 5000000) * 100}%)` }} />
        <div className="flex justify-between mt-1.5">
          {presets.map((p) => (
            <button key={p.label} onClick={() => setViews(p.value)}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${
                closestPreset.value === p.value ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        <div>
          <p className="text-xs text-muted-foreground">Your earnings (80%)</p>
          <p className="text-2xl font-bold text-emerald-400">
            ${earnings >= 1 ? earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : earnings.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">At ${cpmDollars.toFixed(2)} CPM</p>
          <p className="text-[10px] text-muted-foreground/50">Platform fee: 20%</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[10000, 100000, 1000000].map((v) => {
          const earn = (v / 1000) * cpmDollars * 0.8;
          return (
            <div key={v} className={`text-center p-2 rounded-lg border transition-all ${
              views >= v * 0.5 && views <= v * 1.5 ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-white/[0.04] bg-white/[0.02]'
            }`}>
              <p className="text-[10px] text-muted-foreground/70">{v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : `${(v / 1000).toFixed(0)}K`}</p>
              <p className="text-xs font-bold text-emerald-400/90">${earn.toFixed(2)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SAVE TO COLLECTION BUTTON
// ════════════════════════════════════════════════════════════

function SaveToCollection({ trackId, trackTitle, artistName }: { trackId: string; trackTitle: string; artistName: string }) {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [savedCollectionId, setSavedCollectionId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (showPicker) {
      fetch('/api/collections', { credentials: 'include' })
        .then(r => r.json())
        .then(d => setCollections(d.collections || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [showPicker]);

  const addToCollection = async (collectionId: string) => {
    setSaving(collectionId);
    setError('');
    try {
      const res = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      });
      if (res.ok) {
        setSaved(true);
        setSavedCollectionId(collectionId);
        setShowPicker(false);
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Failed to save');
      }
    } catch { setError('Network error'); }
    setSaving(null);
  };

  const createAndAdd = async () => {
    const name = prompt('Collection name:');
    if (!name?.trim()) return;
    setShowPicker(false);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: `Tracks featuring ${artistName}` }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.collection) {
          await addToCollection(d.collection.id);
          // Reload collections list so new collection appears if picker reopens
          fetch('/api/collections', { credentials: 'include' })
            .then(r2 => r2.json())
            .then(d2 => setCollections(d2.collections || []));
        }
      }
    } catch {}
  };

  return (
    <div className="relative">
      <button onClick={async () => {
        try {
          const auth = await fetch('/api/auth/me', { credentials: 'include' });
          if (!auth.ok) { window.location.href = '/login'; return; }
        } catch { window.location.href = '/login'; return; }
        setShowPicker(!showPicker);
      }}
        className="flex items-center gap-2 w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-xs text-muted-foreground">
        {saved ? <Check size={14} className="text-emerald-400" /> : <Bookmark size={14} />}
        {saved ? 'Saved!' : 'Save to collection'}
      </button>
      {saved && savedCollectionId && (
        <a href={`/collection/${savedCollectionId}`} className="block text-[10px] text-primary hover:underline mt-1 text-center">
          View collection →
        </a>
      )}
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}

      {showPicker && (
        <div className="absolute bottom-full mb-2 left-0 right-0 rounded-xl bg-[#1C1C3A] border border-white/[0.08] shadow-xl p-3 max-h-48 overflow-y-auto z-10">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-2">Loading...</p>
          ) : collections.length === 0 ? (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground mb-2">No collections yet</p>
              <button onClick={createAndAdd} className="text-xs text-primary hover:underline">Create one</button>
            </div>
          ) : (
            <div className="space-y-1">
              {collections.map((c: any) => (
                <button key={c.id} onClick={() => addToCollection(c.id)} disabled={saving === c.id}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-white hover:bg-white/[0.04] transition-colors disabled:opacity-50 flex items-center justify-between">
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 text-[9px] text-muted-foreground/40 ml-2">{c.item_count || 0}</span>
                </button>
              ))}
              <div className="border-t border-white/[0.06] pt-1 mt-1">
                <button onClick={createAndAdd} className="w-full text-left px-3 py-2 rounded-lg text-xs text-primary hover:bg-white/[0.04] transition-colors">
                  + New collection
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════

interface TrackDetailProps {
  track: any;
  slug: string;
}

function trackSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'track';
}

export default function TrackDetailClient({ track, slug }: TrackDetailProps) {
  const [joinOpen, setJoinOpen] = useState(false);

  const artistName = track.artist_name || 'Artist';
  const trackTitle = track.title || 'Untitled';
  const cpm = (track.cpm_rate_cents || 0) / 100;
  const cpmPer1M = track.cpm_rate_cents ? `$${((track.cpm_rate_cents / 100) * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : null;
  const campaignActive = track.campaign_status === 'active';
  const submissions = track.submission_count || 0;
  const views = track.total_views || 0;

  // Detect streaming platform from URL
  const streamingLinks: { url: string; label: string; icon: JSX.Element; bg: string; color: string }[] = [];
  if (track.spotify_url) {
    streamingLinks.push({
      url: track.spotify_url,
      label: 'Listen on Spotify',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>,
      bg: 'bg-green-500/5',
      color: 'text-green-400',
    });
  }

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12 pb-32 md:pb-20">
        {/* Track header */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mb-8">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-white/[0.04] shrink-0">
            {track.cover_art_url ? (
              <img src={track.cover_art_url} alt={`${trackTitle} cover`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white/10">
                {trackTitle[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              {trackTitle}
            </h1>
            <Link href={`/artist/${slug}`} className="text-primary hover:underline text-sm">
              {artistName}
            </Link>
            {campaignActive && (
              <span className="ml-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles size={10} /> Active
              </span>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'CPM', value: cpmPer1M ? `${cpmPer1M}/1M views` : '—', icon: <ChartBar size={14} className="text-indigo-400" /> },
            { label: 'Views', value: views?.toLocaleString() || '0', icon: <Eye size={14} className="text-emerald-400" /> },
            { label: 'Submissions', value: String(submissions || 0), icon: <Film size={14} className="text-amber-400" /> },
            { label: 'Status', value: campaignActive ? 'Active' : track.campaign_status || 'Draft', icon: <Sparkles size={14} className={campaignActive ? 'text-emerald-400' : 'text-muted-foreground'} /> },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Two-column layout: CTA + Calculator left, streaming links right */}
        <div className="grid md:grid-cols-5 gap-6 mb-12">
          <div className="md:col-span-3 space-y-4">
            {/* Earnings calculator — the #1 question creators have */}
            <EarningsCalculator cpmCents={track.cpm_rate_cents || 0} />

            {/* Primary CTA — always opens EarnModal on the track page */}
            <button onClick={() => setJoinOpen(true)}
              className="block w-full py-4 text-center text-base font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white
                active:scale-[0.98] transition-all hover:shadow-[0_0_24px_rgba(67,56,202,0.4)] shadow-lg shadow-indigo-500/20
                flex items-center justify-center gap-2 group">
              <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
              {cpmPer1M ? `Submit video — earn ${cpmPer1M}/1M views` : 'Submit video →'}
            </button>

            {/* Trust bar */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { text: 'Free to start' },
                { text: 'You earn 80%' },
                { text: 'Verified views only' },
              ].map((b, i) => (
                <span key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]
                    text-[10px] text-muted-foreground/70 font-medium">
                  {b.text}
                </span>
              ))}
            </div>

          </div>

          <div className="md:col-span-2 space-y-3">
            {/* Streaming links */}
            {streamingLinks.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground/40 mb-2">Listen on</p>
                {streamingLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-3 rounded-xl ${link.bg} border border-white/[0.06] hover:bg-white/[0.06] transition-all mb-2`}>
                    <span className="shrink-0">{link.icon}</span>
                    <span className={`text-xs font-medium ${link.color}`}>{link.label}</span>
                    <ExternalLink size={12} className="ml-auto text-muted-foreground/40" />
                  </a>
                ))}
              </div>
            )}

            {/* Save to collection */}
            <SaveToCollection trackId={track.id} trackTitle={trackTitle} artistName={artistName} />

            {/* Back to artist */}
            <Link href={`/artist/${slug}`}
              className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-xs text-muted-foreground">
              View all tracks by {artistName}
              <ChevronRight size={12} className="ml-auto" />
            </Link>
          </div>
        </div>

        {/* SEO content */}
        <section className="text-sm text-muted-foreground/60 leading-relaxed space-y-4 max-w-2xl">
          <h2 className="text-base font-semibold text-foreground">About this track</h2>
          <p>"{trackTitle}" is a track by {artistName} available on Selah.fm. Creators can make short-form videos featuring this track and earn per verified view.</p>
          {cpmPer1M && <p>At the current CPM rate of ${cpm.toFixed(2)} per 1,000 views, creators can earn {cpmPer1M} for every 1 million verified views their video receives.</p>}
          {submissions > 0 && <p>{submissions} creator{submissions !== 1 ? 's have' : ' has'} already submitted videos for this track, generating {views?.toLocaleString() || '0'} verified views.</p>}
        </section>

        {/* Related tracks carousel */}
        {track.relatedTracks?.length > 0 && (
          <section className="mt-16">
            <h2 className="text-lg font-semibold mb-4">More from {artistName}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
              {track.relatedTracks.map((rt: any) => (
                <Link
                  key={rt.id}
                  href={`/artist/${slug}/tracks/${trackSlug(rt.title || '')}`}
                  className="snap-start shrink-0 w-36 group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-white/[0.04] mb-2">
                    {rt.cover_art_url ? (
                      <img src={rt.cover_art_url} alt={rt.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white/10">
                        {rt.title?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium truncate text-muted-foreground group-hover:text-foreground transition-colors">{rt.title}</p>
                  {rt.cpm_rate_cents && (
                    <p className="text-[10px] text-emerald-400/70">${(rt.cpm_rate_cents / 100).toFixed(2)} CPM</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ════════════════════════════════════════════════ */}
      {/* STICKY MOBILE BAR */}
      {/* ════════════════════════════════════════════════ */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-[#0F0F23]/95 backdrop-blur-lg border-t border-white/[0.06] px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-3">
            <p className="text-xs font-semibold truncate">{trackTitle}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="text-emerald-400 font-medium">{cpmPer1M}</span>
              <span className="text-muted-foreground/30">·</span>
              <span>{artistName}</span>
              {submissions > 0 && (
                <><span className="text-muted-foreground/30">·</span><span className="text-indigo-400">{submissions} sub{submissions !== 1 ? 's' : ''}</span></>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setJoinOpen(true)}
              className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white
                active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-1.5">
              <Sparkles size={14} />
              Submit video
            </button>
          </div>
        </div>
      </motion.div>

      {/* Earn modal (for when no campaign exists yet) */}
      {/* Earn modal — track.id is the campaign UUID */}
      <EarnModal
        open={joinOpen}
        campaignId={track.id || ""}
        onClose={() => setJoinOpen(false)}
        trackTitle={trackTitle}
        cpmCents={track.cpm_rate_cents || 0}
      />
    </div>
  );
}
