'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, ThumbsUp, User, X } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  display_name: string;
  user_id: string;
  created_at: string;
  updated_at: string | null;
  is_featured: boolean;
  response_text: string | null;
  response_at: string | null;
}

interface Props {
  artistId: string;
  currentUserId?: string;
}

export default function ReviewSection({ artistId, currentUserId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    fetch(`/api/reviews?artistId=${artistId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.reviews) setReviews(d.reviews); })
      .catch(e => console.error('Reviews load error:', e))
      .finally(() => setLoading(false));
  }, [artistId]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.length < 10) { setError('Review must be at least 10 characters'); return; }
    if (content.length > 2000) { setError('Review must be under 2000 characters'); return; }
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId, rating, title, content }),
      });
      const data = await res.json();
      if (data.review) {
        setSuccess('Review submitted!');
        setShowForm(false);
        setRating(5);
        setTitle('');
        setContent('');
        // Reload reviews
        const r = await fetch(`/api/reviews?artistId=${artistId}`, { credentials: 'include' });
        const rd = await r.json();
        if (rd.reviews) setReviews(rd.reviews);
        addToast('Review submitted!', 'success');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch { setError('Network error'); }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  const starRow = (n: number, interactive = false) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type={interactive ? 'button' : undefined}
          onClick={interactive ? () => setRating(s) : undefined}
          className={`transition-all ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}>
          <Star size={interactive ? 20 : 12} fill={s <= n ? '#F59E0B' : 'none'} stroke={s <= n ? '#F59E0B' : 'currentColor'} strokeWidth={1.5} className={s <= n ? 'text-amber-400' : 'text-muted-foreground/30'} />
        </button>
      ))}
    </div>
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <MessageSquare size={14} className="text-primary" />
          Reviews {reviews.length > 0 && <span className="text-muted-foreground/60 font-normal">({reviews.length})</span>}
        </h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {starRow(Math.round(parseFloat(avgRating)))}
            <span className="font-semibold">{avgRating}</span>
          </div>
        )}
      </div>

      {/* Write review button */}
      {currentUserId && !showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full py-2.5 rounded-xl border border-dashed border-white/[0.08] text-xs text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-all">
          + Write a review
        </button>
      )}

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            onSubmit={submitReview} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">{starRow(rating, true)}</div>
              <button type="button" onClick={() => setShowForm(false)}><X size={16} className="text-muted-foreground" /></button>
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)"
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm focus:outline-none focus:border-primary/30" />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What do you think about this artist?"
              rows={3} maxLength={2000} required
              className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-sm resize-y focus:outline-none focus:border-primary/30" />
            <div className="flex items-center justify-between text-xs text-muted-foreground/50">
              <span>{content.length}/2000</span>
              {error && <span className="text-red-400">{error}</span>}
              <button type="submit" disabled={submitting || content.length < 10}
                className="px-4 py-1.5 rounded-lg bg-primary text-white font-medium disabled:opacity-40 hover:opacity-90 transition-all">
                {submitting ? 'Submitting...' : 'Submit review'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {success && <p className="text-xs text-emerald-400 text-center">{success}</p>}

      {/* Review list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse rounded-xl bg-white/[0.03] p-4 space-y-2">
              <div className="h-3 w-24 bg-white/[0.04] rounded" />
              <div className="h-2 w-full bg-white/[0.02] rounded" />
              <div className="h-2 w-3/4 bg-white/[0.02] rounded" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 text-center py-6">No reviews yet. Be the first!</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className={`rounded-xl p-4 border ${r.is_featured ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'border-white/[0.04] bg-white/[0.02]'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center">
                    {r.display_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{r.display_name || 'Anonymous'}</p>
                    <p className="text-[9px] text-muted-foreground/40">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {starRow(r.rating)}
              </div>
              {r.title && <p className="text-sm font-semibold mb-1">{r.title}</p>}
              <p className="text-xs text-muted-foreground/70 leading-relaxed">{r.content}</p>
              
              {/* Artist response */}
              {r.response_text && (
                <div className="mt-3 pt-3 border-t border-white/[0.04] pl-3 border-l-2 border-primary/20">
                  <p className="text-[10px] text-primary/60 font-medium mb-1">Artist response</p>
                  <p className="text-xs text-muted-foreground/60">{r.response_text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
