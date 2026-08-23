export class UpdateSeriesDto {
  title?: string;

  description?: string;

  readingMode?: 'sequential' | 'collection';

  coverMediaId?: string;
}