/*
  B.22 — Make novel aggregate counter updates atomic.

  Counters affected:
    - novels.total_chapters
    - novels.published_chapters
    - novels.word_count

  These functions perform arithmetic directly inside PostgreSQL
  so concurrent requests cannot overwrite each other's updates.

  The functions are SECURITY DEFINER because the NestJS backend
  connects with the Supabase service-role key.

  Direct client execution is revoked.
*/

-- ============================================================
-- TOTAL CHAPTERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_chapter_count(
    novel_uuid uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.novels
    SET
        total_chapters = COALESCE(total_chapters, 0) + 1,
        updated_at = NOW()
    WHERE id = novel_uuid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Novel not found: %', novel_uuid
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;


CREATE OR REPLACE FUNCTION public.decrement_chapter_count(
    novel_uuid uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.novels
    SET
        total_chapters = GREATEST(
            COALESCE(total_chapters, 0) - 1,
            0
        ),
        updated_at = NOW()
    WHERE id = novel_uuid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Novel not found: %', novel_uuid
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;


-- ============================================================
-- PUBLISHED CHAPTERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.increment_published_count(
    novel_uuid uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.novels
    SET
        published_chapters = COALESCE(published_chapters, 0) + 1,
        updated_at = NOW()
    WHERE id = novel_uuid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Novel not found: %', novel_uuid
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;


CREATE OR REPLACE FUNCTION public.decrement_published_count(
    novel_uuid uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.novels
    SET
        published_chapters = GREATEST(
            COALESCE(published_chapters, 0) - 1,
            0
        ),
        updated_at = NOW()
    WHERE id = novel_uuid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Novel not found: %', novel_uuid
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;


-- ============================================================
-- WORD COUNT
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_novel_word_count(
    novel_uuid uuid,
    word_difference integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.novels
    SET
        word_count = GREATEST(
            COALESCE(word_count, 0) + word_difference,
            0
        ),
        updated_at = NOW()
    WHERE id = novel_uuid;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Novel not found: %', novel_uuid
            USING ERRCODE = 'P0002';
    END IF;
END;
$$;


-- ============================================================
-- SECURITY
-- ============================================================

REVOKE ALL
ON FUNCTION public.increment_chapter_count(uuid)
FROM PUBLIC, anon, authenticated;

REVOKE ALL
ON FUNCTION public.decrement_chapter_count(uuid)
FROM PUBLIC, anon, authenticated;

REVOKE ALL
ON FUNCTION public.increment_published_count(uuid)
FROM PUBLIC, anon, authenticated;

REVOKE ALL
ON FUNCTION public.decrement_published_count(uuid)
FROM PUBLIC, anon, authenticated;

REVOKE ALL
ON FUNCTION public.update_novel_word_count(uuid, integer)
FROM PUBLIC, anon, authenticated;


GRANT EXECUTE
ON FUNCTION public.increment_chapter_count(uuid)
TO service_role;

GRANT EXECUTE
ON FUNCTION public.decrement_chapter_count(uuid)
TO service_role;

GRANT EXECUTE
ON FUNCTION public.increment_published_count(uuid)
TO service_role;

GRANT EXECUTE
ON FUNCTION public.decrement_published_count(uuid)
TO service_role;

GRANT EXECUTE
ON FUNCTION public.update_novel_word_count(uuid, integer)
TO service_role;