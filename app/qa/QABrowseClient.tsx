'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';

interface QAPage {
  slug: string;
  question: string;
  preview: string;
  category: string;
  keyword: string;
  date: string;
}

interface Category {
  name: string;
  count: number;
}

export default function QABrowseClient({
  initialCategories,
  initialPages,
}: {
  initialCategories: Category[];
  initialPages: QAPage[];
}) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = initialPages;
    if (activeCategory) {
      items = items.filter(p => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        p =>
          p.question.toLowerCase().includes(q) ||
          p.preview.toLowerCase().includes(q) ||
          p.keyword.toLowerCase().includes(q)
      );
    }
    return items;
  }, [initialPages, activeCategory, search]);

  return (
    <>
      {/* Search + category filters */}
      <div className="mb-8 space-y-4">
        {/* Search bar */}
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/80 placeholder:text-white/20 focus:border-primary/30 focus:outline-none transition-colors"
          />
        </div>

        {/* Category chips */}
        {initialCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                !activeCategory
                  ? 'bg-primary/15 border-primary/30 text-primary'
                  : 'border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.15]'
              }`}
            >
              All
            </button>
            {initialCategories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(activeCategory === cat.name ? null : cat.name)}
                className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                  activeCategory === cat.name
                    ? 'bg-primary/15 border-primary/30 text-primary'
                    : 'border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.15]'
                }`}
              >
                {cat.name.replace(/_/g, ' ')} ({cat.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/20 text-sm">No matches. Try a different search or category.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((page, i) => (
            <motion.div
              key={page.slug}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.5), duration: 0.25 }}
            >
              <Link
                href={`/qa/${page.slug}`}
                className="block group rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-primary/20 transition-all p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors leading-snug mb-1.5">
                      {page.question}
                    </h3>
                    {page.preview && (
                      <p className="text-[12px] text-white/30 leading-relaxed line-clamp-2">
                        {page.preview}
                      </p>
                    )}
                    <div className="flex items-center gap-2.5 mt-2">
                      {page.category && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/5 text-primary/60 border border-primary/10">
                          {page.category.replace(/_/g, ' ')}
                        </span>
                      )}
                      {page.date && (
                        <span className="text-[10px] text-white/20">{page.date}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-white/15 group-hover:text-primary/50 transition-colors shrink-0 mt-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </>
  );
}
