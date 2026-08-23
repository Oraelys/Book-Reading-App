export class CreateSeriesDto {
  title!: string;

  description?: string;

  creatorId!: string;

  readingMode?: 'sequential' | 'collection';

  coverMediaId?: string;
}