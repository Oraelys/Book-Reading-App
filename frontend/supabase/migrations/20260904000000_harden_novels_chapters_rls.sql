/*
  B.8 — Harden novels and chapters RLS

  Security model:

  NOVELS
  - Public readers can SELECT published novels.
  - Authenticated authors can SELECT their own novels.
  - Authors can INSERT only novels they own.
  - Authors can UPDATE only their own novels.
  - Authors can DELETE only their own novels.

  CHAPTERS
  - Public readers can SELECT published chapters belonging
    to published novels.
  - Authors can SELECT their own novel's chapters.
  - Authors can INSERT chapters only into their own novels.
  - Authors can UPDATE chapters only in their own novels.
  - Authors can DELETE chapters only in their own novels.

  Ownership source:
  novels.created_by = auth.uid()
*/

-- ============================================================
-- NOVELS
-- ============================================================

ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published novels"
ON public.novels;

DROP POLICY IF EXISTS "Authors can view own novels"
ON public.novels;

DROP POLICY IF EXISTS "Authors can insert own novels"
ON public.novels;

DROP POLICY IF EXISTS "Authors can update own novels"
ON public.novels;

DROP POLICY IF EXISTS "Authors can delete own novels"
ON public.novels;


CREATE POLICY "Public can view published novels"
ON public.novels
FOR SELECT
TO public
USING (
  status = 'published'
);


CREATE POLICY "Authors can view own novels"
ON public.novels
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
);


CREATE POLICY "Authors can insert own novels"
ON public.novels
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);


CREATE POLICY "Authors can update own novels"
ON public.novels
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid()
)
WITH CHECK (
  created_by = auth.uid()
);


CREATE POLICY "Authors can delete own novels"
ON public.novels
FOR DELETE
TO authenticated
USING (
  created_by = auth.uid()
);


-- ============================================================
-- CHAPTERS
-- ============================================================

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published chapters"
ON public.chapters;

DROP POLICY IF EXISTS "Authors can view own chapters"
ON public.chapters;

DROP POLICY IF EXISTS "Authors can insert chapters into own novels"
ON public.chapters;

DROP POLICY IF EXISTS "Authors can update own chapters"
ON public.chapters;

DROP POLICY IF EXISTS "Authors can delete own chapters"
ON public.chapters;


CREATE POLICY "Public can view published chapters"
ON public.chapters
FOR SELECT
TO public
USING (
  is_published = true
  AND EXISTS (
    SELECT 1
    FROM public.novels
    WHERE novels.id = chapters.novel_id
      AND novels.status = 'published'
  )
);


CREATE POLICY "Authors can view own chapters"
ON public.chapters
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.novels
    WHERE novels.id = chapters.novel_id
      AND novels.created_by = auth.uid()
  )
);


CREATE POLICY "Authors can insert chapters into own novels"
ON public.chapters
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.novels
    WHERE novels.id = novel_id
      AND novels.created_by = auth.uid()
  )
);


CREATE POLICY "Authors can update own chapters"
ON public.chapters
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.novels
    WHERE novels.id = chapters.novel_id
      AND novels.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.novels
    WHERE novels.id = novel_id
      AND novels.created_by = auth.uid()
  )
);


CREATE POLICY "Authors can delete own chapters"
ON public.chapters
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.novels
    WHERE novels.id = chapters.novel_id
      AND novels.created_by = auth.uid()
  )
);


-- ============================================================
-- Helpful indexes for the RLS relationship checks
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_novels_created_by
ON public.novels(created_by);

CREATE INDEX IF NOT EXISTS idx_chapters_novel_id
ON public.chapters(novel_id);