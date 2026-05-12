'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ExternalLink, MessageCircle, AtSign, Sparkles, Loader2, ChevronRight, CheckSquare, Square, Wand2 } from 'lucide-react';

interface Question {
  question: string;
  url: string;
  platform: string;
}

export default function SourceQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, Question[]>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchResult, setBatchResult] = useState<any>(null);
  const router = useRouter();

  useEffect(() => { fetchQuestions(); }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetch_real_questions' }),
      });
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
      if (data.by_category) setByCategory(data.by_category);
    } catch {}
    setLoading(false);
  };

  const categoryLabels: Record<string, string> = {
    music_promotion: '🎵 Music Promotion',
    creator_income: '💰 Creator Earnings',
    platform_strategy: '📱 Platform Strategy',
    campaign_mechanics: '⚙️ Campaign Mechanics',
    creator_marketplace: '🤝 Creator Marketplace',
    faith_music: '✝️ Faith & Music',
    general: '📋 General Questions',
  };

  const platformIcons: Record<string, any> = {
    reddit: MessageCircle,
    twitter: AtSign,
    curated: Sparkles,
  };

  const toggleSelect = (question: string) => {
    const next = new Set(selected);
    if (next.has(question)) next.delete(question);
    else next.add(question);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size >= filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(q => q.question)));
    }
  };

  const goToGenerator = (question: string) => {
    if (batchGenerating) return;
    router.push(`/admin/blog-generator?q=${encodeURIComponent(question)}`);
  };

  const batchGenerate = async () => {
    if (selected.size === 0) return;
    setBatchGenerating(true);
    setBatchResult(null);

    try {
      const res = await fetch('/api/admin/blog/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_generate',
          questions: Array.from(selected),
        }),
      });
      const data = await res.json();
      setBatchResult(data);
    } catch (e: any) {
      setBatchResult({ error: e.message });
    }
    setBatchGenerating(false);
  };

  const filtered = search
    ? questions.filter(q => q.question.toLowerCase().includes(search.toLowerCase()))
    : questions;

  if (loading) {
    return (
      <div className="p-12 text-center">
        <Loader2 size={24} className="animate-spin mx-auto mb-3 text-primary" />
        <p className="text-sm text-muted-foreground">Fetching real questions from Reddit...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Find Real Questions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Questions people are actually asking. Pick one to generate a blog post, or select multiple for batch.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchQuestions} disabled={loading}
            className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm hover:bg-white/[0.08] transition-colors">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Batch bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={selectAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
          {selected.size >= filtered.length && filtered.length > 0 ? (
            <><CheckSquare size={12} /> Deselect all</>
          ) : (
            <><Square size={12} /> Select all</>
          )}
        </button>

        {selected.size > 0 && (
          <>
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <button onClick={batchGenerate} disabled={batchGenerating}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
              {batchGenerating ? (
                <><Loader2 size={12} className="animate-spin" /> Generating...</>
              ) : (
                <><Wand2 size={12} /> Generate {selected.size} posts</>
              )}
            </button>
          </>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Filter questions..." className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none" />
      </div>

      {/* Batch result */}
      {batchResult && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-600/20 flex items-center justify-center">
              <Sparkles size={12} className="text-purple-400" />
            </div>
            <span className="text-sm font-medium">
              Generated {batchResult.generated || 0} of {batchResult.total || 0} posts
            </span>
          </div>
          {batchResult.posts && batchResult.posts.length > 0 && (
            <div className="space-y-1">
              {batchResult.posts.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="min-w-0 mr-3">
                    <p className="text-xs font-medium truncate">{p.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.question?.slice(0, 80)}</p>
                  </div>
                  <button onClick={() => router.push(`/admin/blog/post/${p.id}`)}
                    className="px-3 py-1 rounded-lg text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 shrink-0 transition-colors">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
          {batchResult.errors && batchResult.errors.length > 0 && (
            <div className="text-xs text-red-400 mt-2">
              {batchResult.errors.length} failed: {batchResult.errors.map((e: any) => e.question?.slice(0, 50)).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* By category */}
      {!search && Object.keys(byCategory).length > 0 && (
        <div className="space-y-4">
          {Object.entries(byCategory).map(([cat, qs]) => (
            <div key={cat}>
              <h2 className="text-xs font-medium text-muted-foreground mb-2 px-1">
                {categoryLabels[cat] || cat}
              </h2>
              <div className="space-y-1">
                {qs.map((q, i) => {
                  const PlatformIcon = platformIcons[q.platform] || Sparkles;
                  const isSelected = selected.has(q.question);
                  return (
                    <div key={i}
                      className={`flex items-start gap-2 p-4 rounded-xl border transition-all group ${
                        isSelected
                          ? 'bg-purple-600/5 border-purple-600/20'
                          : 'bg-white/[0.02] border-white/[0.04] hover:border-primary/10 hover:bg-white/[0.04]'
                      }`}>
                      {/* Checkbox */}
                      <button onClick={() => toggleSelect(q.question)}
                        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
                        {isSelected ? <CheckSquare size={14} className="text-purple-400" /> : <Square size={14} />}
                      </button>

                      {/* Question + click to generate */}
                      <button onClick={() => goToGenerator(q.question)} className="flex-1 text-left min-w-0">
                        <p className="text-sm text-white group-hover:text-primary transition-colors leading-relaxed">
                          {q.question}
                        </p>
                        {q.url && (
                          <a href={q.url} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-1.5 transition-colors">
                            <ExternalLink size={10} /> View source
                          </a>
                        )}
                      </button>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground flex items-center gap-1">
                          <PlatformIcon size={10} /> {q.platform}
                        </span>
                        <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flat list when searching */}
      {search && (
        <div className="space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No questions match "{search}"</p>
          ) : (
            filtered.map((q, i) => {
              const PlatformIcon = platformIcons[q.platform] || Sparkles;
              const isSelected = selected.has(q.question);
              return (
                <div key={i}
                  className={`flex items-start gap-2 p-4 rounded-xl border transition-all group ${
                    isSelected
                      ? 'bg-purple-600/5 border-purple-600/20'
                      : 'bg-white/[0.02] border-white/[0.04] hover:border-primary/10 hover:bg-white/[0.04]'
                  }`}>
                  <button onClick={() => toggleSelect(q.question)}
                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors">
                    {isSelected ? <CheckSquare size={14} className="text-purple-400" /> : <Square size={14} />}
                  </button>
                  <button onClick={() => goToGenerator(q.question)} className="flex-1 text-left min-w-0">
                    <p className="text-sm text-white group-hover:text-primary transition-colors leading-relaxed">{q.question}</p>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground flex items-center gap-1">
                      <PlatformIcon size={10} /> {q.platform}
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
