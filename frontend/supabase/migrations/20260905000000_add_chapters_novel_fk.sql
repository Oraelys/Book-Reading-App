/*
  B.12 — Enforce chapter → novel relationship

  Every chapter must belong to an existing novel.

  Deleting a novel should automatically delete its
  chapters because chapters cannot exist independently
  of their parent story.
*/

-- ============================================================
-- CHAPTERS → NOVELS
-- ============================================================

-- The orphan check was completed before applying this
-- constraint and returned zero orphan chapters.

ALTER TABLE public.chapters
ADD CONSTRAINT chapters_novel_id_fkey
FOREIGN KEY (novel_id)
REFERENCES public.novels(id)
ON DELETE CASCADE;


-- ============================================================
-- Helpful index
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_chapters_novel_id
ON public.chapters(novel_id);