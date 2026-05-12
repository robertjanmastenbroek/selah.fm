'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, CheckCircle, Circle, Clock, Send, FileText, Eye } from 'lucide-react';

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;

  const [batch, setBatch] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/batch?batchId=${batchId}`);
      const data = await res.json();
      setBatch(data.batch);
      setInterviews(data.interviews || []);
      setQuestions(data.questions || []);
      setPosts(data.posts || []);
    } catch (e: any) {
      setMessage(e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [batchId]);

  // Auto-refresh every 10s if batch is being worked on
  useEffect(() => {
    if (!batch || batch.status === 'generated' || batch.status === 'archived') return;
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [batch?.status]);

  const finalize = async () => {
    if (!confirm('This will generate 30 blog posts using DeepSeek. Ready?')) return;
    setFinalizing(true);
    setMessage('Generating articles — this may take a few minutes...');
    try {
      const res = await fetch('/api/admin/blog/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'finalize_batch', batchId }),
      });
      const data = await res.json();
      if (data.error) setMessage(data.error);
      else setMessage(`${data.posts} articles generated and scheduled!`);
      await fetchData();
    } catch (e: any) {
      setMessage(e.message);
    }
    setFinalizing(false);
  };

  const previewPost = async (interviewId: string) => {
    setPreviewing(interviewId);
    setMessage('Generating preview...');
    try {
      const res = await fetch('/api/admin/blog/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'preview_post', interviewId }),
      });
      const data = await res.json();
      if (data.error) { setMessage(data.error); }
      else {
        setMessage('Preview generated!');
        router.push(`/admin/blog/post/${data.post.id}`);
      }
    } catch (e: any) { setMessage(e.message); }
    setPreviewing(null);
  };

  const answeredCount = interviews.filter((i: any) => i.status === 'answered' || i.status === 'converted').length;
  const totalCount = interviews.length;
  const progress = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;
  const allAnswered = totalCount > 0 && answeredCount === totalCount;

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading batch...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Batch not found</p>
        <Link href="/admin/blog" className="text-sm text-primary hover:underline mt-2 inline-block">Back to blog</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/blog" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Batch: {batch.month_year}</h1>
            <p className="text-xs text-muted-foreground">Status: {batch.status}</p>
          </div>
        </div>
        {allAnswered && batch.status !== 'generated' && (
          <button
            onClick={finalize}
            disabled={finalizing}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <Send size={14} />
            {finalizing ? 'Generating...' : 'Finalize & Generate Articles'}
          </button>
        )}
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-xl ${message.includes('error') || message.includes('Error') ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {message}
        </div>
      )}

      {/* Progress */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Interview Progress</span>
          <span className="text-sm text-muted-foreground">{answeredCount}/{totalCount} answered</span>
        </div>
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Posts (if generated) */}
      {posts.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <FileText size={14} className="text-primary" />
            Generated Posts ({posts.length})
          </h2>
          <div className="space-y-1">
            {posts.map((post: any) => (
              <button
                key={post.id}
                onClick={() => router.push(`/admin/blog/post/${post.id}`)}
                className="w-full text-left flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] text-xs hover:bg-white/[0.05] transition-colors"
              >
                <span className="truncate flex-1">{post.title}</span>
                <span className="text-muted-foreground shrink-0 ml-2">
                  {post.status === 'published' ? '📰 Live' : post.status === 'scheduled' ? `⏳ ${new Date(post.publish_at).toLocaleDateString()}` : post.status === 'draft' ? '📝 Draft' : post.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interview list */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
        <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <MessageSquare size={14} className="text-primary" />
          Interviews ({totalCount})
        </h2>

        <div className="space-y-1">
          {interviews.map((interview: any, i: number) => {
            const isAnswered = interview.status === 'answered' || interview.status === 'converted';
            const sourceQuestion = questions.find((q: any) => q.id === interview.question_id);
            const genQuestions = interview.generated_questions || [];

            return (
              <button
                key={interview.id}
                onClick={() => router.push(`/admin/blog/batch/${batchId}/interview/${interview.id}`)}
                className="w-full text-left p-3 rounded-xl hover:bg-white/[0.04] transition-colors flex items-center gap-3"
              >
                <div className="shrink-0">
                  {isAnswered ? (
                    <CheckCircle size={18} className="text-emerald-400" />
                  ) : interview.status === 'in_progress' ? (
                    <Clock size={18} className="text-amber-400" />
                  ) : (
                    <Circle size={18} className="text-muted-foreground/30" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {i + 1}. {sourceQuestion?.raw_question?.slice(0, 80) || `Interview ${i + 1}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {genQuestions.length} questions · {sourceQuestion?.platform || 'fallback'} · {sourceQuestion?.category || 'general'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isAnswered && !posts.some((p: any) => p.interview_id === interview.id) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); previewPost(interview.id); }}
                      disabled={previewing === interview.id}
                      className="text-[10px] px-2 py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:opacity-50"
                    >
                      {previewing === interview.id ? '...' : 'Preview'}
                    </button>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {isAnswered ? 'Done' : interview.status === 'in_progress' ? 'In progress' : 'Pending'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {interviews.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No interviews yet. Generate them from the blog dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
