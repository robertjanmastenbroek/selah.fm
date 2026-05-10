'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ExternalLink, Clock } from 'lucide-react';
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
}

export default function SubmissionsFeed({ campaignId, count }: { campaignId: string; count: number }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/submissions?campaignId=${campaignId}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Only show approved submissions
          setSubmissions(
            data.filter((s: any) => s.review_status === 'approved').map((s: any) => ({
              id: s.id,
              creator_name: s.creator_name || 'Creator',
              platform: s.platform,
              content_url: s.content_url,
              views_verified: s.views_verified || 0,
              submitted_at: s.submitted_at,
              track_title: s.track_title,
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
        <h3 className="font-semibold text-sm flex items-center gap-2 mb-4">
          <Users size={14} className="text-primary/60" /> Videos submitted ({count || '...'})
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/[0.06]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-24 bg-white/[0.06] rounded" />
                  <div className="h-2.5 w-32 bg-white/[0.04] rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (submissions.length === 0) return null;

  return (
    <motion.div
      className="mb-10"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Users size={14} className="text-primary/60" />
          Recent submissions ({count})
        </h3>
      </div>

      <div className="space-y-3">
        {submissions.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            className="group rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] hover:border-primary/10 transition-all p-4"
          >
            <div className="flex items-start gap-4">
              {/* Creator avatar */}
              <div className="shrink-0">
                <CreatorAvatar name={s.creator_name} size="md" className="rounded-xl ring-2 ring-primary/10" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold truncate">{s.creator_name}</span>
                  <PlatformBadge platform={s.platform} />
                  {s.views_verified > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {s.views_verified >= 1000 ? `${(s.views_verified / 1000).toFixed(1)}K` : s.views_verified} views
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                  <Clock size={10} />
                  <span>
                    {(() => {
                      const date = new Date(s.submitted_at);
                      const now = new Date();
                      const diff = now.getTime() - date.getTime();
                      const hours = Math.floor(diff / 3600000);
                      if (hours < 1) {
                        const mins = Math.floor(diff / 60000);
                        return mins < 1 ? 'just now' : `${mins}m ago`;
                      }
                      if (hours < 24) return `${hours}h ago`;
                      return date.toLocaleDateString();
                    })()}
                  </span>
                </div>

                {/* Video preview link */}
                {s.content_url && (
                  <a
                    href={s.content_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                  >
                    <ExternalLink size={12} /> Watch video
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
