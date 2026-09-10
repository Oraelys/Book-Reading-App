/*
 * ============================================================
 * IMPORTED BOOK ORIGIN
 * ============================================================
 *
 * Distinguishes author-created stories from books introduced
 * by administrators.
 *
 * Author-created:
 *   novels.created_by = author
 *   novels.content_origin = 'author_created'
 *
 * Admin-imported:
 *   novels.created_by = NULL
 *   novels.content_origin = 'admin_imported'
 *   novel_imports records the administrator and credited author.
 */

/*
 * ------------------------------------------------------------
 * NOVELS
 * ------------------------------------------------------------
 */

ALTER TABLE public.novels
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.novels
  ADD COLUMN IF NOT EXISTS content_origin text
  NOT NULL DEFAULT 'author_created';

ALTER TABLE public.novels
  DROP CONSTRAINT IF EXISTS novels_content_origin_check;

ALTER TABLE public.novels
  ADD CONSTRAINT novels_content_origin_check
  CHECK (
    content_origin IN (
      'author_created',
      'admin_imported'
    )
  );

CREATE INDEX IF NOT EXISTS idx_novels_content_origin
  ON public.novels(content_origin);


/*
 * ------------------------------------------------------------
 * NOVEL IMPORTS
 * ------------------------------------------------------------
 *
 * One record per admin-imported novel.
 *
 * credited_author_id is optional because an imported book
 * may belong to an external author who has no Inkwell account.
 */

CREATE TABLE IF NOT EXISTS public.novel_imports (
  novel_id uuid PRIMARY KEY
    REFERENCES public.novels(id)
    ON DELETE CASCADE,

  imported_by uuid NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE RESTRICT,

  credited_author_id uuid NULL
    REFERENCES public.profiles(id)
    ON DELETE SET NULL,

  credited_author_name text NOT NULL,

  original_file_name text NOT NULL,

  file_type text NOT NULL,

  imported_at timestamptz NOT NULL DEFAULT now(),

  created_at timestamptz NOT NULL DEFAULT now(),

  updated_at timestamptz NOT NULL DEFAULT now()
);


/*
 * Useful indexes.
 */

CREATE INDEX IF NOT EXISTS idx_novel_imports_imported_by
  ON public.novel_imports(imported_by);

CREATE INDEX IF NOT EXISTS idx_novel_imports_credited_author
  ON public.novel_imports(credited_author_id);


/*
 * ------------------------------------------------------------
 * SECURITY
 * ------------------------------------------------------------
 *
 * Admin import operations are performed by the backend using
 * the service-role database connection.
 *
 * Do not expose direct client INSERT/UPDATE/DELETE access.
 */

ALTER TABLE public.novel_imports
  ENABLE ROW LEVEL SECURITY;

REVOKE ALL
ON TABLE public.novel_imports
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.novel_imports
TO service_role;