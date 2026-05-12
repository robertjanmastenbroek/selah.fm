-- Migration 010: Batch Blog System
-- Monthly batch workflow for generating 30 SEO blog posts from founder interviews.

-- Batches represent a monthly content generation cycle
CREATE TABLE IF NOT EXISTS batches (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year  TEXT NOT NULL,           -- e.g. "2026-06"
    status      TEXT NOT NULL DEFAULT 'sourcing'
                CHECK (status IN ('sourcing','interviewing','answers_complete','generating','generated','archived')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Raw questions sourced from Reddit, X, or fallback
CREATE TABLE IF NOT EXISTS batch_questions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id     UUID NOT NULL REFERENCES batches(id),
    raw_question TEXT NOT NULL,
    source_url   TEXT,
    platform     TEXT NOT NULL CHECK (platform IN ('reddit', 'twitter', 'fallback', 'manual')),
    category     TEXT,                   -- e.g. 'cpm_strategy', 'music_promotion', 'creator_income'
    score        FLOAT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generated interviews (4-6 questions each derived from a source question)
CREATE TABLE IF NOT EXISTS batch_interviews (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id            UUID NOT NULL REFERENCES batches(id),
    question_id         UUID NOT NULL REFERENCES batch_questions(id),
    generated_questions JSONB NOT NULL DEFAULT '[]',  -- [{question: "..."}]
    founder_answers     JSONB,         -- [{question: "...", answer: "..."}]
    transcript          TEXT,           -- combined text of all answers
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_progress','answered','converted')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Voice library: chunked interview transcripts with embeddings
CREATE TABLE IF NOT EXISTS voice_chunks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id  UUID NOT NULL REFERENCES batch_interviews(id),
    chunk_text    TEXT NOT NULL,
    embedding     JSONB,               -- vector stored as JSON array
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Blog posts generated from interviews
CREATE TABLE IF NOT EXISTS blog_posts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_id     UUID REFERENCES batch_interviews(id),
    title            TEXT NOT NULL,
    slug             TEXT NOT NULL UNIQUE,
    content_html     TEXT NOT NULL,
    excerpt          TEXT,
    featured_image   TEXT,
    meta_title       TEXT,
    meta_description TEXT,
    tags             TEXT[] DEFAULT '{}',
    image_suggestions JSONB,          -- [{type: "featured", description: "..."}]
    schema_markup    JSONB,           -- JSON-LD Article schema
    status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','scheduled','published')),
    publish_at       TIMESTAMPTZ,
    published_at     TIMESTAMPTZ,
    author_id        UUID REFERENCES users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_at ON blog_posts(publish_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_batch_questions_batch ON batch_questions(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_interviews_batch ON batch_interviews(batch_id);
CREATE INDEX IF NOT EXISTS idx_voice_chunks_interview ON voice_chunks(interview_id);
