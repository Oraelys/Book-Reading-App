/*
  # Update Book Reading App Schema

  ## Changes
  1. Add missing columns to books table:
     - `file_size` (bigint) - Size of the book file in bytes
     - `mime_type` (text) - File type (pdf, epub, etc.)
     - `created_at` (timestamptz) - When the book was added
  
  2. Add missing columns to reading_progress table:
     - `last_read_at` (timestamptz) - Timestamp of last reading session
     - `created_at` (timestamptz) - When tracking started

  ## Security
  RLS policies are already enabled on both tables
*/

-- Add missing columns to books table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'file_size'
  ) THEN
    ALTER TABLE books ADD COLUMN file_size bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'mime_type'
  ) THEN
    ALTER TABLE books ADD COLUMN mime_type text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'books' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE books ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add missing columns to reading_progress table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reading_progress' AND column_name = 'last_read_at'
  ) THEN
    ALTER TABLE reading_progress ADD COLUMN last_read_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reading_progress' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE reading_progress ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_books_user_created ON books(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_progress_last_read ON reading_progress(user_id, last_read_at DESC);
