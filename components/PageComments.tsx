'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, ChevronDown } from 'lucide-react';

interface Comment {
  id: string; author_name: string; content: string; likes_count: number;
  created_at: string; reply_count: number; user_id?: string | null;
}

interface Props {
  pageType: 'artist' | 'campaign' | 'track';
  pageId: string;
  currentUserId?: string;
}

function LoginPrompt() {
  return (
    <a href="/login"
      className="block w-full py-4 text-center rounded-xl border border-dashed border-white/[0.08] text-xs text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-all">
      Sign in to comment →
    </a>
  );
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  if (h < 168) return `${Math.floor(h / 24)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CommentForm({ pageType, pageId, parentId, placeholder, onSubmitted, onCancel }: {
  pageType: string; pageId: string; parentId?: string;
  placeholder?: string; onSubmitted: () => void; onCancel?: () => void;
}) {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [sending, setSending] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageType, pageId, content: content.trim(),
          parentId: parentId || undefined,
          authorName: authorName.trim() || undefined,
        }),
      });
      if (res.ok) {
        setContent('');
        setAuthorName('');
        onSubmitted();
      }
    } catch {} finally { setSending(false); }
  };

  return (
    <div className="space-y-2">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder || 'Write a comment...'}
        maxLength={1000}
        rows={2}
        className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 resize-none transition-colors"
        onFocus={() => setShowNameInput(true)}
      />
      <AnimatePresence>
        {showNameInput && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2">
            <input
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={50}
              className="flex-1 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30"
            />
            <div className="flex gap-1.5">
              {onCancel && (
                <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Cancel
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || sending}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-end">
        <span className="text-[10px] text-muted-foreground/40">{content.length}/1000</span>
      </div>
    </div>
  );
}

function CommentItem({ comment, depth = 0, pageId, pageType }: { comment: Comment; depth?: number; pageId: string; pageType?: string }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likes_count);
  const [showReply, setShowReply] = useState(false);
  const [replies, setReplies] = useState<Comment[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reported, setReported] = useState(false);

  const handleLike = async () => {
    const res = await fetch(`/api/comments/${comment.id}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikesCount(data.likes_count);
    }
  };

  const toggleReplies = async () => {
    if (showReplies) { setShowReplies(false); return; }
    if (replies.length === 0) {
      setLoadingReplies(true);
      try {
        const res = await fetch(`/api/comments?pageType=artist&pageId=${pageId}&parentId=${comment.id}&sort=newest&limit=20`, { credentials: 'omit' });
        if (res.ok) {
          const data = await res.json();
          setReplies(data.comments || []);
        }
      } catch {} finally { setLoadingReplies(false); }
    }
    setShowReplies(true);
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 pl-4 border-l border-white/[0.06]' : ''}`}>
      <div className="group py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground/80 truncate">
                {comment.author_name || 'Anonymous'}
              </span>
              <span className="text-[10px] text-muted-foreground/40 shrink-0">
                {timeAgo(comment.created_at)}
              </span>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">{comment.content}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-colors ${
              liked ? 'text-red-400' : 'text-muted-foreground/50 hover:text-red-400'
            }`}
          >
            <Heart size={12} fill={liked ? 'currentColor' : 'none'} />
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>
          {depth === 0 && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-primary transition-colors"
            >
              <MessageCircle size={12} />
              Reply
            </button>
          )}
          {comment.reply_count > 0 && depth === 0 && (
            <button onClick={toggleReplies} className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-primary transition-colors">
              <ChevronDown size={12} className={showReplies ? 'rotate-180' : ''} />
              {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {/* Report button */}
          <div className="relative">
            <button
              onClick={() => { setShowReport(!showReport); setReported(false); }}
              className="flex items-center gap-1 text-xs text-muted-foreground/30 hover:text-amber-400 transition-colors"
            >
              ⚑
            </button>
            <AnimatePresence>
              {showReport && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 4 }}
                  className="absolute bottom-full right-0 mb-2 w-48 rounded-xl bg-[#1C1C3A] border border-white/[0.08] shadow-2xl p-3 z-50"
                >
                  {reported ? (
                    <p className="text-xs text-emerald-400 text-center">Reported. Thanks.</p>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground font-medium">Report this comment</p>
                      {['spam', 'harassment', 'inappropriate', 'other'].map(reason => (
                        <button key={reason}
                          onClick={async () => {
                            setReportReason(reason);
                            try {
                              await fetch('/api/comments/report', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ commentId: comment.id, reason }),
                              });
                            } catch {}
                            setReported(true);
                            setTimeout(() => setShowReport(false), 1000);
                          }}
                          className={`w-full text-left px-2 py-1 rounded-lg text-xs hover:bg-white/[0.04] transition-colors ${reportReason === reason ? 'text-amber-400' : 'text-muted-foreground'}`}
                        >
                          {reason.charAt(0).toUpperCase() + reason.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showReply && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-3">
              <CommentForm
                pageType="artist"
                pageId={comment.id}
                parentId={comment.id}
                placeholder={`Reply to ${comment.author_name}...`}
                onSubmitted={() => { setShowReply(false); }}
                onCancel={() => setShowReply(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {showReplies && replies.length > 0 && (
          <div className="mt-2 space-y-1">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} pageId={pageId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PageComments({ pageType, pageId, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'newest' | 'most_liked'>('newest');

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?pageType=${pageType}&pageId=${pageId}&sort=${sort}&limit=20`, { credentials: 'omit' });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadComments(); }, [pageType, pageId, sort]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <MessageCircle size={14} className="text-muted-foreground" />
          Comments
        </h2>
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5">
          {(['newest', 'most_liked'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setSort(s); loadComments(); }}
              className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
                sort === s ? 'bg-white text-black' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {s === 'newest' ? 'Newest' : 'Most liked'}
            </button>
          ))}
        </div>
      </div>

      {currentUserId ? (
        <CommentForm pageType={pageType} pageId={pageId} onSubmitted={loadComments} />
      ) : (
        <LoginPrompt />
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-24 bg-white/[0.04] rounded" />
              <div className="h-4 w-3/4 bg-white/[0.02] rounded" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground/50 py-6 text-center">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {comments.map(c => (
            <CommentItem key={c.id} comment={c} pageId={pageId} />
          ))}
        </div>
      )}
    </section>
  );
}