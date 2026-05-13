'use client';

import { motion } from 'framer-motion';
import { Loader2, Music2, Send, Check, X } from 'lucide-react';

interface ArtistData {
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
  instagram_handle?: string;
  tiktok_handle?: string;
}

const STATUS_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  discovered: { label: 'New', icon: ({ size }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  audited: { label: 'Audited', icon: ({ size }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  campaign_created: { label: 'Campaign', icon: ({ size }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 14 2 18"/><path d="M22 8 18 4"/><path d="M20 2 2 20"/><path d="M18 22 6 10"/></svg>, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  outreach_sent: { label: 'Outreach', icon: ({ size }: any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>, color: 'text-green-400', bg: 'bg-green-500/10' },
  claimed: { label: 'Claimed', icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  declined: { label: 'Declined', icon: X, color: 'text-red-400', bg: 'bg-red-500/10' },
};

interface ArtistCardProps {
  artist: ArtistData;
  actionLoading: string;
  onAudit: (id: string) => void;
  onCreateCampaign: (id: string) => void;
  onRenderOutreach: (id: string, ig?: string, tt?: string) => void;
  onRenderFollowUp: (id: string) => void;
  onLogOutreach: (id: string) => void;
  onSkip: (id: string) => void;
}

function ActionBtn({ onClick, loading, disabled, color, label }: {
  onClick: () => void; loading: boolean; disabled: boolean; color: string; label: string;
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
        disabled:opacity-30 disabled:cursor-not-allowed ${colorMap[color]}`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : label}
    </motion.button>
  );
}

export default function ArtistCard({
  artist, actionLoading, onAudit, onCreateCampaign, onRenderOutreach, onRenderFollowUp, onLogOutreach, onSkip,
}: ArtistCardProps) {
  const status = STATUS_MAP[artist.status] || STATUS_MAP.discovered;
  const StatusIcon = status.icon;
  // Lock during any action for this artist OR any global action
  const isGlobalAction = actionLoading === 'discover' || actionLoading === 'batch-audit' || actionLoading === 'repair-images' || actionLoading === 'refresh';
  const isBusy = isGlobalAction
    || actionLoading.startsWith(`audit-${artist.id}`)
    || actionLoading.startsWith(`campaign-${artist.id}`)
    || actionLoading.startsWith(`outreach-${artist.id}`)
    || actionLoading.startsWith(`dm-${artist.id}`)
    || actionLoading.startsWith(`followup-${artist.id}`)
    || actionLoading.startsWith(`skip-${artist.id}`)
    || actionLoading === `log-${artist.id}`;
  const hasSocial = !!(artist.instagram_handle || artist.tiktok_handle);

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
        {/* Cover art */}
        {artist.latest_track_cover_url ? (
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white/[0.04] border border-white/[0.06]">
            <img src={artist.latest_track_cover_url} alt="" className="w-full h-full object-cover" loading="lazy" />
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
            {artist.status === 'audited' && !hasSocial && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400">
                <X size={10} />No socials
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
            {artist.followers ? <span className="font-medium text-foreground/60">{artist.followers.toLocaleString()} followers</span> : null}
            {artist.genres?.length ? <span>{artist.genres.slice(0, 3).join(', ')}</span> : null}
            {artist.latest_track_name && <span className="truncate max-w-[200px]">🎵 {artist.latest_track_name}</span>}
            {artist.instagram_handle && <span className="text-pink-400 font-medium">📸 @{artist.instagram_handle}</span>}
            {artist.tiktok_handle && <span className="text-blue-400 font-medium">🎵 @{artist.tiktok_handle}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {artist.status === 'discovered' && (
            <ActionBtn onClick={() => onAudit(artist.id)} loading={actionLoading === `audit-${artist.id}`}
              disabled={isBusy} color="purple" label="Audit" />
          )}
          {artist.status === 'audited' && (
            <>
              {hasSocial && (
                <ActionBtn onClick={() => onCreateCampaign(artist.id)} loading={actionLoading === `campaign-${artist.id}`}
                  disabled={isBusy} color="amber" label="Create" />
              )}
              <motion.button
                whileHover={!isBusy ? { scale: 1.05 } : {}}
                whileTap={!isBusy ? { scale: 0.93 } : {}}
                onClick={() => onSkip(artist.id)}
                disabled={isBusy}
                title="Skip — no social handles"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg
                  border border-white/[0.06] text-muted-foreground/40
                  hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20
                  transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {actionLoading === `skip-${artist.id}` ? <Loader2 size={12} className="animate-spin" /> : <X size={13} />}
              </motion.button>
            </>
          )}
          {artist.status === 'campaign_created' && (
            <>
              <ActionBtn onClick={() => onRenderOutreach(artist.id, artist.instagram_handle, artist.tiktok_handle)}
                loading={actionLoading === `outreach-${artist.id}`} disabled={isBusy} color="green" label="Message" />
              <motion.button
                whileHover={!isBusy ? { scale: 1.05 } : {}}
                whileTap={!isBusy ? { scale: 0.93 } : {}}
                onClick={() => onLogOutreach(artist.id)}
                disabled={isBusy}
                title="✓ Mark DM as sent"
                className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg
                  border border-white/[0.06] text-muted-foreground
                  hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20
                  transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {actionLoading === `log-${artist.id}` ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
              </motion.button>
            </>
          )}
          {artist.status === 'outreach_sent' && (
            <>
              <ActionBtn onClick={() => onRenderOutreach(artist.id, artist.instagram_handle, artist.tiktok_handle)}
                loading={actionLoading === `outreach-${artist.id}`} disabled={isBusy} color="green" label="Message" />
              <ActionBtn onClick={() => onRenderFollowUp(artist.id)} loading={actionLoading === `followup-${artist.id}`}
                disabled={isBusy} color="pink" label="Follow-up" />
            </>
          )}
          {artist.status === 'claimed' && (
            <span className="text-[10px] text-emerald-400/60 font-medium flex items-center gap-1">
              <span>🎉</span> Claimed
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
