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

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{artist.artist_name}</span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.color}`}>{s.label}</span>
        {artist.status === 'audited' && !hasEmail && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400">No email</span>
        )}
        {artist.latest_track_name && <span className="text-[10px] text-muted-foreground">🎵 {artist.latest_track_name}</span>}
      </div>
    </div>
  );
}
