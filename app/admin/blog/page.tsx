'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, CheckCircle, Clock, FileText, RefreshCw, Send } from 'lucide-react';

export default function AdminBlogPage() {
  const [overview, setOverview] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
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

  const apiCall = async (action: string, body: any = {}) => {
    setActionLoading(action);
    setMessage('');
    try {
      const res = await fetch('/api/admin/blog/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      });
      const data = await res.json();
      if (data.error) setMessage(data.error);
      else setMessage(`${action} complete`);
      await fetchData();
    } catch (e: any) {
      setMessage(e.message);
    }
    setActionLoading('');
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

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
            { label: 'Scheduled', value: overview.scheduledPosts, icon: Clock },
            { label: 'Voice Chunks', value: overview.voiceLibrarySize, icon: BookOpen },
            { label: 'Batches', value: overview.totalBatches, icon: Play },
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

      {/* Monthly batch workflow */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Play size={18} className="text-primary" /> Monthly Batch
        </h2>

        <div className="space-y-3">
          {/* Step 1: Create batch */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]">
            <span className="text-lg font-bold text-primary/40 w-8">1</span>
            <div className="flex-1">
              <p className="font-medium text-sm">Create monthly batch</p>
              <p className="text-[11px] text-muted-foreground">Creates a new batch for {new Date().toLocaleString('en', { month: 'long', year: 'numeric' })}</p>
            </div>
            <button
              onClick={() => apiCall('create_batch')}
              disabled={!!actionLoading}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === 'create_batch' ? '...' : 'Create'}
            </button>
          </div>

          {/* Step 2: Source questions */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]">
            <span className="text-lg font-bold text-primary/40 w-8">2</span>
            <div className="flex-1">
              <p className="font-medium text-sm">Source 30 questions</p>
              <p className="text-[11px] text-muted-foreground">Fetches from Reddit + fallback questions</p>
            </div>
            <button
              onClick={() => {
                const batch = batches[0];
                if (batch) apiCall('source_questions', { batchId: batch.id });
              }}
              disabled={!!actionLoading || batches.length === 0}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === 'source_questions' ? '...' : 'Source'}
            </button>
          </div>

          {/* Step 3: Generate interviews */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]">
            <span className="text-lg font-bold text-primary/40 w-8">3</span>
            <div className="flex-1">
              <p className="font-medium text-sm">Generate interview questions</p>
              <p className="text-[11px] text-muted-foreground">Uses DeepSeek to create 4-6 Qs per topic</p>
            </div>
            <button
              onClick={() => {
                const batch = batches.find(b => b.status === 'interviewing' || b.status === 'sourcing');
                if (batch) apiCall('generate_interviews', { batchId: batch.id });
              }}
              disabled={!!actionLoading}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === 'generate_interviews' ? '...' : 'Generate'}
            </button>
          </div>

          {/* Step 4: Finalize */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]">
            <span className="text-lg font-bold text-primary/40 w-8">4</span>
            <div className="flex-1">
              <p className="font-medium text-sm">Finalize &amp; generate articles</p>
              <p className="text-[11px] text-muted-foreground">Writes 30 blog posts, fetches images, schedules them</p>
            </div>
            <button
              onClick={() => {
                const batch = batches.find(b => b.status === 'answers_complete');
                if (batch) apiCall('finalize_batch', { batchId: batch.id });
              }}
              disabled={!!actionLoading}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {actionLoading === 'finalize_batch' ? '...' : 'Finalize'}
            </button>
          </div>
        </div>

        {/* Active batch status */}
        {overview?.activeBatch && (
          <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-sm font-medium mb-1">Active batch: {overview.activeBatch.month_year}</p>
            <p className="text-xs text-muted-foreground">Status: {overview.activeBatch.status}</p>
          </div>
        )}
      </div>

      {/* Scheduled posts */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
        <h2 className="font-semibold text-lg mb-4">Scheduled &amp; Published Posts</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No posts yet. Start a monthly batch above.</p>
        ) : (
          <div className="space-y-2">
            {posts.slice(0, 20).map((post: any) => (
              <div key={post.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{post.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {post.status} · {post.publish_at ? new Date(post.publish_at).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {post.status === 'scheduled' && (
                    <button
                      onClick={() => apiCall('publish_post', { postId: post.id })}
                      className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold hover:opacity-90"
                    >
                      Publish now
                    </button>
                  )}
                  {post.status === 'published' && (
                    <CheckCircle size={14} className="text-emerald-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
