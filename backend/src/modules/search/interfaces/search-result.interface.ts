export interface SearchResult {

  id: string;

  type:
    | 'novel'
    | 'chapter'
    | 'author'
    | 'series';

  title: string;

  subtitle?: string;

  score?: number;

}