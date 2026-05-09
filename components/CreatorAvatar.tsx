import { campaignGradient } from '@/components/CampaignCover';

export default function CreatorAvatar({ 
  src, 
  name, 
  size = 'md' 
}: { 
  src?: string | null; 
  name: string; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const initial = name.trim()[0]?.toUpperCase() || '?';

  if (src) {
    return (
      <img 
        src={src} 
        alt={name}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-border`}
      />
    );
  }

  const bg = campaignGradient(name);
  return (
    <div 
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold ring-2 ring-border`}
      style={{ background: bg }}
    >
      <span className="text-white/80">{initial}</span>
    </div>
  );
}
