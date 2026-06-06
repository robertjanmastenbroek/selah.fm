'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Video, Music, ExternalLink, MessageCircle, Users, DollarSign, Sparkles, Check, ChevronDown, ChartBar } from 'lucide-react';
import Header from '@/components/TopNav';
import { Button } from '@/components/ui/button';
import ActivityFeed from '@/components/ActivityFeed';
import PageComments from '@/components/PageComments';
import ReviewSection from '@/components/ReviewSection';
import ArtistEmbed from '@/components/ArtistEmbed';
import SubmissionReactions from '@/components/SubmissionReactions';
import SubmitVideoModal from '@/components/SubmitVideoModal';
import ArtistCard from '@/components/ArtistCard';
import ArtistStreamingStats from '@/components/ArtistStreamingStats';
import HelpfulSurvey from '@/components/HelpfulSurvey';
import EditSuggestionModal from '@/components/EditSuggestionModal';
import EditorAttributionBadge from '@/components/EditorAttributionBadge';
import { getArtistLinks } from '@/lib/internal-links';

interface ArtistProps {
  artist: any;
  tracks: any[];
  stats: any;
  recentSubmissions: any[];
  socialButtons: { label: string; url: string; icon: string }[];
  slug: string;
  relatedArtists?: any[];
  campaigns?: any[];
  balanceCents?: number;
  claimedByUserId?: string;
  verifiedEditCount?: number;
  latestEditDate?: string | null;
}

function trackSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'track';
}

export default function ArtistProfileClient({ artist, tracks, stats, recentSubmissions, socialButtons, slug, relatedArtists = [], campaigns = [], balanceCents = 0, claimedByUserId, verifiedEditCount = 0, latestEditDate = null }: ArtistProps) {
  const name = artist.artist_name || 'Unknown Artist';
  const genres = (() => {
    const raw = artist.genres;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [raw];
      } catch {
        // PostgreSQL array format: {pop,rock}
        if (raw.startsWith('{') && raw.endsWith('}')) {
          return raw.slice(1, -1).split(',').map((g: string) => g.trim().replace(/^"|"$/g, '')).filter(Boolean);
        }
        // Extract content within quotes: BLISTER["pop"] → ["pop"]
        const quoted = raw.match(/"([^"]+)"/g);
        if (quoted && quoted.length > 0) {
          return quoted.map((g: string) => g.replace(/"/g, '')).filter(Boolean);
        }
        // Return as single-item array (clean up any brackets)
        return [raw.replace(/[[\]{}"]/g, '').trim()];
      }
    }
    return [String(raw)];
  })();
  const listeners = artist.monthly_listeners || 0;
  const rawImage = artist.spotify_image_url || '';
  // Accept any image URL; exclude only the old 16px Bandcamp thumbnails
  const isRealImage = rawImage && !rawImage.includes('_16.jpg');
  const imageUrl = isRealImage ? rawImage : '';
  const bio = artist.bio || '';
  const trackCover = tracks?.[0]?.cover_art_url || artist.latest_track_cover_url || '';

  // Unique gradient per artist
  const nameHash = (() => { let h = 0; const n = name; for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h); return Math.abs(h); })();
  const hues = [[250,200],[200,160],[160,120],[50,30],[340,320],[220,180],[30,10]];
  const [h1, h2] = hues[nameHash % hues.length];
  const s = 30 + (nameHash % 40);
  const l = 25 + (nameHash % 20);
  const gradient = `linear-gradient(135deg, hsl(${h1}, ${s}%, ${l}%), hsl(${h2}, ${s + 20}%, ${l + 10}%))`;
  const bannerGradient = `linear-gradient(135deg, hsl(${h1}, ${s + 10}%, ${l - 10}%), hsl(${h2}, ${s + 30}%, ${l}%))`;
  const initial = name[0]?.toUpperCase() || '?';
  const totalDonations = stats.total_donations_cents || 0;
  const supporterCount = stats.supporter_count || 0;
  const topCpm = tracks[0]?.cpm_rate_cents ? (tracks[0].cpm_rate_cents / 100).toFixed(2) : null;
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalInitialField, setEditModalInitialField] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('tracks');
  const [currentUserId, setCurrentUserId] = useState('');
  const [streamingStats, setStreamingStats] = useState<any>(null);

  // Fetch auth state
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.user) setCurrentUserId(d.user.id); })
      .catch(e => console.error('Auth error:', e));
  }, []);

  // Fetch streaming stats on mount
  useEffect(() => {
    fetch(`/api/artist/${slug}/refresh`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!d.error) setStreamingStats(d); })
      .catch(e => console.error('Async error in artist/[slug]/ArtistProfileClient.tsx:', e));
  }, [slug]);

  // Follow state (server-persisted + localStorage fallback)
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  useEffect(() => {
    // Try server first
    fetch(`/api/artists/${slug}/follow`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.following !== undefined) setFollowing(d.following); })
      .catch(() => {
        // Fallback to localStorage
        const stored = localStorage.getItem('selah_follows');
        if (stored) {
          const follows = JSON.parse(stored);
          setFollowing(!!follows[slug]);
        }
      });
  }, [slug]);

  const toggleFollow = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    // Optimistic UI
    setFollowing(!following);
    try {
      const res = await fetch(`/api/artists/${slug}/follow`, {
        method: 'POST', credentials: 'include',
      });
      const data = await res.json();
      if (data.following !== undefined) setFollowing(data.following);
    } catch {
      // Fallback to localStorage
      setFollowing(!following);
      const stored = localStorage.getItem('selah_follows');
      const follows = stored ? JSON.parse(stored) : {};
      if (following) delete follows[slug];
      else follows[slug] = { name, followedAt: Date.now() };
      localStorage.setItem('selah_follows', JSON.stringify(follows));
    }
    setFollowLoading(false);
  };

  // Track sorting
  const [sortBy, setSortBy] = useState<'cpm' | 'newest'>('cpm');
  const sortedTracks = [...tracks].sort((a, b) => {
    if (sortBy === 'cpm') return (b.cpm_rate_cents || 0) - (a.cpm_rate_cents || 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const hasActivity = stats.total_submissions > 0 || stats.total_donations_cents > 0 || (artist.comment_count || 0) > 0;

  return (
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      {/* ════════════════════════════════════════════════ */}
      {/* COVER BANNER — full-width, 4:1 ratio */}
      {/* ════════════════════════════════════════════════ */}
      <div className="relative w-full h-40 sm:h-52 md:h-64 overflow-hidden">
        {trackCover ? (
          <img src={trackCover} alt="" className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full" style={{ background: bannerGradient }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F23] via-[#0F0F23]/60 to-transparent" />

        {/* Verified badge on banner */}
        {hasActivity && (
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1.5">
            <Check size={12} />
            Verified artist
          </div>
        )}
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">

        {/* ════════════════════════════════════════════════ */}
        {/* HEADER — Photo + Name + Stats Row + CTAs */}
        {/* ════════════════════════════════════════════════ */}
        <div className="mb-8">
          {/* Profile photo + Name row */}
          <div className="flex items-end gap-5 mb-4">
            {/* Photo */}
            <div className="shrink-0 w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-4 border-[#0F0F23] shadow-xl -mt-14 md:-mt-20">
              {imageUrl ? (
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: gradient }}>
                  <span className="text-4xl md:text-5xl font-bold text-white/20 select-none">{initial}</span>
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-0.5" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
                {name}
                {hasActivity && <span className="ml-2 inline-flex items-center gap-1 text-emerald-400 text-sm font-normal"><Check size={14} /> Verified</span>}
              </h1>

              <div className="flex flex-wrap items-center gap-2 mb-2">
                {genres.slice(0, 3).map((g: string) => {
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
                    country: 'from-amber-500/20 to-yellow-500/10 border-amber-500/20 text-amber-300',
                    ambient: 'from-sky-500/20 to-indigo-500/10 border-sky-500/20 text-sky-300',
                    punk: 'from-fuchsia-500/20 to-pink-500/10 border-fuchsia-500/20 text-fuchsia-300',
                    alternative: 'from-teal-500/20 to-cyan-500/10 border-teal-500/20 text-teal-300',
                    experimental: 'from-rose-500/20 to-pink-500/10 border-rose-500/20 text-rose-300',
                    latin: 'from-red-500/20 to-yellow-500/10 border-red-500/20 text-red-300',
                  };
                  const gl = g.toLowerCase();
                  const colorClass = Object.entries(colors).find(([k]) => gl.includes(k))?.[1] || 'from-primary/20 to-primary/5 border-primary/20 text-primary';
                  return (
                    <Link key={g} href={`/browse/genre/${g.toLowerCase()}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-gradient-to-r ${colorClass} border transition-all hover:scale-105`}>
                      {g}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {listeners > 0 && <span className="flex items-center gap-1"><Users size={12} />{listeners >= 1000 ? `${(listeners / 1000).toFixed(1)}K` : listeners} monthly listeners</span>}
                {supporterCount > 0 && <span className="flex items-center gap-1"><Heart size={12} className="text-red-400" />{supporterCount} supporters</span>}
              </div>
            </div>

            {/* Follow + Share — actions */}
            <div className="hidden sm:flex items-center gap-2 pb-1 shrink-0">
              <button onClick={toggleFollow}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] ${
                  following
                    ? 'bg-white/[0.08] text-foreground border border-white/[0.12]'
                    : 'bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(67,56,202,0.3)]'
                }`}>
                {following ? 'Following' : '+ Follow'}
              </button>
              {claimedByUserId && (
                <Link href={`/messages?user=${claimedByUserId}`}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] border border-white/[0.08] text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-primary/[0.04] transition-all flex items-center gap-1.5">
                  <MessageCircle size={13} /> Message
                </Link>
              )}
              <button onClick={() => navigator.clipboard.writeText(window.location.href)}
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs hover:bg-white/[0.08] transition-all"
                title="Share profile">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </button>
              {socialButtons.length > 0 && (
                <div className="flex items-center gap-1">
                  {socialButtons.slice(0, 3).map(s => (
                    <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs hover:bg-white/[0.08] transition-all"
                      title={s.label}>
                      <span>{s.icon}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Stats Bar ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {[
              { value: stats.total_tracks, label: 'Tracks', icon: <Music size={14} /> },
              { value: stats.total_submissions, label: 'Submissions', icon: <Video size={14} /> },
              { value: `$${(totalDonations / 100).toFixed(0)}`, label: 'Raised', icon: <DollarSign size={14} /> },
              { value: balanceCents > 0 ? `$${(balanceCents / 100).toFixed(2)}` : '—', label: 'Budget', icon: <Sparkles size={14} /> },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-muted-foreground/60">{s.icon}</div>
                <div>
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Primary CTAs ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href={`/checkout?type=donation&artistSlug=${slug}`}
              className="group rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/15 p-5 hover:border-red-500/30 transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <Heart size={24} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Support {name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Donate to help promote their music</p>
              </div>
              <Button className="bg-red-500 hover:bg-red-600 text-white shrink-0 text-xs">
                Donate
              </Button>
            </Link>

            <button onClick={() => setShowSubmitModal(true)}
              className="group rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/15 p-5 hover:border-emerald-500/30 transition-all flex items-center gap-4 w-full text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Video size={24} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Create</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pick a track, make content, earn per view</p>
              </div>
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0 text-xs">Create</Button>
            </button>
          </div>
        </div>

        {/* Social proof — raised amount prominent */}
        {totalDonations > 0 && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-green-500/5 border border-emerald-500/10 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-emerald-400">${(totalDonations / 100).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">raised by {supporterCount} supporters</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground/60">{stats.total_submissions} submissions</p>
              <p className="text-sm text-muted-foreground/60">{stats.total_tracks} tracks</p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════ */}
        {/* TWO-COLUMN LAYOUT */}
        {/* ════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT COLUMN: Tabbed content (Tracks / Activity / About / Comments) ── */}
          <div className="lg:col-span-2">
            {/* Tab bar */}
            <div className="flex border-b border-white/[0.06] mb-6 overflow-x-auto">
              {[
                { id: 'tracks', label: 'Tracks', icon: <Music size={13} /> },
                { id: 'activity', label: 'Activity', icon: <ChartBar size={13} /> },
                { id: 'about', label: 'About', icon: <Users size={13} /> },
                { id: 'comments', label: 'Reviews & Comments', icon: <MessageCircle size={13} /> },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors relative whitespace-nowrap ${
                    activeTab === tab.id ? 'text-white' : 'text-muted-foreground hover:text-white/70'
                  }`}>
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                </button>
              ))}
            </div>

            {/* ── TAB: Tracks ── */}
            {activeTab === 'tracks' && (
              <div className="space-y-4">
                {/* Quick facts mini */}
                <section className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
                  <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    Quick facts about {name}
                  </h2>
                  <dl className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Genre', value: genres.slice(0, 2).join(', ') || '—' },
                      { label: 'Listeners', value: listeners > 0 ? `${listeners >= 1000 ? (listeners / 1000).toFixed(1) + 'K' : listeners}` : (artist.total_followers > 0 ? `${artist.total_followers >= 1000 ? (artist.total_followers / 1000).toFixed(1) + 'K' : artist.total_followers}` : '—') },
                      { label: 'Streams', value: artist.total_streams > 0 ? `${artist.total_streams >= 1000000 ? (artist.total_streams / 1000000).toFixed(1) + 'M' : artist.total_streams >= 1000 ? (artist.total_streams / 1000).toFixed(1) + 'K' : artist.total_streams}` : '—' },
                      { label: 'Tracks', value: stats.total_tracks },
                      { label: 'Raised', value: `$${(totalDonations / 100).toFixed(0)}` },
                      { label: 'Top CPM', value: topCpm ? `$${(parseFloat(topCpm) * 1000).toFixed(0)}/1M views` : '—' },
                    ].map(f => (
                      <div key={f.label}>
                        <dt className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</dt>
                        <dd className="text-sm font-semibold mt-0.5">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                {/* Tracks with sorting */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold flex items-center gap-2">
                      <Music size={14} className="text-muted-foreground" />
                      Tracks by {name}
                    </h2>
                    <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
                      {(['cpm', 'newest'] as const).map(s => (
                        <button key={s} onClick={() => setSortBy(s)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                            sortBy === s ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground'
                          }`}>
                          {s === 'cpm' ? 'Highest CPM' : 'Newest'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {sortedTracks.length === 0 ? (
                    <p className="text-sm text-muted-foreground/50 py-6 text-center">No tracks listed yet. Check back soon.</p>
                  ) : (
                    <>
                    <div className="grid gap-2">
                      {sortedTracks.slice(0, 20).map((track: any) => {
                        const cpm = track.cpm_rate_cents ? (track.cpm_rate_cents / 100).toFixed(2) : '0.00';
                        const hasActiveCampaign = campaigns.some((c: any) =>
                          c.track_title?.toLowerCase() === track.track_title?.toLowerCase()
                        );
                        return (
                          <div key={track.id}
                            className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] hover:border-primary/15 transition-all group">
                            {/* Track cover art — links to track page */}
                            <Link href={`/artist/${slug}/tracks/${trackSlug(track.track_title || track.title || '')}`}
                              className="w-12 h-12 rounded-lg overflow-hidden bg-white/[0.03] shrink-0 relative group/thumb">
                              {track.cover_art_url ? (
                                <img src={track.cover_art_url} alt={track.track_title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><Music size={16} className="text-white/10" /></div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                                <ExternalLink size={14} className="text-white" />
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                              {/* Track title — links to track page */}
                              <Link href={`/artist/${slug}/tracks/${trackSlug(track.track_title || track.title || '')}`}
                                className="text-sm font-semibold truncate hover:text-primary transition-colors block">
                                {track.track_title}
                                {hasActiveCampaign && (
                                  <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    Active budget
                                  </span>
                                )}
                              </Link>
                              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                                <span className="text-emerald-400 font-medium">${(parseFloat(cpm) * 1000).toFixed(0)}/1M views</span>
                                {track.submissions_count > 0 && <span className="ml-2">· {track.submissions_count} submissions</span>}
                                {track.total_views > 0 && <span className="ml-2">· {track.total_views >= 1000 ? (track.total_views / 1000).toFixed(1) + 'K' : track.total_views} views</span>}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Track page link */}
                              <Link href={`/artist/${slug}/tracks/${trackSlug(track.track_title || track.title || '')}`}
                                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[9px] text-muted-foreground/50 hover:text-primary hover:border-primary/20 hover:bg-primary/[0.04] transition-all"
                                title="View track details">
                                <ExternalLink size={12} />
                              </Link>
                              {/* Submit / Create CTA */}
                              {hasActiveCampaign ? (
                                <Link href={`/artist/${slug}/tracks/${trackSlug(track.track_title || track.title || '')}`}
                                  className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-primary/[0.04] transition-all">
                                  Submit
                                </Link>
                              ) : (
                                <button onClick={() => setShowSubmitModal(true)}
                                  className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/20 transition-all">
                                  Create
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {sortedTracks.length > 20 && (
                      <p className="text-xs text-muted-foreground/50 text-center pt-2">
                        + {sortedTracks.length - 20} more tracks — not all verified
                      </p>
                    )}
                    </>
                  )}
                </section>
              </div>
            )}

            {/* ── TAB: Activity ── */}
            {activeTab === 'activity' && (
              <div className="space-y-8">
                {/* Streaming stats (from artist_metrics) */}
                <ArtistStreamingStats data={streamingStats} />

                {/* Activity Feed */}
                <ActivityFeed artistSlug={slug} />

                {/* Recent Submissions Gallery */}
                {recentSubmissions.length > 0 && (
                  <section>
                    <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
                      <Video size={14} className="text-muted-foreground" />
                      Recent Videos
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {recentSubmissions.map((sub: any) => (
                        <div key={sub.id} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-primary/15 transition-all group">
                          <a href={sub.content_url} target="_blank" rel="noopener noreferrer"
                            className="block aspect-[9/16] bg-black/40 flex items-center justify-center relative overflow-hidden">
                            <Video size={24} className="text-white/30 group-hover:scale-110 transition-transform" />
                          </a>
                          <div className="p-3 space-y-2">
                            <p className="text-[10px] text-muted-foreground/60 truncate">{sub.track_title}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground/40">
                                {(sub.views_verified || 0) >= 1000 ? `${(sub.views_verified / 1000).toFixed(1)}K views` : `${sub.views_verified || 0} views`}
                              </span>
                              <SubmissionReactions submissionId={sub.id} initialCounts={sub.reactions_count ? { heart: sub.reactions_count } : {}} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ── TAB: About ── */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                {bio && (
                  <section>
                    <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Users size={14} className="text-muted-foreground" />
                      About {name}
                    </h2>
                    <div className="text-sm text-muted-foreground/70 leading-relaxed prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: bio }} />
                    {/* Community attribution badge */}
                    <EditorAttributionBadge
                      artistId={artist.id}
                      lastEditedAt={latestEditDate || undefined}
                      contributorCount={verifiedEditCount}
                    />
                  </section>
                )}
                {!bio && (
                  <p className="text-sm text-muted-foreground/50 py-6 text-center">
                    No bio yet. Check back soon.
                  </p>
                )}

                {/* Community feedback survey */}
                <div id="helpful-survey">
                  <HelpfulSurvey
                    artistId={artist.id}
                    artistSlug={slug}
                    artistName={name}
                    userId={currentUserId || undefined}
                    hasExistingContributions={verifiedEditCount}
                  />
                </div>
              </div>
            )}

            {/* ── TAB: Comments ── */}
            {activeTab === 'comments' && (
              <div className="space-y-6">
                <ReviewSection artistId={artist.id} currentUserId={currentUserId} />
                <PageComments pageType="artist" pageId={artist.id} currentUserId={currentUserId} />
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: Sticky CTA + Related + Embed + Claim + Links ── */}
          <div className="space-y-6">
            {/* Sticky CTA card (desktop only) */}
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Primary CTA card */}
              <div className="rounded-2xl bg-gradient-to-br from-primary/[0.04] to-primary/[0.02] border border-primary/[0.08] p-5 text-center space-y-4">
                <h3 className="font-bold text-sm">{name}</h3>
                <div className="space-y-2">
                  <Link href={`/checkout?type=donation&artistSlug=${slug}`}
                    className="block w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold hover:shadow-[0_0_16px_rgba(239,68,68,0.3)] transition-all">
                    Donate
                  </Link>
                  <button onClick={() => setShowSubmitModal(true)}
                    className="block w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold hover:shadow-[0_0_16px_rgba(34,197,94,0.3)] transition-all">
                    Create
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground/40">No upfront cost · 80% creator payout</p>
              </div>

              {/* Similar Artists — compact */}
              {relatedArtists.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users size={12} /> Similar Artists
                  </h3>
                  <div className="space-y-2">
                    {relatedArtists.slice(0, 4).map((ra: any) => (
                      <Link key={ra.id} href={`/artist/${ra.slug}`}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-all">
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-white/[0.04]">
                          {ra.spotify_image_url ? (
                            <img src={ra.spotify_image_url} alt={ra.artist_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-white/20 font-bold">
                              {ra.artist_name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{ra.artist_name}</p>
                          <p className="text-[9px] text-muted-foreground/50 truncate">
                            {ra.monthly_listeners ? `${ra.monthly_listeners >= 1000 ? (ra.monthly_listeners / 1000).toFixed(1) + 'K' : ra.monthly_listeners} listeners` : ''}
                          </p>
                        </div>
                        <span className="text-[9px] text-primary/60 shrink-0">View →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Embed widget */}
              <ArtistEmbed artistSlug={slug} artistName={name} />

              {/* Claim page */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 text-center">
                <p className="text-xs text-muted-foreground/60 mb-2">Is this your artist page?</p>
                <Link href={`/login?redirect=/claim?artist=${slug}`}
                  className="text-xs text-primary hover:underline font-medium">
                  Claim this page →
                </Link>
              </div>

              {/* Cross-links */}
              <div className="space-y-1.5">
                {getArtistLinks(genres).map((link, i) => (
                  <Link key={i} href={link.url}
                    className="block text-[11px] text-muted-foreground/50 hover:text-primary/70 transition-colors">
                    → {link.anchor}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ════════════════════════════════════════════════ */}
      {/* STICKY MOBILE BAR */}
      {/* ════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-[#0F0F23]/95 backdrop-blur-lg border-t border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href={`/checkout?type=donation&artistSlug=${slug}`}
            className="flex-1 py-3 rounded-xl text-xs font-semibold text-center border border-white/[0.12] bg-white/[0.02] text-muted-foreground hover:text-white hover:bg-white/[0.05] transition-all flex items-center justify-center gap-1.5">
            <Heart size={14} className="text-red-400" />
            Donate
          </Link>
          <button onClick={() => setShowSubmitModal(true)}
            className="flex-1 py-3 rounded-xl text-xs font-bold text-center bg-gradient-to-r from-emerald-500 to-emerald-600 text-white active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5">
            <Video size={14} />
            Create
          </button>
        </div>
      </div>

      {/* Submit video modal */}
      <SubmitVideoModal
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        tracks={tracks.slice(0, 20)}
        artistSlug={slug}
        artistName={name}
      />

      {/* Edit suggestion modal */}
      <EditSuggestionModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditModalInitialField(undefined); }}
        artistId={artist.id}
        artistName={name}
        currentBio={bio}
        currentGenres={genres}
        initialField={editModalInitialField}
      />
    </div>
  );
}
