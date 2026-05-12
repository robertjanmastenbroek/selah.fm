'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ExternalLink, MessageCircle, AtSign, Sparkles, Loader2, ChevronRight } from 'lucide-react';

interface Question {
  question: string;
  url: string;
  platform: string;
}

export default function SourceQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [byCategory, setByCategory] = useState<Record<string, Question[]>>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
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

  const goToGenerator = (question: string) => {
    setSelected(question);
    router.push(`/admin/blog-generator?q=${encodeURIComponent(question)}`);
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
            Questions people are actually asking on Reddit and X. Pick one to turn into a blog post.
          </p>
        </div>
        <button
          onClick={fetchQuestions}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm hover:bg-white/[0.08] transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter questions..."
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
        />
      </div>

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
                  return (
                    <button
                      key={i}
                      onClick={() => goToGenerator(q.question)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 group ${
                        selected === q.question
                          ? 'bg-primary/10 border-primary/20'
                          : 'bg-white/[0.02] border-white/[0.04] hover:border-primary/10 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-white group-hover:text-primary transition-colors leading-relaxed">
                          {q.question}
                        </p>
                        {q.url && (
                          <a
                            href={q.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground mt-1.5 transition-colors"
                          >
                            <ExternalLink size={10} /> View source
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground flex items-center gap-1">
                          <PlatformIcon size={10} />
                          {q.platform}
                        </span>
                        <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>
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
              return (
                <button
                  key={i}
                  onClick={() => goToGenerator(q.question)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-3 group ${
                    selected === q.question
                      ? 'bg-primary/10 border-primary/20'
                      : 'bg-white/[0.02] border-white/[0.04] hover:border-primary/10 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white group-hover:text-primary transition-colors leading-relaxed">{q.question}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-muted-foreground flex items-center gap-1">
                      <PlatformIcon size={10} /> {q.platform}
                    </span>
                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
