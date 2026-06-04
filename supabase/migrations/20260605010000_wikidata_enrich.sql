-- Wikidata/Wikipedia enrichment for artist profiles
-- June 5, 2026 — SEO Knowledge Graph integration

-- 1. Enable http extension for Wikidata API calls
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- 2. Add columns to discovered_artists
ALTER TABLE public.discovered_artists ADD COLUMN IF NOT EXISTS wikipedia_url text;
ALTER TABLE public.discovered_artists ADD COLUMN IF NOT EXISTS wikidata_id text;

-- 3. Indexes for fast lookup and NULL-filtered queries
CREATE INDEX IF NOT EXISTS idx_discovered_artists_wikipedia_url
  ON public.discovered_artists(wikipedia_url)
  WHERE wikipedia_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_discovered_artists_wikidata_id
  ON public.discovered_artists(wikidata_id)
  WHERE wikidata_id IS NOT NULL;

-- 4. Function: search Wikidata API for an artist, store result, return enrichment
-- Usage: SELECT public.enrich_wikidata('uuid-here', 'Artist Name');
-- Returns JSONB with found/not found, wikidata_id, wikipedia_url, and metadata
CREATE OR REPLACE FUNCTION public.enrich_wikidata(
  p_artist_id uuid,
  p_artist_name text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '10000ms'
AS $$
DECLARE
  v_url text;
  v_response extensions.http_response;
  v_result jsonb;
  v_search jsonb;
  v_best_match jsonb;
  v_wikidata_id text;
  v_wikipedia_url text;
  v_label text;
  v_description text;
  v_return jsonb;
  v_match_type text;
BEGIN
  -- Build Wikidata search URL
  -- wbsearchentities: search by label
  -- limit=5 to get top candidates for best-match logic
  v_url := 'https://www.wikidata.org/w/api.php'
    || '?action=wbsearchentities'
    || '&search=' || extensions.urlencode(p_artist_name)
    || '&language=en'
    || '&format=json'
    || '&limit=5';

  -- Make synchronous HTTP GET request via http extension
  v_response := extensions.http_get(v_url);

  -- Check for HTTP error
  IF v_response.status != 200 THEN
    v_return := jsonb_build_object(
      'found', false,
      'artist_id', p_artist_id,
      'artist_name', p_artist_name,
      'error', 'Wikidata API returned status ' || v_response.status
    );

    -- Store error in metadata
    UPDATE public.discovered_artists SET
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'wikidata_enrich_error', v_return,
        'wikidata_enriched_at', now()
      )
    WHERE id = p_artist_id;

    RETURN v_return;
  END IF;

  -- Parse JSON response
  BEGIN
    v_result := v_response.content::jsonb;
  EXCEPTION WHEN others THEN
    v_return := jsonb_build_object(
      'found', false,
      'artist_id', p_artist_id,
      'artist_name', p_artist_name,
      'error', 'Failed to parse Wikidata response: ' || SQLERRM
    );

    UPDATE public.discovered_artists SET
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'wikidata_enrich_error', v_return,
        'wikidata_enriched_at', now()
      )
    WHERE id = p_artist_id;

    RETURN v_return;
  END;

  -- Extract best match (first result — highest confidence)
  v_best_match := v_result->'search'->0;

  IF v_best_match IS NULL OR v_best_match->>'id' IS NULL THEN
    v_return := jsonb_build_object(
      'found', false,
      'artist_id', p_artist_id,
      'artist_name', p_artist_name,
      'search_results', COALESCE((v_result->>'search')::text, '0')
    );

    UPDATE public.discovered_artists SET
      metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
        'wikidata_no_match', v_return,
        'wikidata_enriched_at', now()
      )
    WHERE id = p_artist_id;

    RETURN v_return;
  END IF;

  -- Extract fields from best match
  v_wikidata_id := v_best_match->>'id';
  v_label := v_best_match->>'label';
  v_description := v_best_match->>'description';
  v_match_type := v_best_match->>'match';

  -- Construct Wikipedia URL from the Wikidata title
  -- The title from wbsearchentities is the Wikipedia article title
  v_wikipedia_url := 'https://en.wikipedia.org/wiki/'
    || extensions.urlencode(COALESCE(v_best_match->>'title', v_label));

  -- Update the discovered_artists record with wikidata info
  UPDATE public.discovered_artists SET
    wikidata_id = v_wikidata_id,
    wikipedia_url = v_wikipedia_url,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'wikidata_enriched_at', now(),
      'wikidata_label', v_label,
      'wikidata_description', v_description,
      'wikidata_match_type', v_match_type,
      'wikidata_search_term', p_artist_name,
      'wikidata_raw_result', v_best_match
    )
  WHERE id = p_artist_id;

  -- Build return value
  v_return := jsonb_build_object(
    'found', true,
    'artist_id', p_artist_id,
    'artist_name', p_artist_name,
    'wikidata_id', v_wikidata_id,
    'wikipedia_url', v_wikipedia_url,
    'label', v_label,
    'description', v_description,
    'match_type', v_match_type
  );

  RETURN v_return;
END;
$$;

-- 5. RLS: artists/admins can read wikidata fields (existing RLS on discovered_artists covers this)
-- No new RLS needed — wikidata fields are just additional columns on existing table

-- 6. Helper function: batch enrich artists without wikidata
-- Usage: SELECT public.enrich_wikidata_batch(limit_n integer);
-- Returns table of results for each artist processed
CREATE OR REPLACE FUNCTION public.enrich_wikidata_batch(
  p_limit integer DEFAULT 10
) RETURNS TABLE(
  artist_id uuid,
  artist_name text,
  wikidata_id text,
  wikipedia_url text,
  found boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_artist record;
  v_result jsonb;
BEGIN
  FOR v_artist IN
    SELECT da.id, da.artist_name
    FROM public.discovered_artists da
    WHERE da.wikidata_id IS NULL
      AND da.wikipedia_url IS NULL
      AND da.status != 'duplicate'
    ORDER BY da.updated_at ASC NULLS FIRST
    LIMIT p_limit
  LOOP
    v_result := public.enrich_wikidata(v_artist.id, v_artist.artist_name);

    artist_id := v_artist.id;
    artist_name := v_artist.artist_name;
    wikidata_id := v_result->>'wikidata_id';
    wikipedia_url := v_result->>'wikipedia_url';
    found := COALESCE((v_result->>'found')::boolean, false);

    RETURN NEXT;
  END LOOP;
END;
$$;

-- 7. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.enrich_wikidata TO authenticated;
GRANT EXECUTE ON FUNCTION public.enrich_wikidata TO service_role;
GRANT EXECUTE ON FUNCTION public.enrich_wikidata_batch TO authenticated;
GRANT EXECUTE ON FUNCTION public.enrich_wikidata_batch TO service_role;
