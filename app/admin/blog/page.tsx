'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle, Clock, FileText, RefreshCw, Send, Edit3, ArrowRight } from 'lucide-react';

export default function AdminBlogPage() {
  const [overview, setOverview] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ov, bt, ps] = await Promise.all([
        fetch('/api/admin/blog/batch?action=overview').then(r => r.json()),
        fetch('/api/admin/blog/batch').then(r => r.json()),
        fetch('/api/admin/blog/batch?action=posts').then(r => r.json()),
      ]);
      setOverview(ov);
      setBatches(Array.isArray(bt) ? bt : []);
      setPosts(Array.isArray(ps) ? ps : []);
    } catch (e: any) {
      setMessage(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  const activeBatch = overview?.activeBatch;
  const publishedPosts = posts.filter((p: any) => p.status === 'published');
  const draftPosts = posts.filter((p: any) => p.status === 'draft');
  const scheduledPosts = posts.filter((p: any) => p.status === 'scheduled');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen size={24} className="text-primary" /> Blog System
        </h1>
        <button onClick={fetchData} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-xl ${message.includes('error') || message.includes('Error') ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {message}
        </div>
      )}

      {/* Overview cards */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Published', value: overview.publishedPosts, icon: FileText },
            { label: 'Drafts', value: draftPosts.length, icon: Edit3 },
            { label: 'Scheduled', value: overview.scheduledPosts, icon: Clock },
            { label: 'Voice Chunks', value: overview.voiceLibrarySize, icon: BookOpen },
            { label: 'Next Post', value: overview.nextPost ? new Date(overview.nextPost.publish_at).toLocaleDateString() : '—', icon: Send },
          ].map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
                <Icon size={16} className="mx-auto mb-2 text-primary/60" />
                <div className="text-lg font-bold">{card.value}</div>
                <div className="text-[10px] text-muted-foreground">{card.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Batch — Primary CTA */}
      {activeBatch && (
        <a
          href={`/admin/blog/batch/${activeBatch.id}`}
          className="block rounded-2xl bg-gradient-to-r from-primary/10 to-blue-500/5 border border-primary/20 p-6 hover:border-primary/40 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">
                Active Batch: {activeBatch.month_year}
              </h2>
              <p className="text-sm text-muted-foreground">
                Status: {activeBatch.status} · {activeBatch.answered_count || 0} interviews answered
              </p>
              {activeBatch.answered_count > 0 && (
                <p className="text-xs text-primary mt-2">
                  {activeBatch.answered_count} interviews ready — click Preview to generate draft posts
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
              Open Interview Editor <ArrowRight size={16} />
            </div>
          </div>
        </a>
      )}

      {/* Posts — Draft, Scheduled, Published */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Drafts */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Edit3 size={14} className="text-amber-400" /> Drafts ({draftPosts.length})
          </h2>
          {draftPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No drafts. Generate previews from the batch editor.</p>
          ) : (
            <div className="space-y-1">
              {draftPosts.map((post: any) => (
                <a key={post.id} href={`/admin/blog/post/${post.id}`} className="block p-2 rounded-lg hover:bg-white/[0.04] text-xs transition-colors">
                  <span className="truncate block">{post.title}</span>
                  <span className="text-muted-foreground">{post.primary_keyword ? '· ' + post.primary_keyword : ''}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Scheduled */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Clock size={14} className="text-blue-400" /> Scheduled ({scheduledPosts.length})
          </h2>
          {scheduledPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No scheduled posts.</p>
          ) : (
            <div className="space-y-1">
              {scheduledPosts.map((post: any) => (
                <a key={post.id} href={`/admin/blog/post/${post.id}`} className="block p-2 rounded-lg hover:bg-white/[0.04] text-xs transition-colors">
                  <span className="truncate block">{post.title}</span>
                  <span className="text-muted-foreground">
                    {post.publish_at ? new Date(post.publish_at).toLocaleDateString() : '—'}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Published */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-400" /> Published ({publishedPosts.length})
          </h2>
          {publishedPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">No published posts yet.</p>
          ) : (
            <div className="space-y-1">
              {publishedPosts.map((post: any) => (
                <div key={post.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] text-xs">
                  <a href={`/admin/blog/post/${post.id}`} className="truncate flex-1 hover:text-primary transition-colors">{post.title}</a>
                  <a href={`/blog/${post.slug}`} target="_blank" className="text-muted-foreground hover:text-foreground ml-2 shrink-0" title="View live">↗</a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly batch workflow (collapsed — for advanced use) */}
      <details className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
        <summary className="font-semibold text-sm cursor-pointer flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <Play size={14} /> Monthly Batch Workflow (advanced)
        </summary>
        <div className="mt-4 space-y-2">
          {overview?.activeBatch ? (
            <p className="text-xs text-muted-foreground mb-2">
              Active batch: {overview.activeBatch.month_year} (status: {overview.activeBatch.status}). 
              Use the <a href={`/admin/blog/batch/${overview.activeBatch.id}`} className="text-primary hover:underline">batch editor</a> for the new workflow.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mb-2">Create a new monthly batch to generate 30 blog posts.</p>
          )}
        </div>
      </details>
    </div>
  );
}
