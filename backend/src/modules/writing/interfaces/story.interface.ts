export interface Story {
  id: string;

  title: string;

  description: string | null;

  coverImage: string | null;

  authorId: string;

  visibility:
    | 'public'
    | 'private'
    | 'unlisted';

  status:
    | 'draft'
    | 'published';

  category: string | null;

  tags: string[];

  language: string | null;

  createdAt: Date;

  updatedAt: Date;
}