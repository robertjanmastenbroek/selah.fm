'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Music, Film, Eye, Sparkles, ChevronRight, ChartBar, ExternalLink, Heart, Bookmark, Check, Share2, ArrowRight, DollarSign, Shield, BadgeCheck, Clapperboard, Upload } from 'lucide-react';
import { SupporterGrid, FAQAccordion, ShareModal, TrustBar } from '@/components/TrackFeatures';
import Header from '@/components/TopNav';
import EarnModal from '@/components/EarnModal';

// ════════════════════════════════════════════════════════════
// EARNINGS CALCULATOR
// ════════════════════════════════════════════════════════════

function EarningsCalculator({ cpmCents }: { cpmCents: number }) {
  const cpmDollars = cpmCents / 100;
  const [views, setViews] = useState(10000);
  const grossEarnings = (views / 1000) * cpmDollars;
  const earnings = grossEarnings * 0.8;
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

  if (cpmCents <= 0) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/[0.03] to-indigo-500/[0.03] border border-indigo-500/10 p-6">
      <div className="flex items-center gap-3 mb-5">
        <ChartBar size={20} className="text-indigo-400" />
        <div>
          <p className="text-sm font-semibold">Earnings calculator</p>
          <p className="text-[10px] text-muted-foreground">At ${cpmDollars.toFixed(2)} CPM · You keep 80%</p>
        </div>
      </div>
      <div className="mb-5">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs text-muted-foreground">Estimated views</span>
          <span className="text-lg font-bold text-white">
            {views >= 1000000 ? `${(views / 1000000).toFixed(1)}M` : views >= 1000 ? `${(views / 1000).toFixed(0)}K` : views.toLocaleString()}
          </span>
        </div>
        <input type="range" min={100} max={5000000} step={100} value={views}
          onChange={(e) => setViews(parseInt(e.target.value))}
          className="w-full h-2.5 rounded-full appearance-none bg-white/[0.08] cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-[#4338CA] [&::-webkit-slider-thumb]:to-[#6366F1]
            [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-indigo-500/40"
          style={{ background: `linear-gradient(to right, rgba(99,102,241,0.6) ${(views / 5000000) * 100}%, rgba(255,255,255,0.08) ${(views / 5000000) * 100}%)` }} />
        <div className="flex justify-between mt-2">
          {presets.map((p) => (
            <button key={p.label} onClick={() => setViews(p.value)}
              className={`text-[10px] px-3 py-1 rounded-full transition-all ${
                closestPreset.value === p.value ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-muted-foreground/50 hover:text-muted-foreground'
              }`}>{p.label}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Platform fee (20%)</p>
          <p className="text-lg font-bold text-amber-400">${((grossEarnings - earnings).toFixed(2))}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">You earn</p>
          <p className="text-2xl font-bold text-emerald-400">
            ${earnings >= 1 ? earnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : earnings.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SAVE TO COLLECTION BUTTON (unchanged)
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
    setSaving(collectionId); setError('');
    try {
      const res = await fetch(`/api/collections/${collectionId}/items`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId }),
      });
      if (res.ok) { setSaved(true); setSavedCollectionId(collectionId); setShowPicker(false); }
      else { const err = await res.json().catch(() => ({})); setError(err.error || 'Failed to save'); }
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
        if (d.collection) await addToCollection(d.collection.id);
      }
    } catch {}
  };

  return (
    <div className="relative">
      <button onClick={async () => {
        try { const auth = await fetch('/api/auth/me', { credentials: 'include' }); if (!auth.ok) { window.location.href = '/login'; return; } }
        catch { window.location.href = '/login'; return; }
        setShowPicker(!showPicker);
      }}
        className="flex items-center gap-2 w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-xs text-muted-foreground justify-center">
        {saved ? <Check size={14} className="text-emerald-400" /> : <Bookmark size={14} />}
        {saved ? `Saved!` : 'Save track'}
      </button>
      {showPicker && (
        <div className="absolute bottom-full mb-2 left-0 right-0 rounded-xl bg-[#1C1C3A] border border-white/[0.08] shadow-xl p-3 z-10">
          {loading ? <p className="text-xs text-muted-foreground text-center py-2">Loading...</p>
          : collections.length === 0 ? (
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
                <button onClick={createAndAdd} className="w-full text-left px-3 py-2 rounded-lg text-xs text-primary hover:bg-white/[0.04] transition-colors">+ New collection</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// HOW IT WORKS SECTION
// ════════════════════════════════════════════════════════════

function HowItWorks() {
  const steps = [
    { icon: Music, step: '01', title: 'Pick this track', desc: 'Choose "Living Water" or any track from this artist. Make sure you use the official audio from TikTok, Instagram, or YouTube.' },
    { icon: Clapperboard, step: '02', title: 'Create your video', desc: 'Film a short-form vertical video (15-60 seconds) featuring the track. Be creative — the best content gets the most views.' },
    { icon: Upload, step: '03', title: 'Submit and earn', desc: 'Paste your video link, submit for review. The artist approves and you earn per verified view — paid automatically via Stripe.', highlight: true },
  ];
  return (
    <section className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-6">How it works</h2>
      <div className="space-y-5">
        {steps.map((s, i) => (
          <div key={i} className="flex gap-4 group">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.highlight ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-white/[0.04]'}`}>
                <s.icon size={18} className={s.highlight ? 'text-white' : 'text-indigo-400'} />
              </div>
              {i < steps.length - 1 && <div className="w-px flex-1 bg-white/[0.06] mt-1" />}
            </div>
            <div className="pb-5 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-indigo-400/60">{s.step}</span>
                <h3 className="font-semibold text-sm text-white/80">{s.title}</h3>
              </div>
              <p className="text-[12px] text-muted-foreground/70 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
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
  const [shareOpen, setShareOpen] = useState(false);
  const [supporters, setSupporters] = useState<any[]>([]);
  const [supporterCount, setSupporterCount] = useState(0);

  useEffect(() => {
    if (!track.id) return;
    fetch(`/api/campaigns/${track.id}?include=donations`)
      .then(r => r.json())
      .then(d => {
        if (d.donations?.supporters) {
          setSupporters(d.donations.supporters);
          setSupporterCount(d.donations.count || d.donations.supporters.length);
        }
      })
      .catch(() => {});
  }, [track.id]);

  const artistName = track.artist_name || 'Artist';
  const trackTitle = track.title || 'Untitled';
  const cpm = (track.cpm_rate_cents || 0) / 100;
  const cpmPer1M = track.cpm_rate_cents ? `$${((track.cpm_rate_cents / 100) * 1000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` : null;
  const campaignActive = track.campaign_status === 'active';
  const submissions = track.submission_count || 0;
  const views = track.total_views || 0;
  const hasBudget = (track.total_budget_cents || 0) > 0;
  const raised = track.total_budget_cents ? ((track.total_budget_cents - (track.budget_remaining_cents || track.total_budget_cents)) / 100) : 0;

  const statusText = campaignActive ? 'Active' : track.campaign_status === 'draft' ? 'Coming soon' : 'Open for submissions';
  const statusColor = campaignActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';

  const streamingLinks: { url: string; label: string; icon: JSX.Element; bg: string; color: string }[] = [];
  if (track.spotify_url) {
    streamingLinks.push({
      url: track.spotify_url, label: 'Listen on Spotify',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>,
      bg: 'bg-green-500/5', color: 'text-green-400',
    });
  }

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8 pb-32 md:pb-20">
        {/* ════════════════════════════════════════ */}
        {/* HERO SECTION */}
        {/* ════════════════════════════════════════ */}
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {/* Cover art — large & prominent */}
          <div className="md:col-span-1">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900/40 to-purple-900/40 shadow-2xl shadow-indigo-500/10">
              {track.cover_art_url ? (
                <img src={track.cover_art_url} alt={`${trackTitle} cover`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl font-bold text-white/10">{trackTitle[0]?.toUpperCase() || '?'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Track info + CTAs */}
          <div className="md:col-span-2 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusColor}`}>
                <Sparkles size={10} /> {statusText}
              </span>
              {cpmPer1M && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {cpmPer1M}/1M views
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              {trackTitle}
            </h1>
            <Link href={`/artist/${slug}`} className="text-primary/80 hover:text-primary text-sm mb-5 inline-block">
              by {artistName}
            </Link>

            {/* Social proof mini-bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <SupporterGrid supporters={supporters} totalCount={supporterCount} />
              {submissions > 0 && (
                <span className="text-xs text-muted-foreground">
                  <strong className="text-white">{submissions}</strong> submission{submissions !== 1 ? 's' : ''}
                </span>
              )}
              {hasBudget && raised > 0 && (
                <span className="text-xs text-muted-foreground">
                  <strong className="text-emerald-400">${raised.toFixed(0)}</strong> raised
                </span>
              )}
            </div>

            {/* Dual CTAs — side by side */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setJoinOpen(true)}
                className="flex-1 py-4 px-6 text-center text-base font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white
                  active:scale-[0.98] transition-all hover:shadow-[0_0_24px_rgba(67,56,202,0.4)] shadow-lg shadow-indigo-500/20
                  flex items-center justify-center gap-2 group">
                <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                {cpmPer1M ? `Submit video — earn ${cpmPer1M}` : 'Submit video'}
              </button>
              <Link href={`/checkout?campaignId=${track.id}`}
                className="flex-1 py-4 px-6 text-center text-base font-semibold rounded-xl border border-white/[0.08] bg-white/[0.02]
                  hover:bg-white/[0.05] hover:border-white/[0.12] transition-all
                  flex items-center justify-center gap-2 text-muted-foreground hover:text-white">
                <DollarSign size={18} /> Support
              </Link>
            </div>

            {/* Budget status indicator */}
            {!hasBudget && (
              <p className="text-[11px] text-muted-foreground/50 mt-2 text-center sm:text-left">
                Submissions welcome — earnings depend on budget set by artist
              </p>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* QUICK STATS ROW */}
        {/* ════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'CPM', value: cpmPer1M ? `${cpmPer1M}/1M` : 'Not set', icon: <ChartBar size={14} className="text-indigo-400" /> },
            { label: 'Views', value: views?.toLocaleString() || '0', icon: <Eye size={14} className="text-emerald-400" /> },
            { label: 'Submissions', value: String(submissions || 0), icon: <Film size={14} className="text-amber-400" /> },
            { label: 'Status', value: statusText, icon: <Sparkles size={14} className={campaignActive ? 'text-emerald-400' : 'text-indigo-400'} /> },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 text-center backdrop-blur-sm">
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-sm font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════ */}
        {/* MAIN CONTENT: Two-column */}
        {/* ════════════════════════════════════════ */}
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* LEFT: Calculator + How it works */}
          <div className="md:col-span-3 space-y-8">
            <EarningsCalculator cpmCents={track.cpm_rate_cents || 0} />
            <HowItWorks />
          </div>

          {/* RIGHT: Sidebar */}
          <div className="md:col-span-2 space-y-4">
            {/* Listen on links */}
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

            <SaveToCollection trackId={track.id} trackTitle={trackTitle} artistName={artistName} />

            <button onClick={() => setShareOpen(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-xs text-muted-foreground">
              <Share2 size={14} /> Share this track
            </button>

            <Link href={`/artist/${slug}`}
              className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all text-xs text-muted-foreground justify-center">
              View all tracks <ChevronRight size={12} />
            </Link>
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* ABOUT THIS TRACK (SEO content — moved below fold) */}
        {/* ════════════════════════════════════════ */}
        <section className="max-w-2xl mb-10">
          <h2 className="text-base font-semibold mb-3">About this track</h2>
          <div className="text-sm text-muted-foreground/60 leading-relaxed space-y-3">
            <p>"{trackTitle}" is a track by {artistName} available on Selah.fm. Creators can make short-form videos featuring this track and earn per verified view.</p>
            {cpmPer1M && <p>At the current CPM rate of ${cpm.toFixed(2)} per 1,000 views, creators can earn {cpmPer1M} for every 1 million verified views their video receives.</p>}
            {submissions > 0 && <p>{submissions} creator{submissions !== 1 ? 's have' : ' has'} already submitted videos for this track, generating {views?.toLocaleString() || '0'} verified views.</p>}
          </div>
        </section>

        {/* ════════════════════════════════════════ */}
        {/* FAQ */}
        {/* ════════════════════════════════════════ */}
        <section className="max-w-2xl mb-10">
          <h2 className="text-lg font-semibold mb-4">Common questions</h2>
          <FAQAccordion />
        </section>

        {/* ════════════════════════════════════════ */}
        {/* TRUST BAR */}
        {/* ════════════════════════════════════════ */}
        <section className="max-w-2xl mb-10">
          <TrustBar />
        </section>

        {/* ════════════════════════════════════════ */}
        {/* RELATED TRACKS */}
        {/* ════════════════════════════════════════ */}
        {track.relatedTracks?.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">More from {artistName}</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
              {track.relatedTracks.map((rt: any) => (
                <Link key={rt.id} href={`/artist/${slug}/tracks/${trackSlug(rt.title || '')}`}
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

        {/* ════════════════════════════════════════ */}
        {/* SHARE MODAL */}
        {/* ════════════════════════════════════════ */}
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          url={`https://selah.fm/artist/${slug}/tracks/${trackSlug(trackTitle)}`}
          title={`Earn ${cpmPer1M || 'money'} promoting "${trackTitle}" by ${artistName} on Selah.fm`}
        />

        {/* ════════════════════════════════════════ */}
        {/* STICKY MOBILE BAR */}
        {/* ════════════════════════════════════════ */}
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 inset-x-0 z-50 block bg-[#0F0F23]/95 backdrop-blur-lg border-t border-white/[0.06] px-4 py-3 shadow-2xl"
        >
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="min-w-0 flex-1 mr-3">
              <p className="text-xs font-semibold truncate">{trackTitle}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="text-emerald-400 font-medium">{cpmPer1M || 'CPM not set'}</span>
                <span className="text-muted-foreground/30">·</span>
                <span>{artistName}</span>
                {submissions > 0 && (
                  <><span className="text-muted-foreground/30">·</span><span className="text-indigo-400">{submissions} sub{submissions !== 1 ? 's' : ''}</span></>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/checkout?campaignId=${track.id}`}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-white/[0.08] text-muted-foreground hover:text-white transition-all flex items-center gap-1.5">
                <DollarSign size={14} /> Support
              </Link>
              <button onClick={() => setJoinOpen(true)}
                className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white
                  active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-1.5">
                <Sparkles size={14} />
                Submit
              </button>
            </div>
          </div>
        </motion.div>

        {/* ════════════════════════════════════════ */}
        {/* EARN MODAL */}
        {/* ════════════════════════════════════════ */}
        <EarnModal
          open={joinOpen}
          campaignId={track.id || ""}
          onClose={() => setJoinOpen(false)}
          trackTitle={trackTitle}
          cpmCents={track.cpm_rate_cents || 0}
        />
      </main>
    </div>
  );
}
