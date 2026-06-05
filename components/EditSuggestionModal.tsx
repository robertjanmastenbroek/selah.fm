'use client';

import { useState, useCallback } from 'react';

interface EditSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  artistId: string;
  artistName: string;
  currentBio?: string;
  currentGenres: string[];
  initialField?: string;
}

const FIELD_OPTIONS = [
  { value: 'bio', label: 'Bio', icon: '✏️' },
  { value: 'genre', label: 'Genre', icon: '🏷️' },
  { value: 'track', label: 'Track listing', icon: '🎵' },
  { value: 'social_link', label: 'Social links', icon: '🔗' },
  { value: 'image', label: 'Images', icon: '🖼️' },
  { value: 'other', label: 'Other', icon: '⋯' },
] as const;

export default function EditSuggestionModal({
  isOpen,
  onClose,
  artistId,
  artistName,
  currentBio,
  currentGenres,
  initialField,
}: EditSuggestionModalProps) {
  const [step, setStep] = useState<'field' | 'form' | 'confirm'>(initialField ? 'form' : 'field');
  const [selectedField, setSelectedField] = useState(initialField || '');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionId, setSuggestionId] = useState<string | null>(null);

  // Track name + action for track suggestions
  const [trackName, setTrackName] = useState('');
  const [trackAction, setTrackAction] = useState<'missing' | 'incorrect'>('missing');

  const reset = useCallback(() => {
    setStep('field');
    setSelectedField(initialField || '');
    setSuggestedValue('');
    setReason('');
    setError(null);
    setSuggestionId(null);
    setTrackName('');
    setTrackAction('missing');
  }, [initialField]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFieldSelect = useCallback((field: string) => {
    setSelectedField(field);
    setStep('form');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedField) return;
    setSubmitting(true);
    setError(null);

    let value = suggestedValue;
    if (selectedField === 'track') {
      value = `${trackAction}: ${trackName}`;
    }
    if (!value || value.length < 2) {
      setError('Please provide details about your suggestion.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/artist/${artistId === 'new' ? '' : window.location.pathname.split('/').pop()}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion: {
            field_name: selectedField,
            suggested_value: value,
            reason: reason || undefined,
          },
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError('You\'ve submitted suggestions today. Please try again tomorrow.');
        } else if (res.status === 401) {
          window.location.href = '/login';
          return;
        } else {
          setError(data.error || 'Failed to submit suggestion.');
        }
        setSubmitting(false);
        return;
      }

      setSuggestionId(data.suggestion_id);
      setStep('confirm');
      setSubmitting(false);
    } catch (e: any) {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }, [selectedField, suggestedValue, reason, trackName, trackAction, artistId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl bg-background border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold">
            {step === 'confirm'
              ? 'Suggestion submitted'
              : `Help improve ${artistName}'s page`}
          </h2>
          <p className="text-[11px] text-muted-foreground/50 mt-1">
            Your suggestions help fans and creators discover the right info.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
              {error}
            </div>
          )}

          {/* Step 1: Field selector */}
          {step === 'field' && (
            <div className="grid grid-cols-2 gap-2">
              {FIELD_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFieldSelect(f.value)}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] text-left transition-all"
                >
                  <span className="text-sm">{f.icon}</span>
                  <span className="text-[12px] font-medium">{f.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Field-specific form */}
          {step === 'form' && (
            <div className="space-y-4">
              {/* Bio */}
              {selectedField === 'bio' && (
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground/60 mb-1.5">What's wrong with the current bio?</label>
                  {currentBio && (
                    <div className="mb-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[10px] text-muted-foreground/50 max-h-20 overflow-y-auto">
                      Current: {currentBio.slice(0, 200)}...
                    </div>
                  )}
                  <textarea
                    value={suggestedValue}
                    onChange={(e) => setSuggestedValue(e.target.value)}
                    placeholder="Describe what should be changed or corrected..."
                    rows={4}
                    className="w-full text-[12px] rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:border-primary/40"
                    maxLength={5000}
                  />
                </div>
              )}

              {/* Genre */}
              {selectedField === 'genre' && (
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground/60 mb-1.5">Current genres</label>
                  {currentGenres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {currentGenres.map((g) => (
                        <span key={g} className="px-2 py-0.5 rounded-full bg-white/[0.04] text-[10px] text-muted-foreground/60 border border-white/[0.06]">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                  <label className="block text-[11px] font-medium text-muted-foreground/60 mb-1.5">Suggested genre(s)</label>
                  <input
                    value={suggestedValue}
                    onChange={(e) => setSuggestedValue(e.target.value)}
                    placeholder="e.g. Indie Rock, Alternative"
                    className="w-full text-[12px] rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
                    maxLength={200}
                  />
                </div>
              )}

              {/* Track */}
              {selectedField === 'track' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground/60 mb-1.5">Action</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTrackAction('missing')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${trackAction === 'missing' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/[0.04] text-muted-foreground/60 border border-white/[0.06] hover:bg-white/[0.08]'}`}
                      >
                        Missing track
                      </button>
                      <button
                        onClick={() => setTrackAction('incorrect')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${trackAction === 'incorrect' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/[0.04] text-muted-foreground/60 border border-white/[0.06] hover:bg-white/[0.08]'}`}
                      >
                        Incorrect track
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground/60 mb-1.5">Track name</label>
                    <input
                      value={trackName}
                      onChange={(e) => setTrackName(e.target.value)}
                      placeholder="Enter track name..."
                      className="w-full text-[12px] rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
                      maxLength={200}
                    />
                  </div>
                </div>
              )}

              {/* Social links */}
              {selectedField === 'social_link' && (
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground/60 mb-1.5">Social link URL</label>
                  <input
                    value={suggestedValue}
                    onChange={(e) => setSuggestedValue(e.target.value)}
                    placeholder="https://instagram.com/artistname"
                    className="w-full text-[12px] rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
                    maxLength={500}
                  />
                  <p className="text-[9px] text-muted-foreground/30 mt-1">Include the platform name in your description.</p>
                </div>
              )}

              {/* Image */}
              {selectedField === 'image' && (
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground/60 mb-1.5">Image URL</label>
                  <input
                    value={suggestedValue}
                    onChange={(e) => setSuggestedValue(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-[12px] rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/40"
                    maxLength={500}
                  />
                  <p className="text-[9px] text-muted-foreground/30 mt-1">Provide a URL to the correct image. Must be publicly accessible.</p>
                </div>
              )}

              {/* Other */}
              {selectedField === 'other' && (
                <div>
                  <label className="block text-[11px] font-medium text-muted-foreground/60 mb-1.5">Describe what needs to change</label>
                  <textarea
                    value={suggestedValue}
                    onChange={(e) => setSuggestedValue(e.target.value)}
                    placeholder="Tell us what's wrong and what should be different..."
                    rows={4}
                    className="w-full text-[12px] rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:border-primary/40"
                    maxLength={5000}
                  />
                </div>
              )}

              {/* Reason (optional for all fields) */}
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground/60 mb-1.5">
                  Why are you suggesting this change? <span className="text-muted-foreground/30">(optional)</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="This helps our moderators review your suggestion faster..."
                  rows={2}
                  className="w-full text-[12px] rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2.5 text-foreground placeholder:text-muted-foreground/30 resize-none focus:outline-none focus:border-primary/40"
                  maxLength={2000}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirm' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <span className="text-2xl">✅</span>
              <p className="text-[12px] text-center text-foreground/80">
                Thanks! Your suggestion has been submitted for review.
              </p>
              {suggestionId && (
                <p className="text-[9px] text-muted-foreground/30">
                  Reference: {suggestionId.slice(0, 8)}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/50 text-center">
                You'll get a notification when it's been reviewed.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between">
          <button
            onClick={step === 'confirm' ? handleClose : () => step === 'form' ? setStep('field') : handleClose}
            className="px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-muted-foreground/60 text-[11px] transition-all"
          >
            {step === 'confirm' ? 'Close' : 'Back'}
          </button>

          {step === 'form' && (
            <button
              onClick={handleSubmit}
              disabled={submitting || (!suggestedValue && !trackName)}
              className="px-5 py-2 rounded-lg bg-primary/80 hover:bg-primary text-white text-[11px] font-medium transition-all disabled:opacity-40"
            >
              {submitting ? 'Submitting...' : 'Submit suggestion'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
