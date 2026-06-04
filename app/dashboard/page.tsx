'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/TopNav';
import CampaignWizard from '@/components/CampaignWizard';
import ArtistEmbed from '@/components/ArtistEmbed';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard, Megaphone, UserCircle, DollarSign, Plus,
  ExternalLink, Music, Video, TrendingUp, Heart,
  Check, Sparkles, Loader2, Save, Copy, Music2,
  BarChart3, Filter, Clock, Percent, Bug
} from 'lucide-react';
import DisputeButton from '@/components/DisputeButton';
import DashboardChart from '@/components/DashboardChart';
import { useToast } from '@/components/Toast';
import DashboardErrorBoundary from '@/components/DashboardErrorBoundary';
import DashboardErrorBoundary from '@/components/DashboardErrorBoundary';

type TabId = 'overview' | 'tracks' | 'profile' | 'earnings' | 'kanban';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{background:'#0F0F23'}}><Header /><main className="page-container"><Skeleton className="h-40 w-full" /></main></div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { mutate: globalMutate } = useSWRConfig();

  // Auth
  const { data: profileData } = useSWR('/api/auth/me', fetcher, swrConfig);
  const profile = profileData?.user || null;
  const displayName = profile?.display_name || '';
  const isArtist = profile?.user_type === 'artist' || profile?.is_artist;

  // Tab state from URL or default
  const tabFromUrl = searchParams.get('tab') as TabId | null;
  const [tab, setTab] = useState<TabId>(tabFromUrl || 'overview');

  useEffect(() => {
    const t = searchParams.get('tab') as TabId | null;
    if (t && ['overview','tracks','profile','earnings'].includes(t)) setTab(t);
  }, [searchParams]);

  const switchTab = (t: TabId) => {
    setTab(t);
    router.push(`/dashboard?tab=${t}`, { scroll: false });
  };

  // Campaign wizard
  const [wizardOpen, setWizardOpen] = useState(false);

  // ─── Campaigns ──────────────────────────────────────────────
  const { data: campaignsData, error: campaignsErr, isLoading: campaignsLoading, mutate: reloadCampaigns } = useSWR('/api/campaigns', fetcher, swrConfig);
  const rawCampaigns = campaignsData?.campaigns || [];

  // ─── Artist Profile (claimed) ───────────────────────────────
  const { data: artistData, mutate: reloadArtist } = useSWR(
    profile ? `/api/artist/me` : null,
    fetcher,
    swrConfig
  );
  const artistProfile = artistData?.artist || null;
  const artistSlug = artistData?.slug || '';
  const artistTracks = artistData?.tracks || [];
  const artistStats = artistData?.stats || {};
  const artistBio = artistData?.bio || '';

  // ─── Profile edit state ─────────────────────────────────────
  const [editBio, setEditBio] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editTiktok, setEditTiktok] = useState('');
  const [editGenres, setEditGenres] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [bioChanged, setBioChanged] = useState(false);

  useEffect(() => {
    if (artistProfile) {
      setEditBio(artistBio || '');
      setEditInstagram(artistProfile.instagram_handle || '');
      setEditTiktok(artistProfile.tiktok_handle || '');
      setEditGenres(Array.isArray(artistProfile.genres) ? artistProfile.genres : []);
    }
  }, [artistProfile, artistBio]);

  const saveProfile = async () => {
    if (!artistSlug) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/artists/${artistSlug}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: editBio,
          instagram_handle: editInstagram || null,
          tiktok_handle: editTiktok || null,
          genres: editGenres,
        }),
      });
      if (res.ok) {
        addToast('Profile updated', 'success');
        setBioChanged(false);
        reloadArtist();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to save', 'error');
      }
    } catch { addToast('Network error', 'error'); }
    setSaving(false);
  };

  // ─── Track import state ─────────────────────────────────────
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok?: boolean; imported?: number; skipped?: number; message?: string; error?: string } | null>(null);

  // ─── Manual track state ─────────────────────────────────────
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualAdding, setManualAdding] = useState(false);
  const handleAddManualTrack = async () => {
    if (!manualTitle.trim() || !artistSlug) return;
    setManualAdding(true);
    try {
      const res = await fetch(`/api/artists/${artistSlug}/tracks`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: manualTitle.trim(), spotify_url: manualUrl.trim() || null, cpm_rate_cents: 10 }),
      });
      if (res.ok) {
        addToast('Track added!', 'success');
        setManualTitle('');
        setManualUrl('');
        reloadArtist();
        reloadCampaigns();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to add track', 'error');
      }
    } catch { addToast('Network error', 'error'); }
    setManualAdding(false);
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/artist/import-tracks', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      setImportResult(data);
      if (data.ok) {
        addToast(data.message || 'Tracks imported!', 'success');
        reloadArtist();
        reloadCampaigns();
      }
    } catch {
      setImportResult({ error: 'Network error' });
      addToast('Import failed', 'error');
    }
    setImporting(false);
  };

  // ─── Earnings ───────────────────────────────────────────────
  const { data: earningsData } = useSWR('/api/earnings', fetcher, swrConfig);

  // ─── Activity ───────────────────────────────────────────────
  const { data: activityData } = useSWR(
    artistProfile?.profile_slug ? `/api/artists/${artistProfile.profile_slug}/activity` : null,
    fetcher,
    swrConfig
  );

  // ─── Computed stats ─────────────────────────────────────────
  const totalViews = rawCampaigns.reduce((s: number, c: any) => s + parseInt(c.total_verified_views || '0'), 0);
  const totalSpent = rawCampaigns.reduce((s: number, c: any) => s + ((c.total_budget_cents || 0) - (c.budget_remaining_cents || 0)), 0);
  const totalSubmissions = rawCampaigns.reduce((s: number, c: any) => s + parseInt(c.approved_submissions || '0'), 0);
  const activeCount = rawCampaigns.filter((c: any) => c.status === 'active').length;

  const formatViews = (v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : String(v);
  const formatDollars = (c: number) => `$${(c/100).toFixed(0)}`;

  // ─── Tabs ───────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tracks', label: isArtist ? 'Tracks' : 'Submissions', icon: Megaphone },
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'kanban', label: 'Board', icon: <BarChart3 size={14} /> },  ];

  return (
    <DashboardErrorBoundary>
    <div className="min-h-screen" style={{ background: '#0F0F23' }}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* ─── Welcome header ─────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
              {displayName ? `Welcome back, ${displayName.split(' ')[0]}` : 'Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="capitalize">{profile?.user_type || 'creator'}</span>
              {artistSlug && (
                <a href={`/artist/${artistSlug}`} className="text-primary hover:underline flex items-center gap-1 text-xs">
                  View profile <ExternalLink size={10} />
                </a>
              )}
            </p>
          </div>
          {isArtist && (
            <div className="flex items-center gap-3">
              {artistData?.balance_cents > 0 && (
                <span className="text-xs text-muted-foreground/60">
                  Balance: <span className="text-emerald-400 font-semibold">{formatDollars(artistData?.balance_cents || 0)}</span>
                </span>
              )}
              <Button onClick={() => setWizardOpen(true)} size="sm">
                <Plus size={16} className="mr-1" /> New track
              </Button>
            </div>
          )}
        </div>

        {/* ─── Tab bar ────────────────────────────────────── */}
        <div className="flex gap-1 mb-8 border-b border-white/[0.06] overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => switchTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                <Icon size={16} className={active ? 'text-primary' : ''} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ─── TAB: Overview ──────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(isArtist ? [
                { label: 'Tracks', value: String(artistTracks.length || activeCount), icon: Megaphone },
                { label: 'Submissions', value: String(totalSubmissions), icon: Video },
                { label: 'Views', value: formatViews(totalViews), icon: TrendingUp },
                { label: 'Balance', value: formatDollars(artistData?.balance_cents || 0), icon: DollarSign },
              ] : [
                { label: 'Submissions', value: String(earningsData?.submissions?.length || 0), icon: Video },
                { label: 'Total earned', value: formatDollars(earningsData?.totalEarned || 0), icon: DollarSign },
                { label: 'Paid out', value: formatDollars(earningsData?.totalPaid || 0), icon: Check },
                { label: 'Pending', value: formatDollars(earningsData?.totalPending || 0), icon: Loader2 },
              ]).map((s, i) => {
                const Icon = s.icon;
                return (
                  <Card key={i}><CardContent className="p-4 text-center">
                    <Icon size={16} className="mx-auto mb-2 text-primary/60" />
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  </CardContent></Card>
                );
              })}
            </div>

            {/* Quick actions */}
            <Card className="border-primary/10 bg-primary/[0.02]">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">
                      {isArtist
                        ? artistTracks.length > 0
                          ? `${artistTracks.length} track${artistTracks.length > 1 ? 's' : ''} in your catalog`
                          : 'Add your first track to get started'
                        : 'Browse artists and start creating content'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isArtist
                        ? artistTracks.length > 0
                          ? `Import more tracks from Spotify, Bandcamp, or Deezer`
                          : 'Import from Spotify, Bandcamp, or add manually'
                        : 'Find artists that match your style and earn per verified view'}
                    </p>
                  </div>
                </div>
                {isArtist && artistTracks.length === 0 && (
                  <Button size="sm" onClick={() => switchTab('profile')} className="shrink-0 ml-3">
                    Add tracks
                  </Button>
                )}
                {!isArtist && (
                  <a href="/browse"><Button size="sm" className="shrink-0 ml-3">Browse artists</Button></a>
                )}
              </CardContent>
            </Card>

            {/* Dashboard chart — views over time + funnel */}
            {isArtist && rawCampaigns.length > 0 && (
              <DashboardChart
                campaigns={rawCampaigns}
                isArtist={isArtist}
                totalViews={totalViews}
                totalSubmissions={totalSubmissions}
                totalApproved={rawCampaigns.reduce((s: number, c: any) => s + parseInt(c.approved_submissions || '0'), 0)}
                totalSpent={totalSpent}
              />
            )}

            {/* Recent activity */}
            {isArtist && artistSlug && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" />
                    Recent activity
                  </h3>
                  {activityData?.events?.length > 0 ? (
                    <div className="space-y-2">
                      {activityData.events.slice(0, 5).map((e: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                          <span className="capitalize">{e.event_type?.replace(/_/g, ' ')}</span>
                          <span className="text-muted-foreground/50">· {new Date(e.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/50">No recent activity yet.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Bug reports section */}
            <BugReportsSection />

            {/* Referral section */}
            {profile && <ReferralSection userId={profile.id} email={profile.email || ''} />}
          </div>
        )}

        {/* ─── TAB: Tracks (Artist) / Submissions (Creator) ── */}
        {tab === 'tracks' && (
          <div className="space-y-4">
            {isArtist ? (
              <>
                {/* Stats bar (always visible) */}
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Active', value: activeCount },
                    { label: 'Submissions', value: totalSubmissions },
                    { label: 'Views', value: formatViews(totalViews) },
                    { label: 'Spent', value: formatDollars(totalSpent) },
                  ].map(s => (
                    <Card key={s.label}><CardContent className="p-3 text-center">
                      <p className="text-lg font-bold">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                    </CardContent></Card>
                  ))}
                </div>

                {/* Track grid */}
                {campaignsLoading ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {[1,2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
                  </div>
                ) : campaignsErr ? (
                  <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
                    Failed to load tracks. <button onClick={() => reloadCampaigns()} className="text-primary hover:underline">Retry</button>
                  </CardContent></Card>
                ) : rawCampaigns.length === 0 ? (
                  <Card><CardContent className="p-12 text-center">
                    <Megaphone size={32} className="mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-sm font-medium mb-1">No tracks yet</p>
                    <p className="text-xs text-muted-foreground mb-4">Import your tracks from Spotify, Bandcamp, or add them manually.</p>
                    <Button onClick={() => switchTab('profile')} size="sm"><Plus size={14} className="mr-1" /> Import tracks</Button>
                  </CardContent></Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {rawCampaigns.map((c: any) => {
                      const pct = c.total_budget_cents > 0
                        ? Math.min(((c.total_budget_cents - (c.budget_remaining_cents || 0)) / c.total_budget_cents) * 100, 100)
                        : 0;
                      return (
                        <Card key={c.id} className="overflow-hidden cursor-pointer hover:border-primary/20 transition-colors"
                          onClick={() => router.push(`/c/${c.slug || c.id}`)}>
                          <CardContent className="p-5 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <h3 className="font-semibold truncate">{c.track_title}</h3>
                                <p className="text-xs text-muted-foreground">
                                  ${((c.cpm_rate_cents || 0) / 100).toFixed(2)} CPM · ${((c.total_budget_cents || 0) / 100).toFixed(0)} budget
                                </p>
                              </div>
                                {c.status === 'active' ? 'Live' : c.status}
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-center text-xs">
                              <div><p className="font-bold text-sm">{c.approved_submissions || 0}</p>subs</div>
                              <div><p className="font-bold text-sm">{formatViews(parseInt(c.total_verified_views || '0'))}</p>views</div>
                              <div><p className="font-bold text-sm">{formatDollars((c.total_budget_cents || 0) - (c.budget_remaining_cents || 0))}</p>spent</div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              /* Creator: Submissions view */
              <Card><CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Your submissions</h3>
                  <a href="/browse"><Button size="sm"><Plus size={14} className="mr-1" /> Browse campaigns</Button></a>
                </div>
                {earningsData?.submissions?.length > 0 ? (
                  <div className="space-y-2">
                    {earningsData.submissions.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.track_title}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {s.platform} · {new Date(s.submitted_at).toLocaleDateString()} · {(s.views_verified || 0).toLocaleString()} views
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-bold">{formatDollars(s.payout_amount_cents || 0)}</p>
                            {s.payout_status === 'paid' ? 'Paid' : s.review_status === 'approved' ? 'Approved' : s.review_status === 'rejected' ? 'Rejected' : 'Pending'}
                          {s.review_status === 'rejected' && s.dispute_status !== 'pending' && s.dispute_status !== 'under_review' && (
                            <div className="mt-1">
                              <DisputeButton submissionId={s.id} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Video size={28} className="mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground mb-1">No submissions yet</p>
                    <p className="text-xs text-muted-foreground/50 mb-4">Browse campaigns, create content, and submit for review to start earning.</p>
                    <a href="/browse"><Button size="sm">Browse campaigns</Button></a>
                  </div>
                )}
              </CardContent></Card>
            )}
          </div>
        )}

        {/* ─── TAB: Profile ───────────────────────────────── */}
        {tab === 'kanban' && (() => {
  const cols = ['active', 'draft', 'completed'];
  const labels = ['Live', 'Drafts', 'Completed'];
  const colors = ['emerald', 'gray', 'blue'];
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Track Board</h3>
      <div className="grid grid-cols-3 gap-3 min-h-[200px]">
        {cols.map((status, i) => (
          <div key={status} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-xs font-semibold mb-3">{labels[i]}</p>
            {rawCampaigns.filter((c: any) => (c.status || 'draft') === status).map((c: any) => (
              <div key={c.id} className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 mb-2">
                <p className="text-xs font-medium truncate">{c.track_title || c.title}</p>
                <p className="text-[9px] text-muted-foreground/50 mt-1">${((c.cpm_rate_cents || 0) / 100).toFixed(2)} CPM</p>
              </div>
            ))}
            {rawCampaigns.filter((c: any) => (c.status || 'draft') === status).length === 0 && (
              <p className="text-[10px] text-muted-foreground/40 text-center py-6">None</p>
            )}
          </div>
        ))}
      </div>
    </div>
    </DashboardErrorBoundary>
  );
})()}
{tab === 'profile' && (
          <div className="max-w-2xl space-y-6">
            {isArtist ? (
              artistProfile ? (
                <>
                  {/* Profile header */}
                  <Card><CardContent className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden">
                        {artistProfile.spotify_image_url ? (
                          <img src={artistProfile.spotify_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          displayName[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      <div>
                        <h2 className="font-bold text-lg">{artistProfile.artist_name || displayName}</h2>
                        <p className="text-xs text-muted-foreground">
                          {Array.isArray(artistProfile.genres) ? artistProfile.genres.join(', ') : 'No genres set'}
                        </p>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Bio</label>
                      <textarea value={editBio} onChange={e => { setEditBio(e.target.value); setBioChanged(true); }}
                        rows={4}
                        placeholder="Tell the world about your music... "
                        className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:border-primary/30" />
                      <p className="text-[10px] text-muted-foreground/40 mt-1">{editBio.length}/500 characters</p>
                    </div>

                    {/* Social links */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                          📸 Instagram
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">@</span>
                            <input placeholder="handle" className="pl-7 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block font-medium flex items-center gap-1">
                          <Music2 size={12} /> TikTok
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">@</span>
                            <input placeholder="handle" className="pl-7 text-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Genres */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Genres</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Pop','Hip-Hop','Electronic','Rock','Indie','R&B','Jazz','Classical','Country','Metal','Folk','Soul'].map(g => {
                          const sel = editGenres.includes(g);
                          return (
                            <button key={g} type="button" onClick={() => {
                              setEditGenres(prev => sel ? prev.filter(x => x !== g) : [...prev, g]);
                              setBioChanged(true);
                            }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                sel ? 'border-primary bg-primary/[0.08] text-primary' : 'border-white/[0.06] text-muted-foreground hover:border-white/[0.12]'
                              }`}>
                              {g}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Save */}
                    <div className="flex items-center gap-3 pt-2">
                      <Button onClick={saveProfile} disabled={saving || !bioChanged} className="flex items-center gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Saving...' : 'Save changes'}
                      </Button>
                      {!bioChanged && <span className="text-xs text-muted-foreground/50">No unsaved changes</span>}
                    </div>
                  </CardContent></Card>

                  {/* Import tracks from link */}
                  <Card><CardContent className="p-5 space-y-3">
                    <h3 className="text-xs font-semibold flex items-center gap-2">
                      <Music size={14} className="text-primary" />
                      Import tracks
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Paste your Spotify, Bandcamp, or Deezer profile link to auto-import your tracks.
                    </p>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input value={importUrl} onChange={e => setImportUrl(e.target.value)}
                          placeholder="https://open.spotify.com/artist/..."
                          className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30"
                          onKeyDown={e => e.key === 'Enter' && handleImport()} />
                        <button onClick={handleImport} disabled={importing || !importUrl.trim()}
                          className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0">
                          {importing ? <><Loader2 size={14} className="animate-spin" /> Scanning</> : 'Import'}
                        </button>
                      </div>
                      {importResult && (
                        <div className={`text-xs p-3 rounded-lg ${importResult.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {importResult.ok
                            ? `✅ ${importResult.message || 'Imported!'}`
                            : importResult.error || 'Import failed'}
                        </div>
                      )}
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground/50 hover:text-muted-foreground text-[11px]">
                          Or add a track manually →
                        </summary>
                        <div className="flex gap-2 mt-2">
                          <input value={manualTitle} onChange={e => setManualTitle(e.target.value)}
                            placeholder="Track name"
                            className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30"
                            onKeyDown={e => e.key === 'Enter' && handleAddManualTrack()} />
                          <button onClick={handleAddManualTrack} disabled={manualAdding || !manualTitle.trim()}
                            className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-all shrink-0">
                            {manualAdding ? 'Adding...' : 'Add'}
                          </button>
                        </div>
                        <input value={manualUrl} onChange={e => setManualUrl(e.target.value)}
                          placeholder="Spotify URL (optional)"
                          className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 mt-1" />
                      </details>
                      <p className="text-[9px] text-muted-foreground/40">
                        Supports: Spotify artist links, Bandcamp pages, Deezer artist profiles. Max 20 tracks.
                      </p>
                    </div>
                  </CardContent></Card>

                  {/* Embed widget */}
                  {artistSlug && (
                    <ArtistEmbed artistSlug={artistSlug} artistName={artistProfile.artist_name || displayName} />
                  )}
                </>
              ) : (
                <Card><CardContent className="p-8 text-center">
                  <UserCircle size={32} className="mx-auto mb-3 text-muted-foreground/20" />
                  <p className="text-sm font-medium mb-1">No artist profile yet</p>
                  <p className="text-xs text-muted-foreground mb-4">Create your artist profile to start managing your music.</p>
                  <a href="/onboarding?role=artist"><Button size="sm">Create artist profile</Button></a>
                </CardContent></Card>
              )
            ) : (
              /* Creator profile view — simpler */
              <Card><CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center text-lg font-bold">
                    {displayName[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h2 className="font-bold">{displayName}</h2>
                    <p className="text-xs text-muted-foreground">Creator · {profile?.email}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  You're registered as a creator. Browse campaigns, create content, and earn per verified view.
                </p>
                <a href="/browse"><Button size="sm">Browse campaigns</Button></a>
              </CardContent></Card>
            )}
          </div>
        )}

        {/* ─── TAB: Earnings ──────────────────────────────────── */}
        {tab === 'earnings' && (
          <div className="max-w-2xl space-y-6">
            <Card><CardContent className="p-6">
              {isArtist ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Balance</h3>
                  <div className="rounded-2xl bg-gradient-to-br from-primary/[0.04] to-emerald-500/[0.02] border border-primary/10 p-6 text-center">
                    <p className="text-4xl font-bold">{formatDollars(artistData?.balance_cents || 0)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {artistData?.pending_payouts_cents > 0
                        ? `${formatDollars(artistData.pending_payouts_cents)} pending in submissions`
                        : 'Available for creator payouts'}
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-4">
                      <Link href={`/checkout?type=donation&artistSlug=${artistSlug}`}>
                        <Button size="sm"><Plus size={14} className="mr-1" /> Add funds</Button>
                      </Link>
                    </div>
                  </div>

                  {/* Recent transactions */}
                  {artistData?.transactions?.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium mt-4 mb-2">Recent transactions</p>
                      {artistData.transactions.slice(0, 10).map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/[0.02]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`shrink-0 ${t.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {t.type === 'deposit' ? '+' : '-'}
                            </span>
                            <span className="truncate text-muted-foreground">{t.description || t.type}</span>
                          </div>
                          <span className="font-medium shrink-0 ml-2">
                            {t.type === 'deposit' ? '+' : '-'}${(Math.abs(t.amount_cents) / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground/50 text-center pt-3">
                      No transactions yet. Add funds to get started.
                    </p>
                  )}
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {[
                      { label: 'Total deposited', value: formatDollars(rawCampaigns.reduce((s: number, c: any) => s + (c.total_budget_cents || 0), 0)) },
                      { label: 'Spent', value: formatDollars(totalSpent) },
                      { label: 'Remaining', value: formatDollars(rawCampaigns.reduce((s: number, c: any) => s + (c.budget_remaining_cents || 0), 0)) },
                      { label: 'Platform fees', value: `$${Math.round(totalSpent * 0.1667)}` },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <p className="text-lg font-bold">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  {rawCampaigns.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {rawCampaigns.map((c: any) => (
                        <div key={c.id} className="flex items-center justify-between text-xs p-3 rounded-lg bg-white/[0.02]">
                          <span className="truncate">{c.track_title}</span>
                          <span className="text-muted-foreground shrink-0 ml-2">{formatDollars(c.total_budget_cents || 0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Your earnings</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total earned', value: formatDollars(earningsData?.totalEarned || 0) },
                      { label: 'Paid out', value: formatDollars(earningsData?.totalPaid || 0) },
                      { label: 'Pending', value: formatDollars(earningsData?.totalPending || 0) },
                      { label: 'Monthly projection', value: (() => { const m = earningsData?.totalEarned || 0; return formatDollars(m > 0 ? Math.round(m * 2) : 0); })() },
                    ].map(s => (
                      <div key={s.label} className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <p className="text-lg font-bold">{s.value}</p>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 text-center">
                    <a href="/earnings" className="text-xs text-primary hover:underline">View leaderboard →</a>
                  </div>
                </div>
              )}
            </CardContent></Card>
          </div>
        )}

        {/* ─── Track Wizard Modal ──────────────────────── */}
        <CampaignWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCreated={() => reloadCampaigns()} />
      </main>
    </div>
    </DashboardErrorBoundary>
  );
}

/* ─── BUG REPORTS SECTION ───────────────────────────────────── */
function BugReportsSection() {
  const [bugs, setBugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bugs', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBugs(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || bugs.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Bug size={14} className="text-primary" />
          Bug reports
        </h3>
        <div className="space-y-2">
          {bugs.slice(0, 5).map((bug: any) => (
            <div key={bug.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="truncate text-muted-foreground">{bug.description.slice(0, 60)}{bug.description.length > 60 ? '...' : ''}</span>
              </div>
              <span className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[9px] font-medium ${
                bug.status === 'new' ? 'bg-red-500/10 text-red-400' :
                bug.status === 'in_progress' ? 'bg-yellow-500/10 text-yellow-400' :
                bug.status === 'fixed' ? 'bg-emerald-500/10 text-emerald-400' :
                'bg-white/[0.04] text-muted-foreground'
              }`}>
                {bug.status === 'in_progress' ? 'in progress' : bug.status}
              </span>
            </div>
          ))}
          {bugs.length > 5 && (
            <p className="text-[10px] text-muted-foreground/50 text-center pt-1">+{bugs.length - 5} more</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── REFERRAL SECTION ──────────────────────────────────────── */
function ReferralSection({ userId, email }: { userId: string; email: string }) {
  const { data: refData, mutate: reloadRef } = useSWR('/api/referral/code', fetcher, swrConfig);
  const [withdrawing, setWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const referralCode = refData?.referral_code;
  const earningsCents = refData?.referrer_earnings_cents || 0;
  const pendingBonuses = refData?.pending_bonuses || 0;
  const totalPendingCents = refData?.total_pending_cents || 0;
  const referredUsers = refData?.referred_users || 0;
  const shareLink = referralCode ? `https://selah.fm/login?ref=${referralCode}` : '#';

  const copy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      addToast('Referral link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => addToast('Failed to copy', 'error'));
  };

  const withdraw = async () => {
    if (withdrawing || totalPendingCents <= 0) return;
    setWithdrawing(true);
    try {
      const res = await fetch('/api/referral/withdraw', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_cents: totalPendingCents }),
      });
      const data = await res.json();
      if (data.ok) {
        addToast(data.message || 'Referral earnings withdrawn!', 'success');
        reloadRef();
      } else {
        addToast(data.message || 'Failed to withdraw', 'error');
      }
    } catch { addToast('Network error', 'error'); }
    setWithdrawing(false);
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Heart size={18} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Refer & earn</p>
              <p className="text-xs text-muted-foreground">You earn 5% of every first deposit they make. They get 5% too.</p>
            </div>
          </div>
        </div>

        {/* Milestone progress bar */}
        <div>
          <div className="flex justify-between text-[10px] text-muted-foreground/50 mb-1">
            <span>Referral progress</span>
            <span>{referredUsers} / 10</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all" style={{width: Math.min(100, (referredUsers / 10) * 100) + '%'}} />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground/30 mt-1">
            <span>1 referral</span>
            <span>{10 - Math.min(10, referredUsers)} to next bonus</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            <p className="text-lg font-bold text-emerald-400">${(earningsCents / 100).toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Total earned</p>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            <p className="text-lg font-bold">{referredUsers}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Referred</p>
          </div>
          {pendingBonuses > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-lg font-bold text-amber-400">{pendingBonuses}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
            </div>
          )}
        </div>

        {/* Share link + withdraw */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <code className="block text-[10px] bg-white/[0.04] px-3 py-2 rounded-lg font-mono truncate">{shareLink}</code>
          </div>
          <button onClick={copy} className="shrink-0 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors flex items-center gap-1">
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {pendingBonuses > 0 && (
            <button onClick={withdraw} disabled={withdrawing}
              className="shrink-0 px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-40">
              {withdrawing ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
              Withdraw ${(totalPendingCents / 100).toFixed(2)}
            </button>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground/40">
          Share this link with creators and artists. When they sign up and deposit $10+, you both earn 5%.
        </p>
      </CardContent>
    </Card>
  );
}
