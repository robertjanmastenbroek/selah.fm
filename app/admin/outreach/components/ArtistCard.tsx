'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Clock, Loader2, Zap, Megaphone, Send, Eye, Mail } from 'lucide-react';

interface ArtistCardProps {
  artist: any;
  actionLoading: string;
  onAudit: (id: string) => void;
  onCreateCampaign: (id: string) => void;
  onSendEmail: (id: string) => void;
  onRenderOutreach: (id: string) => void;
  onRenderFollowUp: (id: string) => void;
  onLogOutreach: (id: string) => void;
  onSkip: (id: string) => void;
}

export default function ArtistCard({ artist, actionLoading, onAudit, onCreateCampaign, onSendEmail, onRenderOutreach, onRenderFollowUp, onLogOutreach, onSkip }: ArtistCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isAuditing = actionLoading === `audit-${artist.id}`;
  const isCreatingCampaign = actionLoading === `campaign-${artist.id}`;
  const isEmailing = actionLoading === `email-${artist.id}`;
  const isSkipping = actionLoading === `skip-${artist.id}`;
  const locked = !!actionLoading && !isAuditing && !isCreatingCampaign && !isEmailing && !isSkipping;

  const statusColors: Record<string, string> = {
    new: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    discovered: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    audited: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    campaign_created: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    outreach_sent: 'text-green-400 bg-green-500/10 border-green-500/20',
    claimed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
    declined: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  };

  const fmtGenres = (genres: any): string[] => {
    if (!genres) return [];
    if (Array.isArray(genres)) return genres;
    if (typeof genres === 'string') {
      try { return JSON.parse(genres); } catch { return [genres]; }
    }
    return [];
  };

  const genres = fmtGenres(artist.genres);
  const email = artist.email_address || null;
  const status = artist.status || 'discovered';
  const showActions = status !== 'declined' && status !== 'rejected';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      layout
      className={`group relative rounded-xl border p-4 transition-all duration-200
        ${locked ? 'opacity-40 pointer-events-none' : 'hover:border-white/[0.10]'}
        bg-white/[0.01] border-white/[0.04]`}
    >
      <div className="flex items-start gap-3">
        {/* Cover image */}
        {artist.latest_track_cover_url ? (
          <img src={artist.latest_track_cover_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 bg-white/[0.02]" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-white/[0.02] shrink-0 flex items-center justify-center text-[10px] text-muted-foreground/40">
            <Clock size={16} />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium truncate">{artist.artist_name}</h3>
            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${statusColors[status] || statusColors.discovered}`}>
              {status.replace(/_/g, ' ')}
            </span>
          </div>
          {artist.latest_track_name && (
            <p className="text-xs text-muted-foreground truncate">{artist.latest_track_name}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/60">
            {genres.length > 0 && <span>{genres.slice(0, 2).join(', ')}</span>}
            {email && <span className="flex items-center gap-1"><Mail size={10} />{email}</span>}
            {!email && artist.status !== 'discovered' && <span className="text-red-400/60 flex items-center gap-1"><Mail size={10} />No email</span>}
            {artist.followers > 0 && <span>{artist.followers.toLocaleString()} followers</span>}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1 shrink-0">
            {status === 'discovered' && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => onAudit(artist.id)} disabled={isAuditing}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 disabled:opacity-40 transition-all">
                {isAuditing ? <Loader2 size={11} className="animate-spin" /> : <Zap size={11} />}Audit
              </motion.button>
            )}

            {status === 'audited' && email && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => onCreateCampaign(artist.id)} disabled={isCreatingCampaign}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-40 transition-all">
                {isCreatingCampaign ? <Loader2 size={11} className="animate-spin" /> : <Megaphone size={11} />}Create
              </motion.button>
            )}

            {status === 'campaign_created' && email && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => onSendEmail(artist.id)} disabled={isEmailing}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-40 transition-all">
                {isEmailing ? <Loader2 size={11} className="animate-spin" /> : <Mail size={11} />}Email
              </motion.button>
            )}

            {status === 'audited' && !email && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => onSkip(artist.id)} disabled={isSkipping}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12] disabled:opacity-40 transition-all">
                {isSkipping ? <Loader2 size={11} className="animate-spin" /> : <Eye size={11} />}
              </motion.button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
