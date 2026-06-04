'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Video, ExternalLink, DollarSign, Check, TrendingUp, Calendar } from 'lucide-react';
import Header from '@/components/TopNav';

export default function CreatorPortfolio({ id }: { id: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${id}`, { credentials: 'include' }).then(r => r.json()).catch(() => ({})),
      fetch(`/api/submissions?creator_id=${id}&limit=20`).then(r => r.json()).catch(() => []),
    ]).then(([userData, subData]) => {
      setProfile(userData.user || userData);
      setSubmissions(Array.isArray(subData) ? subData : []);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen" style={{background:'#0F0F23'}}>
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-24 w-24 rounded-full bg-white/[0.03]" />
        <div className="h-8 w-48 bg-white/[0.03] rounded-lg" />
        <div className="h-4 w-32 bg-white/[0.02] rounded-lg" />
      </div>
    </div>
  );

  const totalViews = submissions.reduce((sum, s) => sum + (s.views_verified || 0), 0);
  const approvedCount = submissions.filter(s => s.review_status === 'approved').length;

  return (
    <div className="min-h-screen" style={{background:'#0F0F23'}}>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile header */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center text-3xl font-bold text-white/30">
            {profile?.display_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile?.display_name || 'Creator'}</h1>
            <p className="text-sm text-muted-foreground/60">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Submissions', value: submissions.length, icon: <Video size={14} /> },
            { label: 'Approved', value: approvedCount, icon: <Check size={14} /> },
            { label: 'Views', value: totalViews.toLocaleString(), icon: <TrendingUp size={14} /> },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Submissions gallery */}
        <h2 className="text-sm font-semibold mb-4">Submitted Work</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground/50 text-center py-8">No submissions yet</p>
        ) : (
          <div className="grid gap-3">
            {submissions.map(s => (
              <a key={s.id} href={s.content_url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.04] transition-all group">
                <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center shrink-0">
                  <Video size={20} className="text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.platform || 'Video'}</p>
                  <p className="text-[10px] text-muted-foreground/50">
                    {(s.views_verified || 0).toLocaleString()} views
                    {s.review_status && <span className="ml-2">· {s.review_status}</span>}
                    {s.created_at && <span className="ml-2">· {new Date(s.created_at).toLocaleDateString()}</span>}
                  </p>
                </div>
                <ExternalLink size={14} className="text-muted-foreground/30 shrink-0 group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
