export interface Book {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  file_uri: string;
  total_pages: number;
  cover_image?: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  added_at: string;
  last_opened_at?: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  current_page: number;
  progress_percentage: number;
  last_read_at: string;
  created_at: string;
  updated_at: string;
}

export interface BookWithProgress extends Book {
  reading_progress?: ReadingProgress;
}
