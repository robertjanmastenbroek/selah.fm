'use client';

import { useState } from 'react';
import { Bug, TriangleAlert } from 'lucide-react';

const severityOptions = [
  { value: 'low', label: 'Low — cosmetic or minor', color: 'text-blue-400' },
  { value: 'medium', label: 'Medium — something is broken', color: 'text-amber-400' },
  { value: 'high', label: 'High — blocking my workflow', color: 'text-orange-400' },
  { value: 'critical', label: 'Critical — site is down or data lost', color: 'text-red-400' },
];

export default function BugReportForm() {
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setErrorMsg('Please describe the bug in at least 10 characters.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/bugs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, stepsToReproduce: steps, severity }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to submit bug report.' }));
        throw new Error(data.error || 'Failed to submit bug report.');
      }

      setStatus('success');
      setDescription('');
      setSteps('');
      setSeverity('medium');
      setTimeout(() => setStatus('idle'), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const selectedSeverity = severityOptions.find(s => s.value === severity);

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-2 mb-2">
        <Bug size={18} strokeWidth={1.5} className="text-primary/60" />
        <h2 className="font-semibold text-sm">Report a bug</h2>
      </div>

      {/* Description */}
      <div>
        <label className="text-[11px] text-muted-foreground mb-1.5 block">What went wrong?</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          className="w-full rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors resize-none"
          placeholder="Describe the bug clearly — what did you expect to happen, and what actually happened?"
          required
        />
        <p className="text-[10px] text-muted-foreground mt-1">{description.length}/10 min</p>
      </div>

      {/* Steps to reproduce */}
      <div>
        <label className="text-[11px] text-muted-foreground mb-1.5 block">Steps to reproduce (optional)</label>
        <textarea
          value={steps}
          onChange={e => setSteps(e.target.value)}
          rows={3}
          className="w-full rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none transition-colors resize-none"
          placeholder="1. Opened page X\n2. Clicked Y\n3. Saw error..."
        />
      </div>

      {/* Severity */}
      <div>
        <label className="text-[11px] text-muted-foreground mb-1.5 block">Severity</label>
        <div className="grid grid-cols-2 gap-2">
          {severityOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSeverity(opt.value)}
              className={`p-3 rounded-xl border text-left transition-all text-xs ${
                severity === opt.value
                  ? 'border-primary/30 bg-primary/[0.04]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-primary/20'
              }`}
            >
              <span className={`font-medium ${opt.color}`}>{opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}</span>
              <span className="text-muted-foreground block mt-0.5">{opt.label.split(' — ')[1]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status messages */}
      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          <TriangleAlert size={14} />
          {errorMsg}
        </div>
      )}
      {status === 'success' && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400 text-center">
          Bug reported — thank you! The team will review it soon.
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === 'loading' || status === 'success'}
        className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-[0_0_20px_rgba(67,56,202,0.2)] active:scale-[0.98]"
      >
        {status === 'loading' ? 'Submitting...' : status === 'success' ? 'Submitted ✓' : 'Submit bug report'}
      </button>
    </form>
  );
}
