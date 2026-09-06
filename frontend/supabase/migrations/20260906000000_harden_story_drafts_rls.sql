/*
  B.15 — Secure story_drafts with Row Level Security

  Story drafts belong to novels through novel_id.

  Access is therefore determined by the ownership of the
  parent novel:

    auth.uid()
        ↓
    novels.created_by
        ↓
    story_drafts.novel_id
*/

-- ============================================================
-- STORY DRAFTS RLS
-- ============================================================

ALTER TABLE public.story_drafts ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SELECT
-- ============================================================

CREATE POLICY "Authors can view own story drafts"
ON public.story_drafts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.novels n
    WHERE n.id = story_drafts.novel_id
      AND n.created_by = auth.uid()
  )
);


-- ============================================================
-- INSERT
-- ============================================================

CREATE POLICY "Authors can insert own story drafts"
ON public.story_drafts
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.novels n
    WHERE n.id = story_drafts.novel_id
      AND n.created_by = auth.uid()
  )
);


-- ============================================================
-- UPDATE
-- ============================================================

CREATE POLICY "Authors can update own story drafts"
ON public.story_drafts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.novels n
    WHERE n.id = story_drafts.novel_id
      AND n.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.novels n
    WHERE n.id = story_drafts.novel_id
      AND n.created_by = auth.uid()
  )
);


-- ============================================================
-- DELETE
-- ============================================================

CREATE POLICY "Authors can delete own story drafts"
ON public.story_drafts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.novels n
    WHERE n.id = story_drafts.novel_id
      AND n.created_by = auth.uid()
  )
);