'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles, LoaderCircle, FileText, ExternalLink, Check, Mic, BookOpen, Database } from 'lucide-react';

function GeneratorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const question = searchParams.get('q') || '';

  const [customQuestion, setCustomQuestion] = useState(question);
  const [generating, setGenerating] = useState(false);
  const [post, setPost] = useState<any>(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ chunks: 0, answers: 0 });

  useEffect(() => {
    // Fetch voice library stats
    fetch('/api/admin/interview-capture?session=stats')
      .then(r => r.json())
      .then(d => setStats({ chunks: d.total_voice_chunks || 0, answers: d.total_answers || 0 }))
      .catch(e => console.error('Async error in admin/blog-generator/page.tsx:', e));
  }, []);

  const generate = async () => {
    const q = customQuestion.trim();
    if (!q) return;

    setGenerating(true);
    setError('');
    setPost(null);

    try {
      const res = await fetch('/api/admin/blog/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_from_voice', keyword: q }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.post) {
        setPost(data.post);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to generate');
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/source-questions" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Generate Blog Post</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.chunks > 0
              ? `Voice library: ${stats.chunks} chunks · ${stats.answers} answers ready`
              : 'Voice library is empty — do some interviews first'}
          </p>
        </div>
      </div>

      {/* The question */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-4">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-400" /> Target question (becomes blog title)
        </label>
        <textarea
          value={customQuestion}
          onChange={e => setCustomQuestion(e.target.value)}
          placeholder="Paste a question from Reddit/X, or write your own..."
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 text-white text-sm min-h-[80px] resize-y focus:border-primary/30 focus:outline-none"
          rows={3}
        />
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            This question will determine the blog title, slug, and SEO targeting
          </p>
          <button
            onClick={generate}
            disabled={generating || !customQuestion.trim() || stats.chunks === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 text-white font-semibold text-sm hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 transition-all"
          >
            {generating ? (
              <><LoaderCircle size={14} className="animate-spin" /> Generating...</>
            ) : stats.chunks === 0 ? (
              'Do interviews first →'
            ) : (
              <><Sparkles size={14} /> Generate from Voice Library</>
            )}
          </button>
        </div>
        {stats.chunks === 0 && (
          <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-600/20 text-xs text-blue-400">
            Your voice library is empty. Go to{' '}
            <Link href="/admin/interview" className="underline font-medium">Interview Studio</Link>
            {' '}and answer a few questions so the blog engine can write in your voice.
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-600/10 border border-red-600/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Generating state */}
      {generating && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-12 text-center space-y-4">
          <LoaderCircle size={32} className="animate-spin mx-auto text-primary" />
          <div>
            <p className="text-sm font-medium">Generating blog post...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pulling from {stats.chunks} voice chunks to write in your authentic voice
            </p>
          </div>
        </div>
      )}

      {/* Generated post preview */}
      {post && !generating && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center">
                <Check size={14} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Post Generated</p>
                <p className="text-[10px] text-muted-foreground">Ready for review and editing</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.04] space-y-2">
              <p className="text-lg font-bold">{post.title}</p>
              <p className="text-xs text-muted-foreground font-mono">/{post.slug}</p>
              {post.meta_description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{post.meta_description}</p>
              )}
              {post.tags && (
                <div className="flex gap-1.5 flex-wrap pt-1">
                  {post.tags.map((t: string) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{t}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Link
                href={`/admin/blog/post/${post.id}`}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <FileText size={14} /> Open in Editor
              </Link>
              <Link
                href={`/blog/${post.slug}`}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm hover:bg-white/[0.08] transition-colors"
              >
                <ExternalLink size={14} /> Preview
              </Link>
            </div>
          </div>

          {/* Content preview */}
          {post.content_html && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h2 className="text-xs font-medium text-muted-foreground mb-3">Content Preview</h2>
              <div className="prose prose-invert prose-sm max-w-none bg-white/[0.02] rounded-xl p-6 max-h-[400px] overflow-y-auto">
                <div dangerouslySetInnerHTML={{
                  __html: post.content_html.slice(0, 2000) + (post.content_html.length > 2000 ? '...' : '')
                }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BlogGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center">
        <LoaderCircle size={24} className="animate-spin mx-auto mb-3 text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    }>
      <GeneratorContent />
    </Suspense>
  );
}
