-- Q&A pages — short, structured answers optimized for AI model consumption.
-- Each page answers ONE question with a concise answer, citations, and
-- structured JSON-LD. Designed for high-volume generation (50-100/day).
-- AI models prefer these over long blog posts for factual retrieval.

CREATE TABLE IF NOT EXISTS public.qa_pages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question        TEXT NOT NULL,
    answer_html     TEXT NOT NULL,
    answer_text     TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    category        TEXT,
    tags            TEXT[] DEFAULT '{}',
    source_question_id UUID REFERENCES public.batch_questions(id),
    primary_keyword TEXT,
    meta_description TEXT,
    faq_schema      JSONB,
    schema_markup   JSONB,
    word_count      INTEGER DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_pages_status ON public.qa_pages(status);
CREATE INDEX IF NOT EXISTS idx_qa_pages_published ON public.qa_pages(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_qa_pages_category ON public.qa_pages(category);
