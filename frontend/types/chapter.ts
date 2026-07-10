// types/chapter.ts
export type ChapterStatus = 'draft' | 'published';

export interface Chapter {
  id: string;
  novel_id: string;
  title: string;
  content: string;
  chapter_number: number;
  status: ChapterStatus;
  word_count: number;
  published_at: string | null;
  updated_at: string;
  created_at?: string;
}