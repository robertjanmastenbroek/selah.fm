'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Film, ExternalLink, Clock, Eye } from 'lucide-react';
import CreatorAvatar from '@/components/CreatorAvatar';
import { PlatformBadge } from '@/components/SocialIcons';

interface Submission {
  id: string;
  creator_name: string;
  platform: string;
  content_url: string;
  views_verified: number;
  submitted_at: string;
  track_title: string;
  payout_amount_cents?: number;
}

export default function SubmissionsFeed({ campaignId, count }: { campaignId: string; count: number }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/submissions?campaignId=${campaignId}&status=approved`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSubmissions(
            data.map((s: any) => ({
              id: s.id,
              creator_name: s.creator_name || 'Creator',
              platform: s.platform,
              content_url: s.content_url,
              views_verified: s.views_verified || 0,
              submitted_at: s.submitted_at,
              track_title: s.track_title,
              payout_amount_cents: s.payout_amount_cents,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) {
    return (
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Film size={14} className="text-primary/60" />
          <h3 className="font-semibold text-sm">Videos submitted</h3>
          <span className="text-[11px] text-muted-foreground">({count || '...'})</span>
        </div>
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06]" />
                <div className="space-y-1.5 flex-1"><div className="h-3 w-24 bg-white/[0.06] rounded" /><div className="h-2 w-16 bg-white/[0.04] rounded" /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (submissions.length === 0) return null;

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) { const mins = Math.floor(diff / 60000); return mins < 1 ? 'just now' : `${mins}m ago`; }
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mb-10"
    >
      <div className="flex items-center gap-2 mb-4">
        <Film size={14} className="text-primary/60" />
        <h3 className="font-semibold text-sm">Videos submitted</h3>
        <span className="text-[11px] text-muted-foreground">({count})</span>
      </div>

      <div className="space-y-2">
        {submissions.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
          >
            <a
              href={s.content_url?.startsWith('http') ? s.content_url : `https://${s.content_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block group rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/15 hover:bg-white/[0.05] transition-all overflow-hidden"
            >
              <div className="p-4 flex items-center gap-4">
                {/* Creator avatar */}
                <div className="shrink-0 ring-1 ring-white/[0.08] rounded-xl">
                  <CreatorAvatar name={s.creator_name} size="md" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold truncate">{s.creator_name}</span>
                    <PlatformBadge platform={s.platform} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye size={10} /> {s.views_verified >= 1000 ? `${(s.views_verified / 1000).toFixed(1)}K` : s.views_verified} views</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {formatTime(s.submitted_at)}</span>
                    {s.payout_amount_cents && s.payout_amount_cents > 0 && (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium ml-auto">
                        ${(s.payout_amount_cents / 100).toFixed(2)} earned
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={14} className="text-primary/40" />
                </div>
              </div>
            </a>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
