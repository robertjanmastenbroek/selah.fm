'use client';

interface Props {
  artist: { id: string; artist_name: string; status: string; email_address?: string; instagram_handle?: string; tiktok_handle?: string; latest_track_name?: string; latest_track_cover_url?: string; genres?: string[] };
  actionLoading: string;
  onAudit: (id: string) => void;
  onCreateCampaign: (id: string) => void;
  onSendEmail: (id: string) => void;
  onRenderOutreach: (id: string, ig?: string, tt?: string) => void;
  onRenderFollowUp: (id: string) => void;
  onLogOutreach: (id: string) => void;
  onSkip: (id: string) => void;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  discovered: { label: 'New', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  audited: { label: 'Audited', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  campaign_created: { label: 'Campaign', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  outreach_sent: { label: 'Sent', color: 'text-green-400', bg: 'bg-green-500/10' },
  claimed: { label: 'Claimed', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  declined: { label: 'Declined', color: 'text-red-400', bg: 'bg-red-500/10' },
};

export default function ArtistCard({ artist, actionLoading, onAudit, onCreateCampaign, onSendEmail, onRenderOutreach, onRenderFollowUp, onLogOutreach, onSkip }: Props) {
  const s = STATUS_MAP[artist.status] || STATUS_MAP.discovered;
  const hasEmail = !!artist.email_address;
  const hasSocial = !!(artist.instagram_handle || artist.tiktok_handle);

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4 hover:bg-white/[0.04] transition-colors">
      <div className="flex items-start gap-4">
        {artist.latest_track_cover_url ? (
          <img src={artist.latest_track_cover_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-white/[0.04]" loading="lazy" />
        ) : (
          <div className="w-12 h-12 rounded-xl shrink-0 bg-white/[0.04] flex items-center justify-center text-muted-foreground/20 text-lg">♪</div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-sm">{artist.artist_name}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.color}`}>{s.label}</span>
            {artist.status === 'audited' && !hasEmail && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400">No email</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
            {artist.genres?.length ? <span>{artist.genres.slice(0, 3).join(', ')}</span> : null}
            {artist.latest_track_name && <span>🎵 {artist.latest_track_name}</span>}
            {artist.email_address && <span className="text-green-400">✉️ {artist.email_address}</span>}
            {artist.instagram_handle && <span className="text-pink-400">📸 @{artist.instagram_handle}</span>}
            {artist.tiktok_handle && <span className="text-blue-400">🎵 @{artist.tiktok_handle}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
