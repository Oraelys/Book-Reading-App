export class CreateActivityDto {

  userId!: string;

  type!: string;

  novelId?: string;

  chapterId?: string;

  seriesId?: string;

  authorId?: string;

  metadata?: Record<string, any>;

}