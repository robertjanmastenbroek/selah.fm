-- Fan collections — Letterboxd-style track curation
-- Users can create public collections of tracks, share via link

CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.artist_tracks(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  note TEXT CHECK (note IS NULL OR char_length(note) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, track_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collections_user ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_created ON public.collections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON public.collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_track ON public.collection_items(track_id);

-- RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collections are public (read)"
  ON public.collections FOR SELECT USING (true);
CREATE POLICY "Users can create own collections"
  ON public.collections FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own collections"
  ON public.collections FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own collections"
  ON public.collections FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Collection items are public (read)"
  ON public.collection_items FOR SELECT USING (true);
CREATE POLICY "Users can add items to own collections"
  ON public.collection_items FOR INSERT WITH CHECK (
    collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can remove items from own collections"
  ON public.collection_items FOR DELETE USING (
    collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())
  );
