'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Music, Heart, Video, ExternalLink, Plus, Trash2, ChevronUp, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { fetcher, swrConfig } from '@/lib/swr-config';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/Toast';
import ArtistEmbed from '@/components/ArtistEmbed';

export default function ArtistDashboardSection() {
  const { data: profileData } = useSWR('/api/auth/me', fetcher, swrConfig);
  const profile = profileData?.user || null;
  const [artistData, setArtistData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingTrack, setEditingTrack] = useState<string | null>(null);
  const [editCpm, setEditCpm] = useState('');
  const [addMode, setAddMode] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [addCpm, setAddCpm] = useState('10');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const loadArtist = () => {
    if (!profile?.display_name) { setLoading(false); return; }
    fetch(`/api/artist/search?q=${encodeURIComponent(profile.display_name)}&generate=false`)
      .then(r => r.json())
      .then(d => {
        if (d.artists?.length > 0) {
          fetch(`/api/artists/${d.artists[0].slug}`)
            .then(r => r.json())
            .then(ad => setArtistData(ad))
            .catch(() => {})
            .finally(() => setLoading(false));
        } else setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadArtist(); }, [profile?.display_name]);

  if (loading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!artistData?.artist) return null;

  const { artist, tracks, stats } = artistData;
  const slug = artist.profile_slug || '';

  const handleToggle = async (trackId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/artists/${slug}/tracks/${trackId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (res.ok) loadArtist();
    } catch {}
  };

  const handleSaveCpm = async (trackId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/artists/${slug}/tracks/${trackId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpm_rate_cents: parseInt(editCpm) }),
      });
      if (res.ok) {
        setEditingTrack(null);
        loadArtist();
        addToast('CPM updated', 'success');
      }
    } catch { addToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (trackId: string) => {
    if (!confirm('Remove this track from your catalog?')) return;
    try {
      const res = await fetch(`/api/artists/${slug}/tracks/${trackId}`, { method: 'DELETE' });
      if (res.ok) { loadArtist(); addToast('Track removed', 'success'); }
    } catch { addToast('Failed to delete', 'error'); }
  };

  const handleAdd = async () => {
    if (!addTitle.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/artists/${slug}/tracks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: addTitle.trim(), spotify_url: addUrl.trim() || null, cpm_rate_cents: parseInt(addCpm) || 10 }),
      });
      if (res.ok) {
        setAddMode(false); setAddTitle(''); setAddUrl(''); setAddCpm('10');
        loadArtist();
        addToast('Track added', 'success');
      }
    } catch { addToast('Failed to add', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Card className="mb-8 border-primary/10 bg-primary/[0.02]">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Music size={14} className="text-primary" />
              Your artist profile
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{artist.artist_name}</p>
          </div>
          <Link href={`/artist/${slug}`}
            className="text-xs text-primary hover:underline flex items-center gap-1">
            View profile <ExternalLink size={10} />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tracks', value: stats?.total_tracks || 0 },
            { label: 'Videos', value: stats?.total_submissions || 0 },
            { label: 'Views', value: stats?.total_views >= 1000 ? `${(stats.total_views / 1000).toFixed(1)}K` : stats?.total_views || 0 },
            { label: 'Donated', value: `$${((stats?.total_donations_cents || 0) / 100).toFixed(0)}` },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Track catalog + editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-medium">Your tracks</p>
            <button onClick={() => setAddMode(!addMode)}
              className="text-[10px] text-primary hover:underline flex items-center gap-1">
              {addMode ? <X size={12} /> : <Plus size={12} />}
              {addMode ? 'Cancel' : 'Add track'}
            </button>
          </div>

          {/* Add track form */}
          {addMode && (
            <div className="rounded-xl bg-white/[0.03] border border-primary/10 p-4 space-y-3 mb-3">
              <Input value={addTitle} onChange={e => setAddTitle(e.target.value)}
                placeholder="Track title" className="text-sm" />
              <Input value={addUrl} onChange={e => setAddUrl(e.target.value)}
                placeholder="Spotify URL (optional)" className="text-sm" />
              <div className="flex items-center gap-2">
                <label className="text-[10px] text-muted-foreground shrink-0">CPM ($/1M):</label>
                <Input type="number" min="1" value={addCpm} onChange={e => setAddCpm(e.target.value)}
                  className="text-sm w-24" />
                <Button size="sm" onClick={handleAdd} disabled={saving || !addTitle.trim()}
                  className="ml-auto">{saving ? 'Adding...' : 'Add'}</Button>
              </div>
            </div>
          )}

          {/* Track list */}
          {tracks && tracks.length > 0 ? (
            <div className="grid gap-1.5">
              {tracks.map((t: any) => {
                const isEditing = editingTrack === t.id;
                return (
                  <div key={t.id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${
                      t.enabled
                        ? 'bg-white/[0.02] border-white/[0.04]'
                        : 'bg-white/[0.01] border-white/[0.02] opacity-50'
                    }`}>
                    {/* Cover art */}
                    {t.cover_art_url ? (
                      <img src={t.cover_art_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-white/[0.04] flex items-center justify-center shrink-0">
                        <Music size={12} className="text-white/20" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate font-medium">{t.track_title || t.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        ${(t.cpm_rate_cents / 100).toFixed(2)} CPM
                        {t.duration_ms ? ` · ${Math.floor(t.duration_ms / 60000)}:${String(Math.floor((t.duration_ms % 60000) / 1000)).padStart(2, '0')}` : ''}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <>
                          <Input type="number" min="1" value={editCpm}
                            onChange={e => setEditCpm(e.target.value)}
                            className="text-[10px] w-16 h-7" />
                          <button onClick={() => handleSaveCpm(t.id)} disabled={saving}
                            className="p-1 rounded hover:bg-white/[0.06] text-emerald-400">
                            <Check size={12} />
                          </button>
                          <button onClick={() => setEditingTrack(null)}
                            className="p-1 rounded hover:bg-white/[0.06] text-muted-foreground">
                            <X size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingTrack(t.id); setEditCpm(String(t.cpm_rate_cents)); }}
                            className="p-1 rounded hover:bg-white/[0.06] text-muted-foreground hover:text-foreground"
                            title="Edit CPM">
                            $✏️
                          </button>
                          <button onClick={() => handleToggle(t.id, t.enabled)}
                            className={`p-1 rounded hover:bg-white/[0.06] ${t.enabled ? 'text-emerald-400' : 'text-muted-foreground'}`}
                            title={t.enabled ? 'Disable' : 'Enable'}>
                            {t.enabled ? '✓' : '○'}
                          </button>
                          <button onClick={() => handleDelete(t.id)}
                            className="p-1 rounded hover:bg-white/[0.06] text-muted-foreground hover:text-red-400"
                            title="Remove track">
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/50 py-4 text-center">
              No tracks yet. Add your first track above.
            </p>
          )}
        </div>

        {/* Embed widget */}
        <ArtistEmbed artistSlug={slug} artistName={artist.artist_name} />
      </CardContent>
    </Card>
  );
}
