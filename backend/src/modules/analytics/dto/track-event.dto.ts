export class TrackEventDto {
  userId!: string;

  novelId?: string;

  chapterId?: string;

  event!: AnalyticsEvent;

  duration?: number;

  metadata?: Record<string, any>;
}

export type AnalyticsEvent =
  | 'novel_opened'
  | 'chapter_opened'
  | 'chapter_completed'
  | 'novel_completed'
  | 'bookmark_added'
  | 'bookmark_removed'
  | 'comment_created'
  | 'rating_added'
  | 'rating_updated'
  | 'series_followed'
  | 'author_followed'
  | 'share'
  | 'search'
  | 'download'
  | 'purchase';