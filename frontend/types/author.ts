// components/author/types.ts

export interface Tag {
  id: string;
  name: string;
  slug: string;
  category: string;
}

export interface Story {
  id: string;
  title: string;
  cover_image_url: string;
  tags: Tag[];
  total_chapters: number;
  published_chapters: number;
  views: number;
  followers: number;
  status: 'draft' | 'published' | 'processing' | 'rejected';
}

export interface PublishedChapter {
  id: string;
  novel_id: string;
  title: string;
  story_title: string;
  published_at: string;
  views: number;
  reads: number;
}

export interface AuthorStats {
  totalStories: number;
  totalChapters: number;
  totalViews: number;
}