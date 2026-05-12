'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Sparkles, FileSearch, Megaphone, Send, Check, ExternalLink, Loader2, ChevronRight, Users, BarChart3, Clock } from 'lucide-react';

export default function OutreachDashboard() {
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [message, setMessage] = useState('');
  const [artists, setArtists] = useState<any[]>([]);

  useEffect(() => { fetchPipeline(); }, []);

  const api = async (action: string, body: any = {}) => {
    const res = await fetch('/api/admin/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    return res.json();
  };

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const data = await fetch('/api/admin/outreach').then(r => r.json());
      setPipeline(data);
      setArtists(data.recent || []);
    } catch {}
    setLoading(false);
  };

  const runDiscovery = async () => {
    setActionLoading('discover');
    setMessage('');
    try {
      const data = await api('discover', { query: 'year:2025-2026', limit: 20 });
      setMessage(`Found ${data.discovered} artists · Stored ${data.stored} new · ${data.total_in_db} total in database`);
      fetchPipeline();
    } catch (e: any) { setMessage('Error: ' + e.message); }
    setActionLoading('');
  };

  const runAudit = async (artistId: string) => {
    setActionLoading(`audit-${artistId}`);
    try {
      const data = await api('audit', { artistId });
      if (data.error) setMessage(data.error);
      else setMessage(`Audited ${data.artist?.artist_name}`);
      fetchPipeline();
    } catch (e: any) { setMessage('Error: ' + e.message); }
    setActionLoading('');
  };

  const createCampaign = async (artistId: string) => {
    setActionLoading(`campaign-${artistId}`);
    try {
      const data = await api('create_campaign', { artistId });
      if (data.error) setMessage(data.error);
      else setMessage(`Campaign created: ${data.campaign_url}`);
      fetchPipeline();
    } catch (e: any) { setMessage('Error: ' + e.message); }
    setActionLoading('');
  };

  const renderOutreach = async (artistId: string) => {
    setActionLoading(`outreach-${artistId}`);
    try {
      const data = await api('render_outreach', { artistId });
      if (data.error) setMessage(data.error);
      else {
        // Copy to clipboard
        await navigator.clipboard.writeText(data.message);
        setMessage(`Message copied to clipboard for ${data.artist_name}! Ready to send via Instagram DM.`);
      }
    } catch (e: any) { setMessage('Error: ' + e.message); }
    setActionLoading('');
  };

  const logOutreach = async (artistId: string) => {
    setActionLoading(`log-${artistId}`);
    try {
      await api('log_outreach', { artistId, channel: 'instagram_dm', status: 'sent' });
      setMessage('Outreach logged as sent');
      fetchPipeline();
    } catch (e: any) { setMessage('Error: ' + e.message); }
    setActionLoading('');
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 size={24} className="animate-spin mx-auto mb-3 text-primary" />
        <p className="text-sm text-muted-foreground">Loading pipeline...</p>
      </div>
    );
  }

  const p = pipeline?.pipeline || {};
  const o = pipeline?.outreach || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Outreach Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover → Audit → Campaign → Outreach → Claim
          </p>
        </div>
        <button
          onClick={runDiscovery}
          disabled={actionLoading === 'discover'}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {actionLoading === 'discover' ? (
            <><Loader2 size={16} className="animate-spin" /> Discovering...</>
          ) : (
            <><Search size={16} /> Discover Artists</>
          )}
        </button>
      </div>

      {message && (
        <div className="text-sm px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          {message}
        </div>
      )}

      {/* Pipeline stats */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
        {[
          { label: 'Discovered', value: p.discovered || 0, icon: Search, color: 'text-blue-400' },
          { label: 'Awaiting', value: p.awaiting_audit || 0, icon: Clock, color: 'text-gray-400' },
          { label: 'Audited', value: p.audited || 0, icon: FileSearch, color: 'text-purple-400' },
          { label: 'Campaigns', value: p.campaigns_created || 0, icon: Megaphone, color: 'text-amber-400' },
          { label: 'Outreach', value: p.outreach_sent || 0, icon: Send, color: 'text-green-400' },
          { label: 'Claimed', value: p.claimed || 0, icon: Check, color: 'text-emerald-400' },
          { label: 'Replies', value: o.replies || 0, icon: BarChart3, color: 'text-pink-400' },
        ].map(s => {
          const I = s.icon;
          return (
            <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
              <I size={14} className={`mx-auto mb-1 ${s.color}`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[9px] text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Artist list */}
      <div>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Users size={14} className="text-primary" /> Discovered Artists
        </h2>
        {artists.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-12 text-center">
            <Search size={32} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No artists discovered yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Discover Artists" to find independent artists on Spotify</p>
          </div>
        ) : (
          <div className="space-y-2">
            {artists.map((a: any) => {
              const statusColors: Record<string, string> = {
                discovered: 'bg-blue-600/20 text-blue-400',
                audited: 'bg-purple-600/20 text-purple-400',
                campaign_created: 'bg-amber-600/20 text-amber-400',
                outreach_sent: 'bg-green-600/20 text-green-400',
                claimed: 'bg-emerald-600/20 text-emerald-400',
                declined: 'bg-red-600/20 text-red-400',
              };
              return (
                <div key={a.id} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-sm">{a.artist_name}</h3>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${statusColors[a.status] || 'bg-gray-600/20 text-gray-400'}`}>
                          {a.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span>{a.followers?.toLocaleString()} followers</span>
                        {a.genres?.length > 0 && <span>{a.genres.slice(0, 2).join(', ')}</span>}
                        {a.latest_track_name && <span className="truncate">🎵 {a.latest_track_name}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {a.status === 'discovered' && (
                        <button onClick={() => runAudit(a.id)} disabled={actionLoading === `audit-${a.id}`}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 disabled:opacity-50 transition-colors">
                          {actionLoading === `audit-${a.id}` ? <Loader2 size={10} className="animate-spin" /> : 'Audit'}
                        </button>
                      )}
                      {a.status === 'audited' && (
                        <button onClick={() => createCampaign(a.id)} disabled={actionLoading === `campaign-${a.id}`}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 disabled:opacity-50 transition-colors">
                          {actionLoading === `campaign-${a.id}` ? <Loader2 size={10} className="animate-spin" /> : 'Create'}
                        </button>
                      )}
                      {a.status === 'campaign_created' && (
                        <>
                          <button onClick={() => renderOutreach(a.id)} disabled={actionLoading === `outreach-${a.id}`}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-50 transition-colors">
                            {actionLoading === `outreach-${a.id}` ? <Loader2 size={10} className="animate-spin" /> : 'Msg'}
                          </button>
                          <button onClick={() => logOutreach(a.id)} disabled={actionLoading === `log-${a.id}`}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:opacity-50 transition-colors">
                            {actionLoading === `log-${a.id}` ? <Loader2 size={10} className="animate-spin" /> : 'Sent'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
