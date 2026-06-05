'use client';

import { useState, useCallback } from 'react';

interface HelpfulSurveyProps {
  artistId: string;
  artistSlug: string;
  artistName: string;
  userId?: string;
  hasExistingContributions?: number;
}

type SurveyState = 'idle' | 'voted_helpful' | 'voted_not_helpful' | 'feedback_selected' | 'submitting' | 'submitted';

const FEEDBACK_OPTIONS = [
  { value: 'wrong_genre', label: 'Wrong genre' },
  { value: 'missing_tracks', label: 'Missing tracks' },
  { value: 'bio_incorrect', label: 'Bio is incorrect' },
  { value: 'other', label: 'Other' },
] as const;

export default function HelpfulSurvey({
  artistId,
  artistSlug,
  artistName,
  userId,
  hasExistingContributions,
}: HelpfulSurveyProps) {
  const [surveyState, setSurveyState] = useState<SurveyState>('idle');
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = useCallback(async (helpful: boolean) => {
    setError(null);
    try {
      const res = await fetch(`/api/artist/${artistSlug}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setSurveyState('idle');
          setError('Too many submissions — please wait before trying again.');
          return;
        }
        throw new Error(data.error || 'Failed to submit');
      }
      if (helpful) {
        setSurveyState('voted_helpful');
      } else {
        setSurveyState('voted_not_helpful');
      }
    } catch (e: any) {
      setSurveyState('idle');
      setError(e.message || 'Something went wrong. Please try again.');
    }
  }, [artistSlug]);

  const submitSuggestion = useCallback(async () => {
    if (!selectedFeedback) return;
    setSurveyState('submitting');
    setError(null);

    // If not logged in, redirect to login with return URL
    if (!userId) {
      window.location.href = `/login?redirect=/artist/${artistSlug}?suggest=${selectedFeedback}`;
      return;
    }

    try {
      // For structured feedback types, we open the edit modal instead
      // For now, submit a basic suggestion
      const res = await fetch(`/api/artist/${artistSlug}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion: {
            field_name: selectedFeedback === 'wrong_genre' ? 'genre'
              : selectedFeedback === 'missing_tracks' ? 'track'
              : selectedFeedback === 'bio_incorrect' ? 'bio'
              : 'other',
            suggested_value: '',
            reason: selectedFeedback,
          },
        }),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 429) {
          setSurveyState('voted_not_helpful');
          setError('You\'ve submitted suggestions today. Please try again tomorrow.');
          return;
        }
        if (res.status === 401) {
          window.location.href = `/login?redirect=/artist/${artistSlug}`;
          return;
        }
        throw new Error(data.error || 'Failed to submit');
      }

      setSurveyState('submitted');
    } catch (e: any) {
      setSurveyState('voted_not_helpful');
      setError(e.message || 'Something went wrong.');
    }
  }, [selectedFeedback, artistSlug, userId]);

  // ── Don't render if user has already contributed significantly ──
  if (hasExistingContributions && hasExistingContributions >= 3) {
    return (
      <div className="mt-8 pt-6 border-t border-white/[0.06]">
        <p className="text-[11px] text-muted-foreground/40 text-center">
          You've contributed to this page · <a href={`/artist/${artistSlug}`} className="text-primary/60 hover:text-primary transition-colors">View history</a>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 pt-6 border-t border-white/[0.06]">
      {surveyState === 'idle' && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] text-muted-foreground/50 font-medium">
            Was this artist page helpful?
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => submitFeedback(true)}
              className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] hover:text-green-400 text-muted-foreground/60 text-sm transition-all active:scale-95"
              title="Yes, this page was helpful"
            >
              👍
            </button>
            <button
              onClick={() => submitFeedback(false)}
              className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] hover:text-red-400 text-muted-foreground/60 text-sm transition-all active:scale-95"
              title="No, this page needs improvement"
            >
              👎
            </button>
          </div>
          {error && <p className="text-[10px] text-red-400">{error}</p>}
        </div>
      )}

      {surveyState === 'voted_helpful' && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-[11px] text-muted-foreground/50">
            Glad it helped! {userId ? 'You\'ve helped improve this page.' : ''}
          </p>
          {!userId && (
            <a
              href={`/login?redirect=/artist/${artistSlug}`}
              className="text-[10px] text-primary/60 hover:text-primary transition-colors"
            >
              Sign in to suggest edits →
            </a>
          )}
        </div>
      )}

      {surveyState === 'voted_not_helpful' && !selectedFeedback && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] text-muted-foreground/50 font-medium">
            What's wrong?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {FEEDBACK_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedFeedback(opt.value)}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground/60 hover:text-foreground text-[10px] transition-all"
              >
                {opt.label}
              </button>
            ))}
          </div>
          {error && <p className="text-[10px] text-red-400">{error}</p>}
        </div>
      )}

      {surveyState === 'voted_not_helpful' && selectedFeedback && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-[11px] text-muted-foreground/50">
            {userId
              ? 'Submit your suggestion for review?'
              : 'Sign in to submit your suggestion'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={submitSuggestion}
              disabled={surveyState === 'submitting'}
              className="px-4 py-1.5 rounded-lg bg-primary/80 hover:bg-primary text-white text-[10px] font-medium transition-all disabled:opacity-40"
            >
              {surveyState === 'submitting' ? 'Submitting...' : userId ? 'Submit suggestion' : 'Sign in'}
            </button>
            <button
              onClick={() => { setSelectedFeedback(null); setError(null); }}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground/60 text-[10px] transition-all"
            >
              Back
            </button>
          </div>
          {error && <p className="text-[10px] text-red-400">{error}</p>}
        </div>
      )}

      {surveyState === 'submitted' && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-[11px] text-green-400/70">
            Thanks! Your suggestion has been submitted for review.
          </p>
        </div>
      )}
    </div>
  );
}
