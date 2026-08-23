import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';
import { ChapterMetricsService } from './chapter-metrics.service';

@Injectable()
export class ChapterPublishService {
  constructor(
    private readonly database: SupabaseService,
    private readonly metrics: ChapterMetricsService,
  ) {}

  /**
   * Publish a chapter.
   *
   * A chapter must:
   * - exist
   * - contain content
   * - belong to the requested novel when novelId is supplied
   */
  async publish(
    chapterId: string,
    novelId?: string,
  ) {
    const client = this.database.getClient();

    const { data: chapter, error } = await client
      .from('chapters')
      .select(
        `
        id,
        novel_id,
        title,
        content,
        word_count,
        estimated_read_time,
        is_published,
        status
        `,
      )
      .eq('id', chapterId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!chapter) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    if (
      novelId &&
      chapter.novel_id !== novelId
    ) {
      throw new BadRequestException(
        'Chapter does not belong to this novel.',
      );
    }

    const content =
      typeof chapter.content === 'string'
        ? chapter.content.trim()
        : '';

    if (!content) {
      throw new BadRequestException(
        'A chapter cannot be published without content.',
      );
    }

    const stats =
      this.metrics.calculate(content);

    const now = new Date().toISOString();

    const { data, error: updateError } =
      await client
        .from('chapters')
        .update({
          word_count: stats.wordCount,

          estimated_read_time:
            stats.estimatedReadingMinutes,

          is_published: true,

          published_at: now,

          status: 'published',

          last_saved_at: now,

          updated_at: now,
        })
        .eq('id', chapterId)
        .select()
        .single();

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      chapter: data,
    };
  }

  /**
   * Unpublish a chapter.
   */
  async unpublish(
    chapterId: string,
    novelId?: string,
  ) {
    const client = this.database.getClient();

    const { data: chapter, error } =
      await client
        .from('chapters')
        .select(
          `
          id,
          novel_id,
          is_published
          `,
        )
        .eq('id', chapterId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!chapter) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    if (
      novelId &&
      chapter.novel_id !== novelId
    ) {
      throw new BadRequestException(
        'Chapter does not belong to this novel.',
      );
    }

    const now = new Date().toISOString();

    const { data, error: updateError } =
      await client
        .from('chapters')
        .update({
          is_published: false,

          unpublished_at: now,

          status: 'draft',

          updated_at: now,
        })
        .eq('id', chapterId)
        .select()
        .single();

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      chapter: data,
    };
  }

  /**
   * Return publishing status.
   */
  async status(
    chapterId: string,
  ) {
    const client = this.database.getClient();

    const { data, error } =
      await client
        .from('chapters')
        .select(
          `
          id,
          novel_id,
          title,
          is_published,
          published_at,
          unpublished_at,
          status
          `,
        )
        .eq('id', chapterId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    return data;
  }
}