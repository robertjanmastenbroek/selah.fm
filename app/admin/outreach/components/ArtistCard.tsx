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

export default function ArtistCard({ artist }: Props) {
  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-4">
      <span className="text-sm">{artist.artist_name} — {artist.status}</span>
    </div>
  );
}
