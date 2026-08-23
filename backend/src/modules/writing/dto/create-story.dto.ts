export class CreateStoryDto {
  title!: string;

  description?: string;

  coverImage?: string;

  authorId!: string;

  category!: string;

  visibility!:
    | 'public'
    | 'private'
    | 'unlisted';
}