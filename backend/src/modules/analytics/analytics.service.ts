import {
  Injectable,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

import { TrackEventDto } from './dto/track-event.dto';

@Injectable()
export class AnalyticsService {

  constructor(
    private readonly database: SupabaseService,
  ) {}

  /*
   * ======================================
   * Track Event
   * ======================================
   */

  async track(dto: TrackEventDto) {

    const supabase = this.database.getClient();

    await supabase
      .from('user_activity_logs')
      .insert({
        user_id: dto.userId,
        novel_id: dto.novelId,
        chapter_id: dto.chapterId,
        activity_type: dto.event,
        duration: dto.duration,
        metadata: dto.metadata,
      });

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

    return {
      success: true,
    };
  }

  /*
   * Reader Statistics
   */

  async readerStats(userId: string) {

    const { data } =
      await this.database
        .getClient()
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId);

    return {
      totalEvents: data?.length ?? 0,
      history: data ?? [],
    };
  }

  /*
   * Novel Statistics
   */

  async novelStats(novelId: string) {

    const { data: novel } =
      await this.database
        .getClient()
        .from('novels')
        .select('*')
        .eq('id', novelId)
        .single();

    return novel;
  }

  /*
   * Author Statistics
   */

  async authorStats(authorId: string) {

    const { data } =
      await this.database
        .getClient()
        .from('novels')
        .select('*')
        .eq('created_by', authorId);

    return {
      novels: data ?? [],
      totalStories: data?.length ?? 0,
    };
  }

  /*
   * ======================================
   * Internal Helpers
   * ======================================
   */

  async incrementPopularity(
    novelId: string,
    amount: number,
  ) {

    const supabase = this.database.getClient();

    const { data } = await supabase
      .from('novels')
      .select('popularity_score')
      .eq('id', novelId)
      .single();

    await supabase
      .from('novels')
      .update({
        popularity_score:
          (data?.popularity_score ?? 0) + amount,
        last_activity: new Date(),
      })
      .eq('id', novelId);
  }

  async incrementTrending(
    novelId: string,
    amount: number,
  ) {

    const supabase = this.database.getClient();

    const { data } = await supabase
      .from('novels')
      .select('trending_score')
      .eq('id', novelId)
      .single();

    await supabase
      .from('novels')
      .update({
        trending_score:
          (data?.trending_score ?? 0) + amount,
        last_activity: new Date(),
      })
      .eq('id', novelId);
  }
}