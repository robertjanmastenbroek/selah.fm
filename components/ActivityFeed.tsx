'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Video, MessageCircle, Star, DollarSign, UserCheck } from 'lucide-react';

interface ActivityEvent {
  id: string; event_type: string; actor_name: string; message: string;
  metadata: Record<string, any>; created_at: string;
}

interface Props {
  artistSlug: string;
}

const EVENT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  donation: { icon: Heart, color: 'text-red-400' },
  submission: { icon: Video, color: 'text-emerald-400' },
  comment: { icon: MessageCircle, color: 'text-blue-400' },
  reaction_batch: { icon: Heart, color: 'text-pink-400' },
  rating: { icon: Star, color: 'text-yellow-400' },
  artist_claimed: { icon: UserCheck, color: 'text-primary' },
};

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ActivityEventItem({ event }: { event: ActivityEvent }) {
  const icon = EVENT_ICONS[event.event_type] || { icon: MessageCircle, color: 'text-muted-foreground' };
  const Icon = icon.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 py-2"
    >
      <Icon size={14} className={`${icon.color} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground/70 leading-relaxed">
          {event.message}
        </p>
        <p className="text-[10px] text-muted-foreground/40 mt-0.5">
          {timeAgo(event.created_at)}
        </p>
      </div>
    </motion.div>
  );
}

export default function ActivityFeed({ artistSlug }: Props) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivity = async () => {
    try {
      const res = await fetch(`/api/artists/${artistSlug}/activity?limit=10`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadActivity(); }, [artistSlug]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-white/[0.04]" />
            <div className="flex-1">
              <div className="h-3 w-40 bg-white/[0.04] rounded mb-1" />
              <div className="h-2 w-16 bg-white/[0.02] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <section className="space-y-1">
      <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Heart size={12} /> Activity
      </h2>
      <div className="divide-y divide-white/[0.03]">
        {events.map(e => (
          <ActivityEventItem key={e.id} event={e} />
        ))}
      </div>
    </section>
  );
}
