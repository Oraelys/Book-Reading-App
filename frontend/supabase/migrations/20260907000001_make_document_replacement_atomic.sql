CREATE OR REPLACE FUNCTION public.replace_novel_chapters(
    p_novel_id uuid,
    p_chapters jsonb
)
RETURNS SETOF public.chapters
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_chapter_count integer;
    v_published_count integer;
    v_word_count integer;
BEGIN
    /*
     * Make sure the novel exists.
     */
    IF NOT EXISTS (
        SELECT 1
        FROM public.novels
        WHERE id = p_novel_id
    ) THEN
        RAISE EXCEPTION 'Novel not found: %', p_novel_id
            USING ERRCODE = 'P0002';
    END IF;

    /*
     * Replace the chapter set atomically.
     */
    DELETE FROM public.chapters
    WHERE novel_id = p_novel_id;

    INSERT INTO public.chapters (
        novel_id,
        title,
        chapter_number,
        content,
        word_count,
        estimated_read_time,
        is_published,
        published_at,
        created_at,
        updated_at
    )
    SELECT
        p_novel_id,
        COALESCE(
            chapter->>'title',
            'Chapter ' || (row_number() OVER (
                ORDER BY COALESCE(
                    (chapter->>'chapter_number')::integer,
                    2147483647
                )
            ))::text
        ),
        COALESCE(
            (chapter->>'chapter_number')::integer,
            row_number() OVER (
                ORDER BY COALESCE(
                    (chapter->>'chapter_number')::integer,
                    2147483647
                )
            )::integer
        ),
        COALESCE(chapter->>'content', ''),
        COALESCE(
            (chapter->>'word_count')::integer,
            0
        ),
        COALESCE(
            (chapter->>'estimated_read_time')::integer,
            0
        ),
        false,
        NULL,
        NOW(),
        NOW()
    FROM jsonb_array_elements(p_chapters) AS chapter;

    /*
     * Recalculate the aggregate values from the
     * actual chapter records rather than incrementing
     * old values.
     */
    SELECT
        COUNT(*)::integer,
        COUNT(*) FILTER (
            WHERE is_published = true
        )::integer,
        COALESCE(
            SUM(COALESCE(word_count, 0)),
            0
        )::integer
    INTO
        v_chapter_count,
        v_published_count,
        v_word_count
    FROM public.chapters
    WHERE novel_id = p_novel_id;

    /*
     * Synchronize the novel aggregates.
     */
    UPDATE public.novels
    SET
        total_chapters = v_chapter_count,
        published_chapters = v_published_count,
        word_count = v_word_count,
        updated_at = NOW()
    WHERE id = p_novel_id;

    /*
     * Return the newly-created chapters.
     */
    RETURN QUERY
    SELECT *
    FROM public.chapters
    WHERE novel_id = p_novel_id
    ORDER BY chapter_number ASC;
END;
$function$;


REVOKE EXECUTE
ON FUNCTION public.replace_novel_chapters(uuid, jsonb)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.replace_novel_chapters(uuid, jsonb)
TO service_role;