'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, FileSearch, Megaphone, Send, Check,
  Loader2, Users, BarChart3, Clock,
  Music2, ChevronRight, AlertCircle, PartyPopper, X,
  RefreshCw, Zap, Disc3,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────
interface Artist {
  id: string;
  artist_name: string;
  spotify_id?: string;
  genres?: string[];
  followers?: number;
  monthly_listeners?: number;
  latest_track_name?: string;
  latest_track_cover_url?: string;
  latest_track_spotify_url?: string;
  discovery_source?: string;
  status: string;
  discovered_at?: string;
}

interface PipelineStats {
  discovered: number;
  awaiting_audit: number;
  audited: number;
  campaigns_created: number;
  outreach_sent: number;
  claimed: number;
  declined: number;
}

interface OutreachStats {
  total_sent: number;
  replies: number;
}

interface PipelineData {
  pipeline: PipelineStats;
  outreach: OutreachStats;
  recent: Artist[];
}

// ── Toast notification system ─────────────────────────────────────
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  detail?: string;
}

// ── Stat card component ───────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, delay }: {
  label: string; value: number; icon: any; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
      whileHover={{ scale: 1.03, y: -2 }}
      className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 text-center cursor-default
                 hover:bg-white/[0.05] hover:border-white/[0.10] transition-colors duration-200"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay * 0.05 + 0.15, type: 'spring', stiffness: 500 }}
      >
        <Icon size={16} className={`mx-auto mb-2 ${color} group-hover:scale-110 transition-transform duration-200`} />
      </motion.div>
      <motion.div
        className="text-2xl font-bold tracking-tight"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay * 0.05 + 0.25 }}
      >
        {value.toLocaleString()}
      </motion.div>
      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">{label}</div>
    </motion.div>
  );
}

// ── Toast component ───────────────────────────────────────────────
function ToastBar({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  };
  const icons = {
    success: <Check size={14} />,
    error: <AlertCircle size={14} />,
    info: <Sparkles size={14} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl border text-sm ${colors[toast.type]}`}
    >
      <span className="shrink-0 mt-0.5">{icons[toast.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{toast.title}</p>
        {toast.detail && <p className="text-xs opacity-70 mt-0.5 whitespace-pre-wrap">{toast.detail}</p>}
      </div>
      <button onClick={onDismiss} className="shrink-0 p-0.5 rounded-md hover:bg-white/10 transition-colors">
        <X size={12} />
      </button>
    </motion.div>
  );
}

// ── Outreach Queue component (DM workflow) ──────────────────────────
function OutreachQueue({ count, actionLoading, setActionLoading, addToast, fetchPipeline }: {
  count: number;
  actionLoading: string;
  setActionLoading: (v: string) => void;
  addToast: (type: Toast['type'], title: string, detail?: string) => void;
  fetchPipeline: () => void;
}) {
  const [queue, setQueue] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (count > 0 && !loaded) {
      fetch('/api/admin/outreach', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_outreach_queue' }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.error) setQueue(data);
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }
  }, [count, loaded]);

  if (count <= 0) return null;

  const dmArtist = async (artist: any) => {
    const id = `dm-${artist.id}`;
    const ig = artist.instagram_handle;
    const tt = artist.tiktok_handle;
    
    if (!ig && !tt) {
      addToast('info', `No social handles found for ${artist.artist_name}`,
        'Run Audit first to scrape Bandcamp for Instagram/TikTok links.');
      return;
    }
    
    setActionLoading(id);
    
    try {
      // Step 1: Copy message FIRST (clipboard needs page focus)
      const res = await fetch('/api/admin/outreach', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'render_outreach', artistId: artist.id }),
      });
      const data = await res.json();
      if (data.error) {
        addToast('error', 'Failed', data.error);
        setActionLoading('');
        return;
      }
      await navigator.clipboard.writeText(data.message);
      
      // Step 2: Open DM tabs (now clipboard has the message)
      if (ig) window.open(`https://ig.me/m/${ig}`, '_blank');
      if (tt) window.open(`https://www.tiktok.com/@${tt}`, '_blank');
      
      addToast('success', `Message copied — ${artist.artist_name}`,
        `📋 Copied · 📸 IG: https://ig.me/m/${ig}${tt ? ` · 🎵 TikTok: https://www.tiktok.com/@${tt}` : ''}`);
    } catch (e: any) {
      addToast('error', 'Failed', e.message);
    }
    setActionLoading('');
  };

  return (
    <div className="rounded-2xl border border-[#22C55E]/10 p-5" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.04) 0%, transparent 100%)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Send size={14} className="text-[#22C55E]" />
          Ready for Outreach
          <span className="text-[10px] text-muted-foreground font-normal">{count} waiting</span>
        </h2>
        <span className="text-[10px] text-muted-foreground">Click any row → copies message + opens DM</span>
      </div>

      {queue.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-4">Loading queue...</p>
      ) : (
        <div className="space-y-2">
          {queue.map((artist: any) => {
            const isBusy = actionLoading === `dm-${artist.id}`;
            const ig = artist.instagram_handle;
            const tt = artist.tiktok_handle;
            const campaignUrl = `https://selah.fm/c/${artist.campaign_slug}`;

            return (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => !isBusy && dmArtist(artist)}
                className={`group rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-3 cursor-pointer 
                  hover:bg-white/[0.05] hover:border-[#22C55E]/20 transition-all duration-150 ${isBusy ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {/* Cover art */}
                {artist.latest_track_cover_url ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/[0.04]">
                    <img src={artist.latest_track_cover_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg shrink-0 bg-white/[0.04] flex items-center justify-center">
                    <Music2 size={16} className="text-muted-foreground/20" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{artist.artist_name}</span>
                    {ig && <span className="text-[10px] text-pink-400 shrink-0">📸 @{ig}</span>}
                    {tt && <span className="text-[10px] text-blue-400 shrink-0">🎵 @{tt}</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {artist.latest_track_name && `🎵 ${artist.latest_track_name}`}
                    {!artist.latest_track_name && 'Click to copy message'}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isBusy ? (
                    <Loader2 size={14} className="animate-spin text-[#22C55E]" />
                  ) : (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#22C55E]/10 text-[#22C55E] text-[11px] font-semibold
                        group-hover:bg-[#22C55E]/20 transition-colors"
                    >
                      <Send size={11} />
                      Message
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Empty state component ─────────────────────────────────────────
function EmptyState({ onDiscover }: { onDiscover: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-3xl bg-white/[0.02] border border-white/[0.06] p-12 md:p-16 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
        className="w-20 h-20 rounded-2xl bg-primary/10 mx-auto mb-6 flex items-center justify-center"
      >
        <Disc3 size={36} className="text-primary/60" />
      </motion.div>
      <h2 className="text-xl font-bold mb-2">No artists discovered yet</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
        The pipeline discovers independent artists across Bandcamp, Reddit, and YouTube, audits their social presence, builds promotion campaigns, and generates personalized outreach messages — all automatically.
      </p>
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground/60 mb-8 font-medium">
        <span className="flex items-center gap-1.5"><Search size={12} /> Discover</span>
        <ChevronRight size={10} />
        <span className="flex items-center gap-1.5"><FileSearch size={12} /> Audit</span>
        <ChevronRight size={10} />
        <span className="flex items-center gap-1.5"><Megaphone size={12} /> Campaign</span>
        <ChevronRight size={10} />
        <span className="flex items-center gap-1.5"><Send size={12} /> Outreach</span>
        <ChevronRight size={10} />
        <span className="flex items-center gap-1.5"><Check size={12} /> Claim</span>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onDiscover}
        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base
                   hover:shadow-[0_0_30px_rgba(67,56,202,0.25)] transition-shadow duration-300"
      >
        <Zap size={18} />
        Start discovering artists
      </motion.button>
    </motion.div>
  );
}

// ── Artist card component ─────────────────────────────────────────
function ArtistCard({ artist, instagram_handle, tiktok_handle, actionLoading, onAudit, onCreateCampaign, onRenderOutreach, onRenderFollowUp, onLogOutreach }: {
  artist: Artist;
  instagram_handle?: string;
  tiktok_handle?: string;
  actionLoading: string;
  onAudit: (id: string) => void;
  onCreateCampaign: (id: string) => void;
  onRenderOutreach: (id: string, ig?: string, tt?: string) => void;
  onRenderFollowUp: (id: string) => void;
  onLogOutreach: (id: string) => void;
}) {
  const statusConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    discovered: { label: 'New', icon: Search, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    audited: { label: 'Audited', icon: FileSearch, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    campaign_created: { label: 'Campaign', icon: Megaphone, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    outreach_sent: { label: 'Outreach', icon: Send, color: 'text-green-400', bg: 'bg-green-500/10' },
    claimed: { label: 'Claimed', icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    declined: { label: 'Declined', icon: X, color: 'text-red-400', bg: 'bg-red-500/10' },
  };
  const status = statusConfig[artist.status] || statusConfig.discovered;
  const StatusIcon = status.icon;
  const isBusy = actionLoading.startsWith(`audit-${artist.id}`)
    || actionLoading.startsWith(`campaign-${artist.id}`)
    || actionLoading.startsWith(`outreach-${artist.id}`)
    || actionLoading.startsWith(`followup-${artist.id}`)
    || actionLoading.startsWith(`log-${artist.id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      layout
      className="group rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4
                 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        {/* Cover art thumbnail */}
        {artist.latest_track_cover_url ? (
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/[0.04] border border-white/[0.06]">
            <img
              src={artist.latest_track_cover_url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-xl shrink-0 bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <Music2 size={18} className="text-muted-foreground/20" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{artist.artist_name}</h3>
            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg} ${status.color}`}>
              <StatusIcon size={10} />
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
            {artist.followers ? (
              <span className="font-medium text-foreground/60">{artist.followers.toLocaleString()} followers</span>
            ) : null}
            {artist.genres?.length ? (
              <span>{artist.genres.slice(0, 3).join(', ')}</span>
            ) : null}
            {artist.latest_track_name && (
              <span className="truncate max-w-[200px]">🎵 {artist.latest_track_name}</span>
            )}
            {instagram_handle && (
              <span className="text-pink-400 font-medium">📸 @{instagram_handle}</span>
            )}
            {tiktok_handle && (
              <span className="text-blue-400 font-medium">🎵 @{tiktok_handle}</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {artist.status === 'discovered' && (
            <ActionButton
              onClick={() => onAudit(artist.id)}
              loading={actionLoading === `audit-${artist.id}`}
              disabled={isBusy}
              color="purple"
              label="Audit"
            />
          )}
          {artist.status === 'audited' && (
            <ActionButton
              onClick={() => onCreateCampaign(artist.id)}
              loading={actionLoading === `campaign-${artist.id}`}
              disabled={isBusy}
              color="amber"
              label="Create"
            />
          )}
          {artist.status === 'campaign_created' && (
            <>
              <ActionButton
                onClick={() => onRenderOutreach(artist.id, instagram_handle, tiktok_handle)}
                loading={actionLoading === `outreach-${artist.id}`}
                disabled={isBusy}
                color="green"
                label="Message"
              />
              <ActionButton
                onClick={() => onLogOutreach(artist.id)}
                loading={actionLoading === `log-${artist.id}`}
                disabled={isBusy}
                color="blue"
                label="Mark sent"
              />
            </>
          )}
          {artist.status === 'outreach_sent' && (
            <>
              <ActionButton
                onClick={() => onRenderOutreach(artist.id, instagram_handle, tiktok_handle)}
                loading={actionLoading === `outreach-${artist.id}`}
                disabled={isBusy}
                color="green"
                label="Message"
              />
              <ActionButton
                onClick={() => onRenderFollowUp(artist.id)}
                loading={actionLoading === `followup-${artist.id}`}
                disabled={isBusy}
                color="pink"
                label="Follow-up"
              />
            </>
          )}
          {artist.status === 'claimed' && (
            <span className="text-[10px] text-emerald-400/60 font-medium flex items-center gap-1">
              <PartyPopper size={12} /> Claimed
            </span>
          )}
          {artist.status === 'declined' && (
            <span className="text-[10px] text-red-400/60 font-medium">Declined</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Micro-reward action button ────────────────────────────────────
function ActionButton({ onClick, loading, disabled, color, label }: {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  color: string;
  label: string;
}) {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/20',
    green: 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20',
    blue: 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20',
    pink: 'bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 border-pink-500/20',
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.93 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold
                 border border-transparent transition-all duration-150
                 disabled:opacity-30 disabled:cursor-not-allowed
                 ${colorMap[color] || colorMap.purple}`}
    >
      {loading ? (
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Loader2 size={12} className="animate-spin" />
        </motion.span>
      ) : (
        label
      )}
    </motion.button>
  );
}

// ── Main dashboard ────────────────────────────────────────────────
export default function OutreachDashboard() {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);

  const addToast = (type: Toast['type'], title: string, detail?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, title, detail }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // ── API helper ──────────────────────────────────────────────
  const api = useCallback(async (action: string, body: any = {}) => {
    const res = await fetch('/api/admin/outreach', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...body }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Server error (${res.status}): ${text.slice(0, 100)}`);
    }
    return res.json();
  }, []);

  // ── Fetch pipeline ──────────────────────────────────────────
  const fetchPipeline = useCallback(async () => {
    try {
      const data = await fetch('/api/admin/outreach', { credentials: 'include' }).then(r => r.json());
      if (data.error) {
        addToast('error', 'Could not load pipeline', data.error);
      } else {
        setPipeline(data);
        setArtists(data.recent || []);
      }
    } catch {
      addToast('error', 'Could not load pipeline', 'Check your connection and try again.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPipeline(); }, [fetchPipeline]);

  // ── Discovery ───────────────────────────────────────────────
  const runDiscovery = async () => {
    setActionLoading('discover');
    try {
      const data = await api('discover', { limit: 15 });
      if (data.error) {
        addToast('error', 'Discovery failed', data.error);
      } else if (data.discovered === 0) {
        const diags = data.diagnostics?.join(' · ') || 'No results';
        addToast('info', 'No artists found', diags);
      } else {
        addToast('success', `Found ${data.discovered} artists`, `Stored ${data.stored} new · ${data.total_in_db} total in database`);
        fetchPipeline();
      }
    } catch (e: any) {
      addToast('error', 'Discovery failed', e.message || 'Unknown error');
    }
    setActionLoading('');
  };

  // ── Audit ───────────────────────────────────────────────────
  const runAudit = async (artistId: string) => {
    setActionLoading(`audit-${artistId}`);
    try {
      const data = await api('audit', { artistId });
      if (data.error) {
        addToast('error', 'Audit failed', data.error);
      } else {
        addToast('success', `Audited ${data.artist?.artist_name}`, 'Ready to create a campaign.');
        fetchPipeline();
      }
    } catch (e: any) {
      addToast('error', 'Audit failed', e.message);
    }
    setActionLoading('');
  };

  // ── Create campaign ─────────────────────────────────────────
  const createCampaign = async (artistId: string) => {
    setActionLoading(`campaign-${artistId}`);
    try {
      const data = await api('create_campaign', { artistId });
      if (data.error) {
        addToast('error', 'Campaign creation failed', data.error);
      } else {
        addToast('success', 'Campaign created', data.campaign_url);
        fetchPipeline();
      }
    } catch (e: any) {
      addToast('error', 'Campaign creation failed', e.message);
    }
    setActionLoading('');
  };

  // ── Render outreach ─────────────────────────────────────────
  const renderOutreach = async (artistId: string, igHandle?: string, ttHandle?: string) => {
    setActionLoading(`outreach-${artistId}`);
    
    try {
      // Step 1: Copy message FIRST (before opening tabs — tabs steal focus from clipboard API)
      const data = await api('render_outreach', { artistId });
      if (data.error) {
        addToast('error', 'Could not render message', data.error);
        setActionLoading('');
        return;
      }
      await navigator.clipboard.writeText(data.message);
      
      // Step 2: Open DM tabs (now clipboard has the message)
      const resolvedIg = data.instagram_handle || igHandle;
      const resolvedTt = data.tiktok_handle || ttHandle;
      if (resolvedIg) window.open(`https://ig.me/m/${resolvedIg}`, '_blank');
      if (resolvedTt) window.open(`https://www.tiktok.com/@${resolvedTt}`, '_blank');
      
      const channels: string[] = [];
      if (resolvedIg) channels.push(`📸 IG: https://ig.me/m/${resolvedIg}`);
      if (resolvedTt) channels.push(`🎵 TikTok: https://www.tiktok.com/@${resolvedTt}`);
      
      addToast('success', `Message copied — ${data.artist_name}`,
        channels.length ? channels.join(' · ') : 'Paste into DM and send.');
    } catch (e: any) {
      addToast('error', 'Could not render message', e.message);
    }
    setActionLoading('');
  };

  // ── Render follow-up ────────────────────────────────────────
  const renderFollowUp = async (artistId: string) => {
    setActionLoading(`followup-${artistId}`);
    try {
      const data = await api('render_follow_up', { artistId });
      if (data.error) {
        addToast('error', 'Could not render follow-up', data.error);
      } else {
        await navigator.clipboard.writeText(data.message);
        const extra = [];
        if (data.donations) extra.push(`${data.donations} donors`);
        if (data.submission_count) extra.push(`${data.submission_count} submissions`);
        addToast('success', 'Follow-up copied', extra.length ? extra.join(', ') : `Ready to send to ${data.artist_name}.`);
      }
    } catch (e: any) {
      addToast('error', 'Could not render follow-up', e.message);
    }
    setActionLoading('');
  };

  // ── Log outreach ────────────────────────────────────────────
  const logOutreach = async (artistId: string) => {
    setActionLoading(`log-${artistId}`);
    try {
      await api('log_outreach', { artistId, channel: 'instagram_dm', status: 'sent' });
      addToast('success', 'Outreach logged', 'Marked as sent via Instagram DM.');
      fetchPipeline();
    } catch (e: any) {
      addToast('error', 'Could not log outreach', e.message);
    }
    setActionLoading('');
  };

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="w-10 h-10 mx-auto rounded-full border-2 border-primary/20 border-t-primary"
          />
          <p className="text-sm text-muted-foreground">Loading pipeline…</p>
        </motion.div>
      </div>
    );
  }

  const p = pipeline?.pipeline || {
    discovered: 0, awaiting_audit: 0, audited: 0,
    campaigns_created: 0, outreach_sent: 0, claimed: 0, declined: 0,
  };
  const o = pipeline?.outreach || { total_sent: 0, replies: 0 };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Toast container ── */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastBar toast={t} onDismiss={() => dismissToast(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Outreach Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover → Audit → Campaign → Outreach → Claim
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={runDiscovery}
          disabled={actionLoading === 'discover'}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm
                     hover:shadow-[0_0_30px_rgba(67,56,202,0.25)] disabled:opacity-50 disabled:cursor-not-allowed
                     transition-shadow duration-300"
        >
          {actionLoading === 'discover' ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <Loader2 size={16} className="animate-spin" />
              Discovering…
            </motion.span>
          ) : (
            <>
              <Search size={16} />
              Discover Artists
            </>
          )}
        </motion.button>
      </motion.div>

      {/* ── Pipeline stats ── */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
        {[
          { label: 'Discovered', value: p.discovered, icon: Search, color: 'text-blue-400' },
          { label: 'Awaiting', value: p.awaiting_audit, icon: Clock, color: 'text-gray-400' },
          { label: 'Audited', value: p.audited, icon: FileSearch, color: 'text-purple-400' },
          { label: 'Campaigns', value: p.campaigns_created, icon: Megaphone, color: 'text-amber-400' },
          { label: 'Outreach', value: p.outreach_sent, icon: Send, color: 'text-green-400' },
          { label: 'Claimed', value: p.claimed, icon: Check, color: 'text-emerald-400' },
          { label: 'Replies', value: o.replies, icon: BarChart3, color: 'text-pink-400' },
        ].map((s, i) => (
          <StatCard key={s.label} {...s} delay={i} />
        ))}
      </div>

      {/* ── Ready for Outreach (campaigns created, not yet messaged) ── */}
      <OutreachQueue
        count={p.campaigns_created - p.outreach_sent}
        actionLoading={actionLoading}
        setActionLoading={setActionLoading}
        addToast={addToast}
        fetchPipeline={fetchPipeline}
      />

      {/* ── Artist list ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Users size={14} className="text-primary" />
            Discovered Artists
            {artists.length > 0 && (
              <span className="text-[10px] text-muted-foreground font-normal">
                {artists.length} showing
              </span>
            )}
          </h2>
          {artists.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchPipeline}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium
                         bg-white/[0.03] border border-white/[0.06] text-muted-foreground
                         hover:text-foreground hover:border-white/[0.12] transition-all"
            >
              <RefreshCw size={11} />
              Refresh
            </motion.button>
          )}
        </div>

        {artists.length === 0 ? (
          <EmptyState onDiscover={runDiscovery} />
        ) : (
          <motion.div layout className="space-y-2">
            <AnimatePresence mode="popLayout">
              {artists.map((a: any) => (
                <ArtistCard
                  key={a.id}
                  artist={a}
                  instagram_handle={a.instagram_handle}
                  tiktok_handle={a.tiktok_handle}
                  actionLoading={actionLoading}
                  onAudit={runAudit}
                  onCreateCampaign={createCampaign}
                  onRenderOutreach={renderOutreach}
                  onRenderFollowUp={renderFollowUp}
                  onLogOutreach={logOutreach}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
