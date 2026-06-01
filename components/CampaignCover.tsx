/**
 * CampaignCover — beautiful card header for campaign cards.
 * Shows the uploaded cover image if available, otherwise generates
 * a deterministic gradient visual based on the track title.
 */
export function campaignGradient(title: string): string {
  // Deterministic hash → gradient palette
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palettes = [
    ['#1a1a2e', '#16213e', '#0f3460'],           // deep navy
    ['#1a1a2e', '#3d1a3d', '#6b2d5b'],           // plum
    ['#1a1a2e', '#1a3d2e', '#2d6b4f'],           // forest
    ['#1a1a2e', '#3d2e1a', '#6b4f2d'],           // amber
    ['#1a1a2e', '#2e1a3d', '#4f2d6b'],           // violet
    ['#1a1a2e', '#1a2e3d', '#2d4f6b'],           // steel
    ['#1a1a2e', '#3d1a1a', '#6b2d2d'],           // rose
    ['#1a1a2e', '#2a1a3d', '#4a2d6b'],           // indigo
  ];
  const colors = palettes[Math.abs(hash) % palettes.length];
  return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
}

export default function CampaignCover({ 
  src, 
  title, 
  className = '' 
}: { 
  src?: string | null; 
  title: string; 
  className?: string;
}) {
  const bg = campaignGradient(title);

  if (src) {
    return (
      <div className={`overflow-hidden relative ${className}`} style={{ background: bg }}>
        <img
          src={src}
          alt={title || 'Campaign cover art'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Subtle gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
    );
  }

  // Gradient fallback — no text, just decorative
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: bg }}
    >
      {/* Decorative circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white/5" />
      <div className="absolute top-1/3 right-1/4 w-12 h-12 rounded-full bg-white/[0.03]" />
      <div className="absolute bottom-1/4 left-1/3 w-16 h-16 rounded-full bg-white/[0.04]" />

      {/* Sound wave bars */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-8">
        {[1, 1.4, 0.6, 1.8, 0.8, 1.2, 0.5, 1.6, 1, 0.7, 1.3, 0.9].map((h, i) => (
          <div
            key={i}
            className="w-[3px] rounded-full bg-accent-foreground/20"
            style={{
              height: `${h * 20}px`,
              animationDelay: `${i * 0.15}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
