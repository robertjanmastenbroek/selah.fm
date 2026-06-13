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
  LayoutDashboard, Megaphone, User, DollarSign, Plus,
  ExternalLink, Music, Video, TrendingUp, Heart,
  Check, Sparkles, LoaderCircle, Save, Copy, Music2,
  ChartBar, SlidersHorizontal, Clock, Percent, Bug,
  Camera, Play, ArrowUpRight, BarChart3, Zap,
  Wallet, Palette, Download, Film, X, Trophy, ChevronRight,
} from 'lucide-react';
import DisputeButton from '@/components/DisputeButton';
import { useToast } from '@/components/Toast';
import DashboardErrorBoundary from '@/components/DashboardErrorBoundary';
import DashboardSidebar from '@/components/DashboardSidebar';
import type { TabDef } from '@/components/DashboardSidebar';
import AnimatedKPICard from '@/components/AnimatedKPICard';
import ViewsChart from '@/components/ViewsChart';

type TabId = 'overview' | 'tracks' | 'submissions' | 'earnings' | 'tiktok';

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-[#0F0F23]"><Header /><div className="p-8 space-y-4 max-w-6xl mx-auto"><Skeleton className="h-24 w-full rounded-2xl" /><Skeleton className="h-48 w-full rounded-2xl" /><Skeleton className="h-32 w-full rounded-2xl" /></div></div>}>
        <DashboardContent />
      </Suspense>
    </DashboardErrorBoundary>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();
  const { mutate: globalMutate } = useSWRConfig();

  // Sidebar state — persisted to localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selah-dashboard-sidebar');
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('selah-dashboard-sidebar', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

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
    if (t && ['overview', 'tracks', 'earnings'].includes(t)) setTab(t);
  }, [searchParams]);

  const switchTab = (t: TabId) => {
    setTab(t);
    router.push(`/dashboard?tab=${t}`, { scroll: false });
  };

  const [wizardOpen, setWizardOpen] = useState(false);
  const [submissionCounts, setSubmissionCounts] = useState({ total: 0, pending: 0, approved: 0 });

  // ─── Data ────────────────────────────────────────────────────
  const { data: campaignsData, error: campaignsErr, isLoading: campaignsLoading, mutate: reloadCampaigns } = useSWR('/api/campaigns', fetcher, swrConfig);
  const rawCampaigns = campaignsData?.campaigns || [];

  const { data: artistData, mutate: reloadArtist } = useSWR(profile ? `/api/artist/me` : null, fetcher, swrConfig);
  const artistProfile = artistData?.artist || null;
  const artistSlug = artistData?.slug || '';
  const artistTracks = artistData?.tracks || [];
  const artistStats = artistData?.stats || {};
  const artistBio = artistData?.bio || '';

  const { data: earningsData } = useSWR('/api/earnings', fetcher, swrConfig);

  const { data: activityData } = useSWR(
    artistProfile?.profile_slug ? `/api/artists/${artistProfile.profile_slug}/activity` : null,
    fetcher,
    swrConfig
  );

  // ─── Fetch artist submission counts ──────────────────────────
  useEffect(() => {
    if (!isArtist) return;
    fetch('/api/artist/submissions', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.submissions)) {
          setSubmissionCounts({
            total: d.submissions.length,
            pending: d.submissions.filter((s: any) => s.review_status === 'pending').length,
            approved: d.submissions.filter((s: any) => s.review_status === 'approved').length,
          });
        }
      })
      .catch(() => {});
  }, [isArtist]);

  // ─── Profile edit state ──────────────────────────────────────
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
    setBioChanged(false); // Optimistic: clear immediately

    // Optimistic: update the cached artist data immediately
    globalMutate(
      `/api/artist/me`,
      (prev: any) => prev ? {
        ...prev,
        artist: {
          ...prev.artist,
          bio: editBio,
          instagram_handle: editInstagram || null,
          tiktok_handle: editTiktok || null,
          genres: editGenres,
        },
        bio: editBio,
      } : prev,
      false // don't revalidate yet
    );

    try {
      const res = await fetch(`/api/artists/${artistSlug}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: editBio, instagram_handle: editInstagram || null,
          tiktok_handle: editTiktok || null, genres: editGenres,
        }),
      });
      if (res.ok) { addToast('Profile updated', 'success'); reloadArtist(); }
      else {
        // Revert optimistic update on failure
        globalMutate(`/api/artist/me`);
        const err = await res.json();
        addToast(err.error || 'Failed to save', 'error');
        // Re-enable save button by reverting bioChanged
        setBioChanged(true);
      }
    } catch {
      globalMutate(`/api/artist/me`);
      addToast('Network error', 'error');
      setBioChanged(true);
    }
    setSaving(false);
  };

  // ─── Track import state ──────────────────────────────────────
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualAdding, setManualAdding] = useState(false);

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true); setImportResult(null);
    try {
      const res = await fetch('/api/artist/import-tracks', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: importUrl.trim() }) });
      const data = await res.json();
      setImportResult(data);
      if (data.ok) { addToast(data.message || 'Tracks imported!', 'success'); reloadArtist(); reloadCampaigns(); }
    } catch { setImportResult({ error: 'Network error' }); addToast('Import failed', 'error'); }
    setImporting(false);
  };

  const handleAddManualTrack = async () => {
    if (!manualTitle.trim() || !artistSlug) return;
    setManualAdding(true);
    try {
      const res = await fetch(`/api/artists/${artistSlug}/tracks`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: manualTitle.trim(), spotify_url: manualUrl.trim() || null, cpm_rate_cents: 10 }) });
      if (res.ok) { addToast('Track added!', 'success'); setManualTitle(''); setManualUrl(''); reloadArtist(); reloadCampaigns(); }
      else { const err = await res.json(); addToast(err.error || 'Failed to add track', 'error'); }
    } catch { addToast('Network error', 'error'); }
    setManualAdding(false);
  };

  // ─── Computed stats ──────────────────────────────────────────
  const totalViews = rawCampaigns.reduce((s: number, c: any) => s + parseInt(c.total_verified_views || '0'), 0);
  const totalSpent = rawCampaigns.reduce((s: number, c: any) => s + ((c.total_budget_cents || 0) - (c.budget_remaining_cents || 0)), 0);
  const totalSubmissions = rawCampaigns.reduce((s: number, c: any) => s + parseInt(c.approved_submissions || '0'), 0);
  const activeCount = rawCampaigns.filter((c: any) => c.status === 'active').length;

  const formatViews = (v: number) => {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return String(v);
  };
  const formatDollars = (c: number) => `$${(c / 100).toFixed(0)}`;

  // ─── CSV Export ──────────────────────────────────────────────
  const exportCSV = useCallback((data: any[], filename: string, columns: string[]) => {
    if (!data.length) { addToast('No data to export', 'info'); return; }
    const header = columns.join(',');
    const rows = data.map(row =>
      columns.map(col => {
        const val = row[col] !== undefined ? row[col] : '';
        return typeof val === 'string' && (val.includes(',') || val.includes('"'))
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
    addToast(`Exported ${data.length} rows`, 'success');
  }, [addToast]);

  // ─── Tabs ────────────────────────────────────────────────────
  const tabs: TabDef[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: isArtist ? 'tracks' : 'submissions', label: isArtist ? 'Campaigns' : 'Submissions', icon: Megaphone, badge: isArtist && activeCount > 0 ? activeCount : undefined },
    // Profile tab removed — moved to /settings
    { id: 'earnings', label: 'Balance', icon: DollarSign },
  ];

  // Sparkline data for KPIs (weekly breakdown)
  const viewSparklines = rawCampaigns.map((c: any) => ({ value: parseInt(c.total_verified_views || '0') }));
  const subSparklines = rawCampaigns.map((c: any) => ({ value: parseInt(c.approved_submissions || '0') }));

  // Content area padding depends on sidebar
  const mainPadding = 'md:ml-56';

  return (
    <div className="min-h-screen bg-[#0F0F23]">
      {/* Use TopNav on mobile, sidebar on desktop handles nav */}
      <div className="md:hidden">
        <Header />
      </div>

      <DashboardSidebar
        tabs={tabs}
        activeTab={tab}
        onTabChange={(id) => switchTab(id as TabId)}
        isArtist={isArtist}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className={`transition-all duration-300 pb-20 md:pb-0 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-56'}`}>
        <div className="max-w-6xl mx-auto px-3 md:px-6 py-3 md:py-6 overflow-x-hidden">
          {/* Welcome header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start md:items-center justify-between mb-6 gap-3"
          >
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold tracking-tight truncate" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
                {displayName ? `Welcome back, ${displayName.split(' ')[0]}` : 'Dashboard'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/[0.08] text-primary font-medium capitalize">
                  {profile?.user_type || 'creator'}
                </span>
                {artistSlug && (
                  <a href={`/artist/${artistSlug}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                    View public profile <ArrowUpRight size={10} />
                  </a>
                )}
              </div>
            </div>
            {isArtist && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={() => window.location.href = '/settings'} size="sm" className="shadow-lg shadow-primary/20">
                  <Plus size={16} className="mr-1" /> Import track
                </Button>
              </motion.div>
            )}
          </motion.div>

          {/* ── Animating content area ─────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {/* TikTok connection banner — always visible at the top */}
              <div className="mb-6">
                <TikTokTab />
              </div>

              {/* Creator stats — for creator-type accounts, above tabs */}
              {!isArtist && <CreatorStats />}

              {tab === 'overview' && (
                <div className="space-y-6">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {isArtist ? (
                      <>
                        <AnimatedKPICard
                          icon={Music} label="Active campaigns" value={String(activeCount)}
                          color="primary" trend={activeCount > 0 ? `${activeCount} active` : undefined}
                          trendDirection={activeCount > 0 ? 'up' : 'neutral'}
                          sparkline={viewSparklines}
                          onClick={() => switchTab('tracks')}
                        />
                        <AnimatedKPICard
                          icon={Video} label="Submissions" value={String(submissionCounts.total || totalSubmissions)}
                          color="amber"
                          sublabel={submissionCounts.approved > 0 ? `${submissionCounts.approved} approved` : submissionCounts.pending > 0 ? `${submissionCounts.pending} pending` : undefined}
                          trend={submissionCounts.pending > 0 ? `${submissionCounts.pending} to review` : undefined}
                          trendDirection={submissionCounts.pending > 0 ? 'up' : 'neutral'}
                          sparkline={subSparklines}
                          onClick={() => switchTab('tracks')}
                        />
                        <AnimatedKPICard
                          icon={TrendingUp} label="Views" value={formatViews(totalViews)}
                          color="indigo"
                          sparkline={rawCampaigns.map((c: any) => ({ value: parseInt(c.total_verified_views || '0') }))}
                        />
                        <AnimatedKPICard
                          icon={Wallet} label="Balance" value={formatDollars(artistData?.balance_cents || 0)}
                          color="emerald"
                          sublabel={artistData?.pending_payouts_cents > 0 ? `${formatDollars(artistData.pending_payouts_cents)} pending` : undefined}
                          onClick={() => switchTab('earnings')}
                        />
                      </>
                    ) : (
                      <>
                        <AnimatedKPICard icon={Video} label="Submissions" value={String(earningsData?.submissions?.length || 0)} color="amber" />
                        <AnimatedKPICard icon={DollarSign} label="Total earned" value={formatDollars(earningsData?.totalEarned || 0)} color="emerald" />
                        <AnimatedKPICard icon={Check} label="Paid out" value={formatDollars(earningsData?.totalPaid || 0)} color="indigo" />
                        <AnimatedKPICard icon={Clock} label="Pending" value={formatDollars(earningsData?.totalPending || 0)} color="rose" />
                      </>
                    )}
                  </div>

                  {/* Quick action card */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <Card className="border-primary/10 bg-gradient-to-br from-primary/[0.03] to-transparent overflow-hidden relative">
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/[0.04] rounded-full blur-3xl pointer-events-none" />
                      <CardContent className="p-5 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/[0.08] flex items-center justify-center">
                            <Sparkles size={18} className="text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {isArtist
                                ? artistTracks.length > 0
                                  ? `${activeCount} campaign${activeCount !== 1 ? 's' : ''} in your catalog`
                                  : 'Add your first campaign to get started'
                                : 'Browse artists and start creating content'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {isArtist
                                ? 'Import more tracks from Spotify, Bandcamp, or Deezer'
                                : 'Find artists that match your style and earn per verified view'}
                            </p>
                          </div>
                        </div>
                        {isArtist && artistTracks.length === 0 && (
                          <Button size="sm" onClick={() => window.location.href = '/settings'} className="shrink-0 ml-3">Add tracks</Button>
                        )}
                        {!isArtist && (
                          <a href="/browse"><Button size="sm" className="shrink-0 ml-3">Browse artists</Button></a>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Views chart + funnel */}
                  <ViewsChart
                    campaigns={rawCampaigns}
                    isArtist={isArtist}
                    totalViews={totalViews}
                    totalSubmissions={submissionCounts.total || totalSubmissions}
                    totalApproved={submissionCounts.approved || rawCampaigns.reduce((s: number, c: any) => s + parseInt(c.approved_submissions || '0'), 0)}
                    totalSpent={totalSpent}
                  />

                  {/* Submissions inbox — artist only */}
                  {isArtist && <SubmissionsInbox artistSlug={artistSlug} />}

                  {/* Payout setup — creators without Stripe Connect */}
                  {!isArtist && profile && !profile?.stripe_connect_id && (
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-500/[0.04] to-green-500/[0.02] border border-emerald-500/10 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold flex items-center gap-2">
                            <Wallet size={14} className="text-emerald-400" />
                            Set up payouts
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Connect your bank account to receive earnings from approved videos.</p>
                        </div>
                        <button onClick={async () => {
                          try {
                            const res = await fetch('/api/stripe/connect', { method: 'POST', credentials: 'include' });
                            const d = await res.json();
                            if (d.url) window.location.href = d.url;
                          } catch {}
                        }}
                          className="text-[10px] px-3 py-2 rounded-lg bg-primary text-white font-semibold shrink-0 hover:opacity-90 transition-all">
                          Set up payouts
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Leaderboard snippet */}
                  {!isArtist && (
                    <a href="/earnings" className="block rounded-2xl bg-gradient-to-br from-amber-500/[0.04] to-orange-500/[0.02] border border-amber-500/10 p-5 hover:border-amber-500/20 transition-all group">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Trophy size={14} className="text-amber-400" />
                          Creator Leaderboard
                        </h3>
                        <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        See how you rank against other creators. Top earners, streaks, and achievements.
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-400 font-medium">All Time</span>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-white/[0.04] text-muted-foreground">This Month</span>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-white/[0.04] text-muted-foreground">This Week</span>
                      </div>
                    </a>
                  )}

                  {/* Activity + Bug reports + Referral — 2-col on desktop */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Activity */}
                    {isArtist && artistSlug && (
                      <Card className="md:col-span-1">
                        <CardContent className="p-5">
                          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <TrendingUp size={14} className="text-primary" />
                            Recent activity
                          </h3>
                          {activityData?.events?.length > 0 ? (
                            <div className="space-y-2">
                              {activityData.events.slice(0, 5).map((e: any, i: number) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className="flex items-center gap-2 text-xs text-muted-foreground"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                                  <span className="capitalize">{e.event_type?.replace(/_/g, ' ')}</span>
                                  <span className="text-muted-foreground/50">· {new Date(e.created_at).toLocaleDateString()}</span>
                                </motion.div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground/50">No recent activity yet.</p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Bug reports */}
                    <BugReportsSection />

                    {/* Referral */}
                    {profile && <ReferralSection userId={profile.id} email={profile.email || ''} />}
                  </div>
                </div>
              )}

              {(tab === 'tracks' || tab === 'submissions') && (
                <TracksTab
                  isArtist={isArtist}
                  campaigns={rawCampaigns}
                  campaignsLoading={campaignsLoading}
                  campaignsErr={campaignsErr}
                  reloadCampaigns={reloadCampaigns}
                  earningsData={earningsData}
                  formatViews={formatViews}
                  formatDollars={formatDollars}
                  activeCount={activeCount}
                  totalViews={totalViews}
                  totalSubmissions={totalSubmissions}
                  totalSpent={totalSpent}
                  onSwitchTab={switchTab}
                  router={router}
                  exportCSV={exportCSV}
                />
              )}

              {/* Kanban tab removed */}

              {/* Profile tab removed — moved to /settings */}

              {tab === 'earnings' && (
                <EarningsTab
                  isArtist={isArtist}
                  artistData={artistData}
                  formatDollars={formatDollars}
                  artistSlug={artistSlug}
                  rawCampaigns={rawCampaigns}
                  totalSpent={totalSpent}
                  earningsData={earningsData}
                  exportCSV={exportCSV}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {wizardOpen && <CampaignWizard open={wizardOpen} onClose={() => setWizardOpen(false)} onCreated={() => reloadCampaigns()} />}
        </div>
      </main>
    </div>
  );
}

// ── SUB-TABS ─────────────────────────────────────────────────────

function TracksTab({
  isArtist, campaigns, campaignsLoading, campaignsErr, reloadCampaigns,
  earningsData, formatViews, formatDollars, activeCount, totalViews,
  totalSubmissions, totalSpent, onSwitchTab, router, exportCSV,
}: any) {
  return (
    <div className="space-y-4">
      {/* Onboarding progress for new users */}
      {isArtist && campaigns.length === 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-primary/[0.04] to-transparent border border-primary/10 p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            Get started in 2 steps
          </h3>
          <div className="space-y-2">
            {[
              { label: 'Import your music', desc: 'Connect Spotify or add tracks manually', done: false },
              { label: 'Set your first budget', desc: 'Fund your campaign and set CPM', done: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02]">
                <div className="w-6 h-6 rounded-full bg-primary/[0.08] flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">{step.label}</p>
                  <p className="text-[9px] text-muted-foreground/50">{step.desc}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.location.href = '/settings'}
                  className="text-[10px] h-7 px-3">
                  {i === 0 ? 'Import' : 'Add funds'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isArtist ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Active', value: activeCount, icon: Zap, color: 'emerald' as const },
              { label: 'Submissions', value: totalSubmissions, icon: Video, color: 'amber' as const },
              { label: 'Views', value: formatViews(totalViews), icon: TrendingUp, color: 'indigo' as const },
              { label: 'Spent', value: formatDollars(totalSpent), icon: DollarSign, color: 'rose' as const },
            ].map((s, i) => (
              <AnimatedKPICard key={i} icon={s.icon} label={s.label} value={String(s.value)} color={s.color} />
            ))}
          </div>

          {/* Export controls */}
          {campaigns.length > 0 && (
            <div className="flex justify-end">
              <button onClick={() => exportCSV(
                campaigns.map((c: any) => ({
                  track: c.track_title,
                  status: c.status,
                  cpm: `$${((c.cpm_rate_cents || 0) / 100).toFixed(2)}`,
                  budget: `$${((c.total_budget_cents || 0) / 100).toFixed(0)}`,
                  spent: formatDollars((c.total_budget_cents || 0) - (c.budget_remaining_cents || 0)),
                  submissions: c.approved_submissions || 0,
                  views: c.total_verified_views || 0,
                })),
                `selah-tracks-${new Date().toISOString().slice(0, 10)}`,
                ['track', 'status', 'cpm', 'budget', 'spent', 'submissions', 'views']
              )}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/[0.04] transition-all active:scale-95"
              >
                <Download size={12} /> Export CSV
              </button>
            </div>
          )}

          {campaignsLoading ? (
            <div className="grid md:grid-cols-2 gap-4">{[1, 2].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
          ) : campaignsErr ? (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
              Failed to load campaigns. <button onClick={() => reloadCampaigns()} className="text-primary hover:underline">Retry</button>
            </CardContent></Card>
          ) : campaigns.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <Megaphone size={32} className="mx-auto mb-3 text-muted-foreground/20" />
              <p className="text-sm font-medium mb-1">No campaigns yet</p>
              <p className="text-xs text-muted-foreground mb-4">Create your first campaign to start promoting your music.</p>
              <Button onClick={() => window.location.href = '/settings'} size="sm"><Plus size={14} className="mr-1" /> Import music</Button>
            </CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {campaigns.map((c: any, i: number) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <Card className="overflow-hidden cursor-pointer hover:border-primary/20 transition-colors group"
                    onClick={() => router.push(`/c/${c.slug || c.id}/edit`)}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate flex items-center gap-2">
                            <Music size={14} className="text-primary/60 shrink-0" />
                            {c.track_title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            ${((c.cpm_rate_cents || 0) / 100).toFixed(2)} CPM · ${((c.total_budget_cents || 0) / 100).toFixed(0)} budget
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={async (e) => {
                            e.stopPropagation();
                            const nextStatus = c.status === 'active' ? 'cancelled' : 'active';
                            try {
                              const res = await fetch(`/api/campaigns/${c.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
                              if (res.ok) reloadCampaigns();
                            } catch {}
                          }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 hover:brightness-125 border"
                            style={{ color: c.status === 'active' ? '#EF4444' : '#22C55E', background: c.status === 'active' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', borderColor: c.status === 'active' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)' }}>
                            {c.status === 'active' ? 'Pause' : 'Activate'}
                          </button>
                          <button onClick={e => { e.stopPropagation(); window.open(`/c/${c.slug || c.id}`, '_blank'); }}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95 hover:bg-white/[0.08] border border-white/[0.08]"
                            style={{ color: '#A09B92' }}>
                            <ExternalLink size={12} className="inline mr-1" /> View
                          </button>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-muted-foreground'
                          }`}>
                            {c.status === 'active' ? 'Live' : c.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        <div><p className="font-bold text-sm">{c.approved_submissions || 0}</p><span className="text-[9px] text-muted-foreground/50">subs</span></div>
                        <div><p className="font-bold text-sm">{formatViews(parseInt(c.total_verified_views || '0'))}</p><span className="text-[9px] text-muted-foreground/50">views</span></div>
                        <div><p className="font-bold text-sm">{formatDollars((c.total_budget_cents || 0) - (c.budget_remaining_cents || 0))}</p><span className="text-[9px] text-muted-foreground/50">spent</span></div>
                      </div>
                      {/* Budget bar */}
                      <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary/30 transition-all"
                          style={{ width: `${Math.min(((c.total_budget_cents || 0) - (c.budget_remaining_cents || 0)) / (c.total_budget_cents || 1) * 100, 100)}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Creator submissions view — upgraded */
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Video size={14} className="text-primary" />
                Your submissions
              </h3>
              <a href="/browse"><Button size="sm"><Plus size={14} className="mr-1" /> Browse campaigns</Button></a>
            </div>
            {earningsData?.submissions?.length > 0 ? (
              <div className="space-y-2">
                {earningsData.submissions.map((s: any) => (
                  <motion.div key={s.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.track_title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {s.platform} · {new Date(s.submitted_at).toLocaleDateString()} · {(s.views_verified || 0).toLocaleString()} views
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold">{formatDollars(s.payout_amount_cents || 0)}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        s.payout_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                        s.review_status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                        s.review_status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {s.payout_status === 'paid' ? 'Paid' : s.review_status === 'approved' ? 'Approved' : s.review_status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                      {s.review_status === 'rejected' && s.dispute_status !== 'pending' && s.dispute_status !== 'under_review' && (
                        <div className="mt-1"><DisputeButton submissionId={s.id} /></div>
                      )}
                    </div>
                  </motion.div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* KanbanTab removed */

function ProfileTab({
  isArtist, artistProfile, displayName, artistSlug,
  editBio, setEditBio, editInstagram, setEditInstagram,
  editTiktok, setEditTiktok, editGenres, setEditGenres,
  bioChanged, setBioChanged, saving, saveProfile,
  importUrl, setImportUrl, importing, importResult, handleImport,
  manualTitle, setManualTitle, manualUrl, setManualUrl,
  manualAdding, handleAddManualTrack, profile,
}: any) {
  return (
    <div className="max-w-2xl space-y-6">
      {isArtist ? (
        artistProfile ? (
          <>
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/[0.06] flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden ring-1 ring-white/[0.06]">
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

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Bio</label>
                  <textarea value={editBio} onChange={e => { setEditBio(e.target.value); setBioChanged(true); }}
                    rows={4} placeholder="Tell the world about your music... "
                    className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:border-primary/30 transition-colors" />
                  <p className="text-[10px] text-muted-foreground/40 mt-1">{editBio.length}/500 characters</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium flex items-center gap-1">
                      <Camera size={12} /> Instagram
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">@</span>
                      <input value={editInstagram} onChange={e => { setEditInstagram(e.target.value); setBioChanged(true); }}
                        placeholder="handle" className="pl-7 text-sm w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block font-medium flex items-center gap-1">
                      <Music2 size={12} /> TikTok
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">@</span>
                      <input value={editTiktok} onChange={e => { setEditTiktok(e.target.value); setBioChanged(true); }}
                        placeholder="handle" className="pl-7 text-sm w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 transition-colors" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Genres</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Pop', 'Hip-Hop', 'Electronic', 'Rock', 'Indie', 'R&B', 'Jazz', 'Classical', 'Country', 'Metal', 'Folk', 'Soul'].map(g => {
                      const sel = editGenres.includes(g);
                      return (
                        <button key={g} type="button" onClick={() => { setEditGenres((prev: string[]) => sel ? prev.filter((x: string) => x !== g) : [...prev, g]); setBioChanged(true); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-95 ${
                            sel ? 'border-primary bg-primary/[0.08] text-primary' : 'border-white/[0.06] text-muted-foreground hover:border-white/[0.12]'
                          }`}>
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={saveProfile} disabled={saving || !bioChanged} className="flex items-center gap-2">
                      {saving ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                      {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                  </motion.div>
                  {!bioChanged && <span className="text-xs text-muted-foreground/50">No unsaved changes</span>}
                </div>
              </CardContent>
            </Card>

            {/* Import tracks */}
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-xs font-semibold flex items-center gap-2">
                  <Music size={14} className="text-primary" />
                  Import tracks
                </h3>
                <p className="text-[11px] text-muted-foreground">Paste your Spotify, Bandcamp, or Deezer profile link to auto-import your tracks.</p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input value={importUrl} onChange={e => setImportUrl(e.target.value)}
                      placeholder="https://open.spotify.com/artist/..."
                      className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 transition-colors"
                      onKeyDown={e => e.key === 'Enter' && handleImport()} />
                    <button onClick={handleImport} disabled={importing || !importUrl.trim()}
                      className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-all flex items-center gap-1.5 shrink-0">
                      {importing ? <><LoaderCircle size={14} className="animate-spin" /> Scanning</> : 'Import'}
                    </button>
                  </div>
                  {importResult && (
                    <div className={`text-xs p-3 rounded-lg ${importResult.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {importResult.ok ? `✅ ${importResult.message || 'Imported!'}` : importResult.error || 'Import failed'}
                    </div>
                  )}
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground/50 hover:text-muted-foreground text-[11px] transition-colors">
                      Or add a track manually →
                    </summary>
                    <div className="flex gap-2 mt-2">
                      <input value={manualTitle} onChange={e => setManualTitle(e.target.value)}
                        placeholder="Track name"
                        className="flex-1 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 transition-colors"
                        onKeyDown={e => e.key === 'Enter' && handleAddManualTrack()} />
                      <button onClick={handleAddManualTrack} disabled={manualAdding || !manualTitle.trim()}
                        className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-all shrink-0">
                        {manualAdding ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                    <input value={manualUrl} onChange={e => setManualUrl(e.target.value)}
                      placeholder="Spotify URL (optional)"
                      className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 transition-colors mt-1" />
                  </details>
                  <p className="text-[9px] text-muted-foreground/40">Supports: Spotify artist links, Bandcamp pages, Deezer artist profiles. Max 20 tracks.</p>
                </div>
              </CardContent>
            </Card>

            {artistSlug && <ArtistEmbed artistSlug={artistSlug} artistName={artistProfile.artist_name || displayName} />}
          </>
        ) : (
          <Card><CardContent className="p-8 text-center">
            <User size={32} className="mx-auto mb-3 text-muted-foreground/20" />
            <p className="text-sm font-medium mb-1">No artist profile yet</p>
            <p className="text-xs text-muted-foreground mb-4">Create your artist profile to start managing your music.</p>
            <a href="/onboarding?role=artist"><Button size="sm">Create artist profile</Button></a>
          </CardContent></Card>
        )
      ) : (
        <Card><CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center text-lg font-bold ring-1 ring-white/[0.06]">
              {displayName[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="font-bold">{displayName}</h2>
              <p className="text-xs text-muted-foreground">Creator · {profile?.email}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">You're registered as a creator. Browse campaigns, create content, and earn per verified view.</p>
          <a href="/browse"><Button size="sm">Browse campaigns</Button></a>
        </CardContent></Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TIKTOK TAB
// ═══════════════════════════════════════════════════════════
function CreatorStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/creator/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mb-6 animate-pulse">
        <div className="h-24 rounded-2xl bg-white/[0.02]" />
      </div>
    );
  }
  if (!stats) return null;

  const items = [
    { label: 'Connected', value: stats.connections.toString(), suffix: 'account' + (stats.connections !== 1 ? 's' : '') },
    { label: 'Followers', value: stats.followerCount >= 1000 ? (stats.followerCount / 1000).toFixed(0) + 'K' : stats.followerCount.toString(), suffix: 'followers' },
    { label: 'Posts', value: stats.totalPosts.toString(), suffix: 'post' + (stats.totalPosts !== 1 ? 's' : '') },
    { label: 'Views', value: stats.totalViews >= 1000 ? (stats.totalViews / 1000).toFixed(1) + 'K' : stats.totalViews.toString(), suffix: 'views' },
    { label: 'Avg views', value: stats.avgViews >= 1000 ? (stats.avgViews / 1000).toFixed(0) + 'K' : stats.avgViews.toString(), suffix: 'per post' },
  ];

  return (
    <div className="mb-6 rounded-2xl overflow-hidden" style={{background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)'}}>
      <div className="p-5">
        <h3 className="text-sm font-semibold mb-4" style={{color: '#F4F1EA'}}>My stats</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {items.map(item => (
            <div key={item.label} className="text-center">
              <p className="text-2xl font-bold" style={{color: '#F4F1EA'}}>{item.value}</p>
              <p className="text-xs mt-0.5" style={{color: '#6B6760'}}>
                {item.label}
                <span className="text-[9px] ml-1" style={{color: '#6B6760', opacity: 0.5}}>{item.suffix}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TikTokTab() {
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch('/api/platform/connections', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const tiktok = d.connections?.find((c: any) => c.platform === 'tiktok');
        setConnection(tiktok || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const disconnect = async () => {
    if (!confirm('Disconnect your TikTok account?')) return;
    setDisconnecting(true);
    try {
      await fetch('/api/platform/connections', {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'tiktok' }),
      });
      setConnection(null);
    } catch {}
    setDisconnecting(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-lg">
        <div className="h-8 w-40 rounded-xl bg-white/[0.03]" />
        <div className="h-48 rounded-2xl bg-white/[0.02]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {connection ? (
        /* ── Connected state ── */
        <div className="rounded-2xl border overflow-hidden" style={{borderColor: 'rgba(34,197,94,0.15)', background: 'rgba(34,197,94,0.03)'}}>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{background: 'rgba(34,197,94,0.1)'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#22C55E"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.45-1.04 1.16-1.18 1.89-.07.35-.13.82-.07 1.17.19 1.14 1.21 2.1 2.39 1.99.76-.04 1.47-.45 1.87-1.1.14-.23.23-.49.24-.76.05-1.52.02-3.04.03-4.56z"/></svg>
              </div>
              <div>
                <p className="font-semibold text-sm" style={{color: '#F4F1EA'}}>{connection.platform_username || 'Connected'}</p>
                <p className="text-[10px]" style={{color: '#22C55E'}}>✓ Verified · {connection.role === 'artist' ? 'Artist' : 'Creator'}</p>
              </div>
            </div>

            <p className="text-[10px]" style={{color: '#6B6760'}}>Connected. Your TikTok account is linked and automatically stays verified.</p>

            <button onClick={disconnect} disabled={disconnecting}
              className="w-full py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.98]"
              style={{background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.15)'}}>
              {disconnecting ? 'Disconnecting...' : 'Disconnect TikTok'}
            </button>
          </div>
        </div>
      ) : (
        /* ── Not connected — prominent CTA ── */
        <div className="rounded-2xl border overflow-hidden" style={{borderColor: 'rgba(214,168,95,0.15)', background: 'rgba(214,168,95,0.03)'}}>
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{background: 'rgba(255,255,255,0.04)'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.45-1.04 1.16-1.18 1.89-.07.35-.13.82-.07 1.17.19 1.14 1.21 2.1 2.39 1.99.76-.04 1.47-.45 1.87-1.1.14-.23.23-.49.24-.76.05-1.52.02-3.04.03-4.56z"/></svg>
              </div>
              <div>
                <p className="font-semibold text-sm" style={{color: '#F4F1EA'}}>Connect your TikTok</p>
                <p className="text-[10px]" style={{color: '#6B6760'}}>One click · Read-only · We never post</p>
              </div>
            </div>

            <div className="space-y-2 text-xs" style={{color: '#8B887E'}}>
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                Verify your identity as the real artist or creator
              </div>
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                Auto-verify video views for accurate payouts
              </div>
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                Show your follower count and TikTok profile link
              </div>
            </div>

            <a href="/api/auth/tiktok/connect"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] hover:-translate-y-0.5"
              style={{background: 'linear-gradient(135deg, #D6A85F, #C9974D)'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.45-1.04 1.16-1.18 1.89-.07.35-.13.82-.07 1.17.19 1.14 1.21 2.1 2.39 1.99.76-.04 1.47-.45 1.87-1.1.14-.23.23-.49.24-.76.05-1.52.02-3.04.03-4.56z"/></svg>
              Connect TikTok
            </a>

            <p className="text-[10px] text-center" style={{color: '#6B6760', opacity: 0.5}}>
              We only request read access. We never post content.
            </p>
          </div>
        </div>
      )}

      {/* Info box removed — this is a banner now */}
    </div>
  );
}

function EarningsTab({ isArtist, artistData, formatDollars, artistSlug, rawCampaigns, totalSpent, earningsData, exportCSV }: any) {
  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="p-6">
          {isArtist ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Balance</h3>
                {artistData?.transactions?.length > 0 && (
                  <button onClick={() => exportCSV(
                    (artistData.transactions || []).map((t: any) => ({
                      date: new Date(t.created_at || t.date).toLocaleDateString(),
                      type: t.type,
                      description: t.description || '',
                      amount: `$${(Math.abs(t.amount_cents) / 100).toFixed(2)}`,
                    })),
                    `selah-transactions-${new Date().toISOString().slice(0, 10)}`,
                    ['date', 'type', 'description', 'amount']
                  )}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/[0.04] transition-all active:scale-95"
                  >
                    <Download size={12} /> CSV
                  </button>
                )}
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-primary/[0.04] to-emerald-500/[0.02] border border-primary/10 p-6 text-center relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/[0.04] rounded-full blur-3xl pointer-events-none" />
                <p className="text-4xl font-bold relative z-10">{formatDollars(artistData?.balance_cents || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1 relative z-10">
                  {artistData?.pending_payouts_cents > 0 ? `${formatDollars(artistData.pending_payouts_cents)} pending in submissions` : 'Available for creator payouts'}
                </p>
                <div className="flex items-center justify-center gap-3 mt-4 relative z-10">
                  <Link href={`/checkout?type=donation&artistSlug=${artistSlug}`}>
                    <Button size="sm"><Plus size={14} className="mr-1" /> Add funds</Button>
                  </Link>
                </div>
              </div>

              {/* Connected Platforms — moved to dedicated TikTok tab */}

              {artistData?.transactions?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium mt-4 mb-2">Recent transactions</p>
                  {artistData.transactions.slice(0, 10).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 ${t.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type === 'deposit' ? '+' : '-'}</span>
                        <span className="truncate text-muted-foreground">{t.description || t.type}</span>
                      </div>
                      <span className="font-medium shrink-0 ml-2">{t.type === 'deposit' ? '+' : '-'}${(Math.abs(t.amount_cents) / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 pt-2">
                {[
                  { label: 'Total deposited', value: formatDollars(rawCampaigns.reduce((s: number, c: any) => s + (c.total_budget_cents || 0), 0)) },
                  { label: 'Spent', value: formatDollars(totalSpent) },
                  { label: 'Remaining', value: formatDollars(rawCampaigns.reduce((s: number, c: any) => s + (c.budget_remaining_cents || 0), 0)) },
                  { label: 'Platform fees', value: formatDollars(Math.round(totalSpent * 0.1667)) },
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
                  { label: 'Monthly projection', value: formatDollars((earningsData?.totalEarned || 0) > 0 ? Math.round((earningsData.totalEarned || 0) * 2) : 0) },
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
        </CardContent>
      </Card>
    </div>
  );
}

// ── SUBMISSIONS INBOX ────────────────────────────────────────────
function SubmissionsInbox({ artistSlug }: { artistSlug: string }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadSubs = () => {
    fetch('/api/artist/submissions', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.submissions)) setSubs(d.submissions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(loadSubs, []);

  const handleReview = async (submissionId: string, action: 'approve' | 'reject') => {
    if (!submissionId) return;
    setReviewing(submissionId);
    try {
      const res = await fetch('/api/artist/submissions', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, action, feedback: feedback.trim() || null }),
      });
      const data = await res.json();
      if (data.ok) {
        addToast(action === 'approve' ? 'Submission approved!' : 'Submission rejected', 'success');
        setFeedback('');
        setShowFeedback(null);
        loadSubs();
      } else {
        addToast(data.error || 'Failed to review', 'error');
      }
    } catch {
      addToast('Network error', 'error');
    }
    setReviewing(null);
  };

  const pendingSubs = subs.filter(s => s.review_status === 'pending');
  const recentSubs = subs.slice(0, 10);

  if (loading) {
    return (
      <Card><CardContent className="p-5"><div className="flex items-center gap-3">
        <LoaderCircle size={14} className="animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Loading submissions...</span>
      </div></CardContent></Card>
    );
  }
  if (subs.length === 0) return null;

  return (
    <Card className={pendingSubs.length > 0 ? 'border-amber-500/20 ring-1 ring-amber-500/10' : ''}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Film size={14} className={pendingSubs.length > 0 ? 'text-amber-400' : 'text-primary'} />
            Submissions{` (${subs.length})`}
            {pendingSubs.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold"
              >
                {pendingSubs.length} pending
              </motion.span>
            )}
          </h3>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {recentSubs.map((s: any) => (
            <div key={s.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2 hover:bg-white/[0.04] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium truncate">{s.track_title || 'Track'}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    by{' '}
                    <button onClick={() => window.open(`/messages?user=${s.creator_id}`, '_blank')}
                      className="text-foreground/60 hover:text-primary underline underline-offset-2 transition-colors">
                      {s.creator_name || 'Creator'}
                    </button>
                    {s.platform ? ` · ${s.platform}` : ''}
                    {s.content_url && (
                      <a href={s.content_url} target="_blank" rel="noopener noreferrer"
                        className="ml-1.5 text-primary/60 hover:text-primary underline underline-offset-2 transition-colors">
                        View video →
                      </a>
                    )}
                  </p>
                  {s.review_feedback && (
                    <div className="mt-1 text-[9px] text-muted-foreground/50 italic bg-white/[0.02] px-2 py-1 rounded">
                      "{s.review_feedback}"
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {s.views_verified > 0 && (
                    <p className="text-xs font-mono">{parseInt(s.views_verified).toLocaleString()} views</p>
                  )}
                  <p className="text-xs font-bold text-emerald-400">
                    {s.payout_amount_cents ? `$${(s.payout_amount_cents/100).toFixed(2)}` : '—'}
                  </p>
                  {s.review_status === 'pending' ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Pending</span>
                  ) : s.review_status === 'approved' ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Approved</span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400">Rejected</span>
                  )}
                </div>
              </div>

              {/* Review actions */}
              {s.review_status === 'pending' && (
                <div className="space-y-2 pt-1">
                  {showFeedback === s.id && (
                    <textarea
                      value={showFeedback === s.id ? feedback : ''}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="Optional feedback for the creator..."
                      rows={2}
                      className="w-full text-[10px] rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:border-primary/30"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={reviewing === s.id}
                      onClick={() => { setShowFeedback(s.id === showFeedback ? null : s.id); setFeedback(''); }}
                      className="text-[9px] px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground transition-colors disabled:opacity-40"
                    >
                      {showFeedback === s.id ? 'Hide feedback' : 'Add feedback'}
                    </motion.button>
                    <div className="flex gap-1.5 ml-auto">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={reviewing === s.id}
                        onClick={() => handleReview(s.id, 'approve')}
                        className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors disabled:opacity-40 flex items-center gap-1"
                      >
                        {reviewing === s.id ? <LoaderCircle size={10} className="animate-spin" /> : <Check size={10} />}
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={reviewing === s.id}
                        onClick={() => handleReview(s.id, 'reject')}
                        className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors disabled:opacity-40 flex items-center gap-1"
                      >
                        <X size={10} />
                        Reject
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {subs.length > 10 && (
          <p className="text-[10px] text-center text-muted-foreground/40 pt-3">
            +{subs.length - 10} more submission{subs.length - 10 !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── BUG REPORTS ──────────────────────────────────────────────────
function BugReportsSection() {
  const [bugs, setBugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bugs', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setBugs(d); })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading || bugs.length === 0) return null;

  return (
    <Card className="md:col-span-1">
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Bug size={14} className="text-rose-400" />
          Bug reports
        </h3>
        <div className="space-y-2">
          {bugs.slice(0, 5).map((bug: any) => (
            <div key={bug.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/[0.02]">
              <span className="truncate text-muted-foreground flex-1">{bug.description.slice(0, 60)}{bug.description.length > 60 ? '...' : ''}</span>
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
        </div>
      </CardContent>
    </Card>
  );
}

// ── REFERRAL ─────────────────────────────────────────────────────
function ReferralSection({ userId, email }: { userId: string; email: string }) {
  const { data: refData, mutate: reloadRef } = useSWR('/api/referral/code', fetcher, swrConfig);
  const [withdrawing, setWithdrawing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const loaded = !!refData;
  const referralCode = refData?.referral_code;
  const earningsCents = refData?.referrer_earnings_cents || 0;
  const pendingBonuses = refData?.pending_bonuses || 0;
  const totalPendingCents = refData?.total_pending_cents || 0;
  const referredUsers = refData?.referred_users || 0;
  const shareLink = referralCode ? `https://selah.fm/login?ref=${referralCode}` : '';

  const copy = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true); addToast('Referral link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => addToast('Failed to copy', 'error'));
  };

  const withdraw = async () => {
    if (withdrawing || totalPendingCents <= 0) return;
    setWithdrawing(true);
    try {
      const res = await fetch('/api/referral/withdraw', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount_cents: totalPendingCents }) });
      const data = await res.json();
      if (data.ok) { addToast(data.message || 'Referral earnings withdrawn!', 'success'); reloadRef(); }
      else { addToast(data.message || 'Failed to withdraw', 'error'); }
    } catch { addToast('Network error', 'error'); }
    setWithdrawing(false);
  };

  return (
    <Card className="md:col-span-1">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Heart size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Refer & earn</p>
            <p className="text-xs text-muted-foreground">You earn 5% of every first deposit they make. They get 5% too.</p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground/50">
            <span>Referral progress</span>
            <span>{referredUsers} / 10</span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all" style={{ width: Math.min(100, (referredUsers / 10) * 100) + '%' }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            <p className="text-lg font-bold text-emerald-400">${(earningsCents / 100).toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Earned</p>
          </div>
          <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
            <p className="text-lg font-bold">{referredUsers}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Referred</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!loaded ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-8 rounded-lg bg-white/[0.04] animate-pulse" />
              <div className="w-16 h-8 rounded-lg bg-white/[0.04] animate-pulse" />
            </div>
          ) : referralCode ? (
            <>
              <code className="flex-1 text-[10px] bg-white/[0.04] px-3 py-2 rounded-lg font-mono truncate">{shareLink}</code>
              <button onClick={copy}
                className="shrink-0 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors flex items-center gap-1 active:scale-95">
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground/50 text-center">No referral code yet — submit a video to get one</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
