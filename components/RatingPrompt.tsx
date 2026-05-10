'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

/** Clickable star rating input */
export function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className="transition-transform active:scale-90 hover:scale-110"
        >
          <Star
            size={22}
            className={i <= value ? 'fill-yellow-400 text-yellow-400' : 'text-white/15'}
            strokeWidth={1}
          />
        </button>
      ))}
    </div>
  );
}

/** Display-only star rating */
export function RatingDisplay({ value, count, size }: { value: number; count?: number; size?: number }) {
  const s = size || 14;
  return (
    <span className="inline-flex items-center gap-0.5">
      <Star size={s} className="fill-yellow-400 text-yellow-400" strokeWidth={1} />
      <span className="text-xs font-medium">{value > 0 ? value.toFixed(1) : '—'}</span>
      {count !== undefined && (
        <span className="text-[10px] text-muted-foreground ml-0.5">({count})</span>
      )}
    </span>
  );
}

/** Inline rating form shown after transaction completes */
export default function RatingPrompt({
  submissionId,
  role,
  targetName,
  onRated,
}: {
  submissionId: string;
  role: 'artist' | 'creator';
  targetName: string;
  onRated: () => void;
}) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState(false);

  // Self-check if already rated
  useEffect(() => {
    fetch(`/api/ratings?submissionId=${submissionId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setDone(true);
        }
      })
      .catch(() => {})
      .finally(() => setChecked(true));
  }, [submissionId]);

  const handleSubmit = async () => {
    if (score < 1) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, score, comment: comment || undefined, role }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Failed to submit');
        setSending(false);
        return;
      }
      setDone(true);
      onRated();
    } catch {
      setError('Network error');
    }
    setSending(false);
  };

  if (done || !checked) return null;

  return (
    <div className="rounded-xl bg-white/[0.03] border border-yellow-400/10 p-4 space-y-3 animate-slide-up">
      <p className="text-sm font-medium">
        {role === 'artist'
          ? `Rate ${targetName}'s work`
          : `Rate your experience with ${targetName}`}
      </p>
      <RatingInput value={score} onChange={setScore} />
      <input
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Leave a comment (optional)"
        className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={score < 1 || sending}
        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity active:scale-[0.97]"
      >
        {sending ? 'Submitting...' : 'Submit rating'}
      </button>
    </div>
  );
}
