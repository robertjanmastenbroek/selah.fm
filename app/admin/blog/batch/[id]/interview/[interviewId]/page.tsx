'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Save, CircleCheck, Circle, CircleAlert } from 'lucide-react';

export default function InterviewEditorPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params.id as string;
  const interviewId = params.interviewId as string;

  const [interview, setInterview] = useState<any>(null);
  const [batch, setBatch] = useState<any>(null);
  const [allInterviews, setAllInterviews] = useState<any[]>([]);
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');

  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Fetch interview data
  const fetchInterview = useCallback(async () => {
    const res = await fetch(`/api/admin/blog/batch?batchId=${batchId}`);
    const data = await res.json();
    setBatch(data.batch);
    setAllInterviews(data.interviews || []);

    const current = (data.interviews || []).find((i: any) => i.id === interviewId);
    setInterview(current);

    if (current?.founder_answers) {
      const existing = typeof current.founder_answers === 'string'
        ? JSON.parse(current.founder_answers)
        : current.founder_answers;
      setAnswers(existing || []);
    } else if (current?.generated_questions) {
      const genQs = typeof current.generated_questions === 'string'
        ? JSON.parse(current.generated_questions)
        : current.generated_questions;
      // Initialize empty answers
      const init = (genQs || []).map((q: any) => ({
        question: typeof q === 'string' ? q : q.question,
        answer: '',
      }));
      setAnswers(init);
    }

    setLoading(false);
  }, [batchId, interviewId]);

  useEffect(() => { fetchInterview(); }, [fetchInterview]);

  // Find current interview index for prev/next
  const currentIndex = allInterviews.findIndex((i: any) => i.id === interviewId);
  const prevInterview = currentIndex > 0 ? allInterviews[currentIndex - 1] : null;
  const nextInterview = currentIndex < allInterviews.length - 1 ? allInterviews[currentIndex + 1] : null;

  const answeredCount = allInterviews.filter((i: any) => i.status === 'answered' || i.status === 'converted').length;
  const totalCount = allInterviews.length;
  const progress = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  // Auto-save every 30 seconds
  const saveAnswers = useCallback(async (answersToSave: typeof answers, showToast = false) => {
    const answerStr = JSON.stringify(answersToSave);
    if (answerStr === lastSavedRef.current) return; // No changes
    lastSavedRef.current = answerStr;

    setSaving(true);
    try {
      await fetch('/api/admin/blog/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_answers',
          batchId,
          interviewId,
          answers: answersToSave,
        }),
      });
      if (showToast) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
      // Refresh to update interview count
      const res = await fetch(`/api/admin/blog/batch?batchId=${batchId}`);
      const data = await res.json();
      setAllInterviews(data.interviews || []);
    } catch (e: any) {
      setMessage(e.message);
    }
    setSaving(false);
  }, [batchId, interviewId]);

  // Set up auto-save
  useEffect(() => {
    if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    autoSaveRef.current = setInterval(() => {
      if (answers.some(a => a.answer.trim())) {
        saveAnswers(answers, false);
      }
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [answers, saveAnswers]);

  // Save on unmount / navigation
  useEffect(() => {
    return () => {
      if (answers.some(a => a.answer.trim())) {
        saveAnswers(answers, false);
      }
    };
  }, []);

  const updateAnswer = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = { ...updated[index], answer: value };
    setAnswers(updated);
  };

  const handleSave = () => saveAnswers(answers, true);

  // Find source question
  const sourceQuestion = interview?.raw_question || '';

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Loading interview...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive">Interview not found</p>
        <Link href={`/admin/blog/batch/${batchId}`} className="text-sm text-primary hover:underline mt-2 inline-block">
          Back to batch
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/blog/batch/${batchId}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-bold">Interview {currentIndex + 1} of {totalCount}</h1>
            <p className="text-[10px] text-muted-foreground">Batch: {batch?.month_year}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save indicator */}
          <span className={`text-[10px] flex items-center gap-1 ${saving ? 'text-amber-400' : saved ? 'text-emerald-400' : 'text-muted-foreground'}`}>
            {saving ? (
              <><div className="w-2.5 h-2.5 border border-amber-400/30 border-t-amber-400 rounded-full animate-spin" /> Saving...</>
            ) : saved ? (
              <><CircleCheck size={12} /> Saved</>
            ) : null}
          </span>

          {/* Prev */}
          {prevInterview && (
            <button
              onClick={() => router.push(`/admin/blog/batch/${batchId}/interview/${prevInterview.id}`)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs hover:bg-white/[0.06] transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={12} /> Prev
            </button>
          )}

          {/* Next */}
          {nextInterview && (
            <button
              onClick={() => router.push(`/admin/blog/batch/${batchId}/interview/${nextInterview.id}`)}
              className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs hover:bg-white/[0.06] transition-colors flex items-center gap-1"
            >
              Next <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-muted-foreground">Batch progress</span>
          <span className="text-[10px] text-muted-foreground">{answeredCount}/{totalCount} answered</span>
        </div>
        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {message && (
        <div className="text-xs px-3 py-2 rounded-lg bg-destructive/10 text-destructive">{message}</div>
      )}

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* LEFT: Source question */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CircleAlert size={14} className="text-primary/60" />
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source Question</h2>
          </div>
          <p className="text-sm leading-relaxed">{sourceQuestion}</p>
          <div className="flex gap-2 text-[10px] text-muted-foreground/60">
            {interview.platform && <span className="px-2 py-0.5 rounded-full bg-white/[0.04]">{interview.platform}</span>}
            {interview.category && <span className="px-2 py-0.5 rounded-full bg-white/[0.04]">{interview.category}</span>}
          </div>
          {interview.source_url && (
            <a href={interview.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline block">
              View source →
            </a>
          )}
        </div>

        {/* RIGHT: Interview questions + answer fields */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleCheck size={14} className="text-primary/60" />
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Answers</h2>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-semibold hover:opacity-90 disabled:opacity-50"
            >
              <Save size={10} /> Save now
            </button>
          </div>

          {answers.map((item, i) => (
            <div key={i} className="space-y-2">
              <label className="text-xs font-medium text-foreground/80 block">
                {i + 1}. {item.question}
              </label>
              <textarea
                value={item.answer}
                onChange={e => updateAnswer(i, e.target.value)}
                placeholder="Write your answer here... (auto-saves every 30s)"
                rows={4}
                className="w-full rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 resize-y transition-colors"
              />
            </div>
          ))}

          {answers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No interview questions generated yet. Run &quot;Generate Interviews&quot; from the blog dashboard.
            </p>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
        <div>
          {prevInterview ? (
            <button
              onClick={() => router.push(`/admin/blog/batch/${batchId}/interview/${prevInterview.id}`)}
              className="px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] text-sm hover:bg-white/[0.06] transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={14} /> Previous Interview
            </button>
          ) : (
            <div />
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Circle size={8} className={currentIndex >= 0 ? 'text-primary' : 'text-muted-foreground/30'} />
          <span>{currentIndex + 1} / {totalCount}</span>
        </div>

        <div>
          {nextInterview ? (
            <button
              onClick={async () => {
                // Save before navigating
                if (answers.some(a => a.answer.trim())) {
                  await saveAnswers(answers, false);
                }
                router.push(`/admin/blog/batch/${batchId}/interview/${nextInterview.id}`);
              }}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Next Interview <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <CircleCheck size={14} /> Complete & Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
