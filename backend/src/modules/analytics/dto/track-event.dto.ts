import {
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export const ANALYTICS_EVENTS = [
  'novel_opened',
  'chapter_opened',
  'chapter_completed',
  'novel_completed',
  'bookmark_added',
  'bookmark_removed',
  'comment_created',
  'rating_added',
  'rating_updated',
  'series_followed',
  'author_followed',
  'share',
  'search',
  'download',
  'purchase',
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

export class TrackEventDto {
  /**
   * Accepted for compatibility with existing internal callers.
   * The HTTP controller always replaces it with the authenticated user ID.
   */
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  novelId?: string;

  @IsOptional()
  @IsUUID()
  chapterId?: string;

  @IsIn(ANALYTICS_EVENTS)
  event!: AnalyticsEvent;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}