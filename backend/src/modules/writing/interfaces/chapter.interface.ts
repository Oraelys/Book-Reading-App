export interface Chapter {
  id: string;

  storyId: string;

  title: string;

  content: string;

  chapterNumber: number;

  wordCount: number;

  readingMinutes: number;

  status:
    | 'draft'
    | 'published';

  createdAt: Date;

  updatedAt: Date;
}