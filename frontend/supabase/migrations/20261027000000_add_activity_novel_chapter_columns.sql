/*
  Add novel and chapter references to user activity logs.

  The backend's ActivityService and AnalyticsService write these
  optional references, and the admin dashboard reads them to show
  recent activity. Keep existing activity records valid by allowing
  both columns to be NULL.
*/

ALTER TABLE public.user_activity_logs
  ADD COLUMN IF NOT EXISTS novel_id uuid NULL,
  ADD COLUMN IF NOT EXISTS chapter_id uuid NULL;

-- Keep activity records when a novel or chapter is deleted.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_activity_logs_novel_id_fkey'
      AND conrelid = 'public.user_activity_logs'::regclass
  ) THEN
    ALTER TABLE public.user_activity_logs
      ADD CONSTRAINT user_activity_logs_novel_id_fkey
      FOREIGN KEY (novel_id)
      REFERENCES public.novels(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_activity_logs_chapter_id_fkey'
      AND conrelid = 'public.user_activity_logs'::regclass
  ) THEN
    ALTER TABLE public.user_activity_logs
      ADD CONSTRAINT user_activity_logs_chapter_id_fkey
      FOREIGN KEY (chapter_id)
      REFERENCES public.chapters(id)
      ON DELETE SET NULL;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_novel_created_at
  ON public.user_activity_logs (novel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_chapter_created_at
  ON public.user_activity_logs (chapter_id, created_at DESC);
