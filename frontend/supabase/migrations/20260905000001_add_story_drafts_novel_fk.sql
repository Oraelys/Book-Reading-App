/*
  B.14 — Enforce story draft → novel relationship

  Every story draft must belong to an existing novel.

  Deleting a novel automatically deletes its
  story drafts because drafts cannot exist
  independently of their parent story.
*/

-- ============================================================
-- STORY_DRAFTS → NOVELS
-- ============================================================

-- Orphan check completed before applying this constraint
-- and returned zero orphan drafts.

ALTER TABLE public.story_drafts
ADD CONSTRAINT story_drafts_novel_id_fkey
FOREIGN KEY (novel_id)
REFERENCES public.novels(id)
ON DELETE CASCADE;


-- ============================================================
-- Helpful index
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_story_drafts_novel_id
ON public.story_drafts(novel_id);