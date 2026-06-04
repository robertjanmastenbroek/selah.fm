'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mic, BookOpen, Database, ArrowRight, Sparkles, FileText, CheckCircle, Clock, Layers } from 'lucide-react';

export default function ContentHub() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [blogOverview, voiceStats] = await Promise.all([
        fetch('/api/admin/blog/batch?action=overview').then(r => r.json()),
        fetch('/api/admin/interview-capture?session=stats').then(r => r.json()),
      ]);
      setData({ blog: blogOverview, voice: voiceStats });
    } catch (e: any) {}
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!data) return <div className="p-8 text-center text-destructive">Failed to load</div>;

  const { blog, voice } = data;
  const voiceChunks = voice?.total_voice_chunks || 0;
  const interviewAnswers = voice?.total_answers || 0;
  const publishedPosts = blog?.publishedPosts || 0;
  const scheduledPosts = blog?.scheduledPosts || 0;
  const nextPost = blog?.nextPost;
  const activeBatch = blog?.activeBatch;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Layers size={24} className="text-primary" /> Content Engine</h1>
      <p className="text-sm text-muted-foreground">Your voice powers the blog. Every interview grows the library. Every chunk makes posts more authentic.</p>

      {/* Pipeline visualization */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
        <div className="flex items-center justify-center gap-4 md:gap-8 flex-wrap">
          {/* Step 1: Interview */}
          <Link href="/admin/interview" className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 transition-all group min-w-[120px]">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center group-hover:bg-blue-600/30 transition-colors">
              <Mic size={22} className="text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Interview</p>
              <p className="text-[10px] text-muted-foreground">{interviewAnswers} answers</p>
            </div>
          </Link>

          <ArrowRight size={20} className="text-gray-700 hidden md:block" />

          {/* Step 2: Voice Library */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] min-w-[120px]">
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <Database size={22} className="text-purple-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Voice Library</p>
              <p className="text-[10px] text-muted-foreground">{voiceChunks} chunks</p>
            </div>
          </div>

          <ArrowRight size={20} className="text-gray-700 hidden md:block" />

          {/* Step 3: Blog Engine */}
          <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] min-w-[120px]">
            <div className="w-12 h-12 rounded-full bg-amber-600/20 flex items-center justify-center">
              <Sparkles size={22} className="text-amber-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Blog Engine</p>
              <p className="text-[10px] text-muted-foreground">AI + your voice</p>
            </div>
          </div>

          <ArrowRight size={20} className="text-gray-700 hidden md:block" />

          {/* Step 4: Published */}
          <Link href="/admin/blog" className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 transition-all group min-w-[120px]">
            <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center group-hover:bg-green-600/30 transition-colors">
              <BookOpen size={22} className="text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Blog Posts</p>
              <p className="text-[10px] text-muted-foreground">{publishedPosts} published</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Voice Chunks', value: voiceChunks, icon: Database, color: 'text-purple-400', href: '/admin/interview' },
          { label: 'Interview Answers', value: interviewAnswers, icon: Mic, color: 'text-blue-400', href: '/admin/interview' },
          { label: 'Published Posts', value: publishedPosts, icon: BookOpen, color: 'text-green-400', href: '/admin/blog' },
          { label: 'Scheduled', value: scheduledPosts, icon: Clock, color: 'text-amber-400', href: '/admin/blog' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 text-center hover:border-primary/20 transition-colors">
              <Icon size={16} className={`mx-auto mb-2 ${s.color}`} />
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </Link>
          );
        })}
      </div>

      {/* Two-column: Voice coverage + Blog batch */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Voice coverage */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Mic size={14} className="text-blue-400" /> Voice Coverage
          </h2>
          <Link href="/admin/interview" className="block w-full p-3 rounded-xl bg-blue-600/10 border border-blue-600/20 text-sm text-center hover:bg-blue-600/20 transition-colors">
            Continue Interviewing →
          </Link>
        </div>

        {/* Generate from Voice */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" /> Generate from Voice Library
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            Pulls from your {voiceChunks} voice chunks. No batch interviews needed.
          </p>
          <GenerateFromVoiceButton voiceChunks={voiceChunks} />
        </div>

        {/* Blog batch */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <BookOpen size={14} className="text-green-400" /> Blog System
          </h2>
          {activeBatch ? (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Active batch: <span className="text-foreground">{activeBatch.month_year}</span> · {activeBatch.status}</p>
              <Link href={`/admin/blog/batch/${activeBatch.id}`} className="block w-full p-3 rounded-xl bg-green-600/10 border border-green-600/20 text-sm text-center hover:bg-green-600/20 transition-colors">
                Open Batch Editor →
              </Link>
            </div>
          ) : (
            <Link href="/admin/blog" className="block w-full p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-center hover:bg-white/[0.06] transition-colors">
              Set up blog system →
            </Link>
          )}
        </div>
      </div>

      {/* Next post preview */}
      {nextPost && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Clock size={14} className="text-amber-400" /> Next Post
          </h2>
          <p className="text-sm">{nextPost.title}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Publishing {new Date(nextPost.publish_at).toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
          </p>
        </div>
      )}
    </div>
  );
}

function GenerateFromVoiceButton({ voiceChunks }: { voiceChunks: number }) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generate = async () => {
    if (!topic) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/blog/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_from_voice', keyword: topic }),
      });
      const data = await res.json();
      if (data.error) setResult({ error: data.error });
      else {
        setResult(data);
        if (data.post?.id) window.location.href = '/admin/blog/post/' + data.post.id;
      }
    } catch (e: any) { setResult({ error: e.message }); }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Topic or keyword (e.g. music promotion)..."
        className="w-full bg-gray-800 rounded-lg p-2 text-sm text-white border border-gray-700 focus:border-amber-500 focus:outline-none"
        onKeyDown={e => e.key === 'Enter' && generate()}
      />
      <button
        onClick={generate}
        disabled={!topic || loading || voiceChunks === 0}
        className="w-full p-2 rounded-lg bg-amber-600/20 border border-amber-600/30 text-amber-400 text-sm hover:bg-amber-600/30 disabled:opacity-30 transition-colors"
      >
        {loading ? 'Generating...' : voiceChunks === 0 ? 'Do interviews first →' : 'Generate Blog Post from Voice Library'}
      </button>
      {result?.error && <p className="text-xs text-red-400">{result.error}</p>}
    </div>
  );
}
