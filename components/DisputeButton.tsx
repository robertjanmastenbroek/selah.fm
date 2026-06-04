'use client';

import { useState } from 'react';
import { CircleAlert, LoaderCircle, Check, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/Toast';

interface DisputeButtonProps {
  submissionId: string;
  onDisputeFiled?: () => void;
}

/**
 * DisputeButton — shown on rejected submissions.
 * Lets creators file a dispute with a reason.
 * Disputes are emailed to admin for manual review.
 */
export default function DisputeButton({ submissionId, onDisputeFiled }: DisputeButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; message?: string; error?: string } | null>(null);
  const { addToast } = useToast();

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      addToast('Please provide a detailed reason (min 10 characters)', 'error');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch(`/api/submissions/${submissionId}/dispute`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();

      if (data.ok) {
        setResult({ ok: true, message: data.message || 'Dispute filed' });
        addToast('Dispute filed successfully', 'success');
        onDisputeFiled?.();
      } else {
        setResult({ ok: false, error: data.error || 'Failed to file dispute' });
        addToast(data.error || 'Failed to file dispute', 'error');
      }
    } catch {
      setResult({ ok: false, error: 'Network error' });
      addToast('Network error', 'error');
    }

    setSubmitting(false);
  };

  return (
    <div>
      {!open && !result?.ok && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors"
        >
          <MessageCircle size={12} />
          Dispute rejection
        </button>
      )}

      {open && !result?.ok && (
        <div className="mt-2 space-y-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <CircleAlert size={14} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-300">Dispute this rejection</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                If you believe this rejection was unfair, explain why. An admin will review your dispute within 48 hours.
              </p>
            </div>
          </div>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Explain why this submission should have been approved..."
            rows={3}
            className="w-full rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-xs text-white placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber-500/30 resize-none"
            maxLength={1000}
          />
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-muted-foreground/40">{reason.length}/1000 · min 10 characters</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setOpen(false); setReason(''); }}
                className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-white transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || reason.trim().length < 10}
                size="sm"
                className="text-[11px] h-7"
              >
                {submitting ? (
                  <><LoaderCircle size={10} className="animate-spin mr-1" /> Submitting</>
                ) : (
                  'Submit dispute'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {result?.ok && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
          <Check size={12} />
          Dispute filed — admin will review
        </div>
      )}

      {result?.ok === false && !open && (
        <button
          onClick={() => { setOpen(true); setResult(null); }}
          className="flex items-center gap-1.5 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors mt-1"
        >
          <MessageCircle size={12} />
          Retry dispute
        </button>
      )}
    </div>
  );
}
