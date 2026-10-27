import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';
import { TrackEventDto } from './dto/track-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  /**
   * Internal, trusted event tracking.
   * Existing backend callers retain the ranking-score updates.
   */
  async track(
    dto: TrackEventDto,
    options: { updateScores?: boolean } = {
      updateScores: true,
    },
  ) {
    const supabase = this.database.getClient();

    const { error } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: dto.userId,
        novel_id: dto.novelId,
        chapter_id: dto.chapterId,
        activity_type: dto.event,
        duration: dto.duration,
        metadata: dto.metadata,
      });

    if (error) {
      throw new InternalServerErrorException(
        'Unable to record analytics event.',
      );
    }

    if (options.updateScores !== false) {
      switch (dto.event) {
        case 'chapter_opened':
          if (dto.novelId) {
            await this.incrementPopularity(dto.novelId, 1);
          }
          break;

        case 'chapter_completed':
          if (dto.novelId) {
            await this.incrementPopularity(dto.novelId, 5);
            await this.incrementTrending(dto.novelId, 3);
          }
          break;

        case 'novel_completed':
          if (dto.novelId) {
            await this.incrementPopularity(dto.novelId, 20);
            await this.incrementTrending(dto.novelId, 10);
          }
          break;

        case 'rating_added':
          if (dto.novelId) {
            await this.incrementPopularity(dto.novelId, 8);
          }
          break;

        case 'comment_created':
          if (dto.novelId) {
            await this.incrementTrending(dto.novelId, 4);
          }
          break;

        case 'purchase':
          if (dto.novelId) {
            await this.incrementPopularity(dto.novelId, 25);
          }
          break;
      }
    }

    return { success: true };
  }

  /**
   * Public HTTP tracking must not alter ranking scores.
   */
  async trackClientEvent(dto: TrackEventDto) {
    return this.track(dto, {
      updateScores: false,
    });
  }

  async readerStats(userId: string) {
    const { data, error } = await this.database
      .getClient()
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve reader analytics.',
      );
    }

    return {
      totalEvents: data?.length ?? 0,
      history: data ?? [],
    };
  }

  async novelStats(novelId: string) {
    const { data, error } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('id', novelId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve novel analytics.',
      );
    }

    return data;
  }

  async authorStats(authorId: string) {
    const { data, error } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('created_by', authorId);

    if (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve author analytics.',
      );
    }

    return {
      novels: data ?? [],
      totalStories: data?.length ?? 0,
    };
  }

  async incrementPopularity(
    novelId: string,
    amount: number,
  ) {
    const supabase = this.database.getClient();

    const { data, error } = await supabase
      .from('novels')
      .select('popularity_score')
      .eq('id', novelId)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve novel popularity.',
      );
    }

    const { error: updateError } = await supabase
      .from('novels')
      .update({
        popularity_score:
          (data?.popularity_score ?? 0) + amount,
        last_activity: new Date().toISOString(),
      })
      .eq('id', novelId);

    if (updateError) {
      throw new InternalServerErrorException(
        'Unable to update novel popularity.',
      );
    }
  }

  async incrementTrending(
    novelId: string,
    amount: number,
  ) {
    const supabase = this.database.getClient();

    const { data, error } = await supabase
      .from('novels')
      .select('trending_score')
      .eq('id', novelId)
      .single();

    if (error) {
      throw new InternalServerErrorException(
        'Unable to retrieve novel trending score.',
      );
    }

    const { error: updateError } = await supabase
      .from('novels')
      .update({
        trending_score:
          (data?.trending_score ?? 0) + amount,
        last_activity: new Date().toISOString(),
      })
      .eq('id', novelId);

    if (updateError) {
      throw new InternalServerErrorException(
        'Unable to update novel trending score.',
      );
    }
  }
}