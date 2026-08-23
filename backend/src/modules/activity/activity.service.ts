import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';
import { EventsService } from '../events/events.service';
import { TrainingService } from '../training/training.service';

import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    private readonly database: SupabaseService,
    private readonly events: EventsService,
    private readonly training: TrainingService,
  ) {}

  /*
   * =====================================
   * Track Activity
   * =====================================
   */

  async track(dto: CreateActivityDto) {
    const supabase = this.database.getClient();

    const { data, error } = await supabase
      .from('user_activity_logs')
      .insert({
        user_id: dto.userId,
        activity_type: dto.type,
        novel_id: dto.novelId,
        chapter_id: dto.chapterId,
        metadata: dto.metadata,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    /*
     * Analytics + Notifications
     */

    await this.events.dispatch({
      type: dto.type,
      userId: dto.userId,
      novelId: dto.novelId,
      chapterId: dto.chapterId,
      metadata: dto.metadata,
    });

    /*
     * Queue AI Training
     */

    if (dto.userId) {
      await this.training.enqueue(dto.userId);
    }

    /*
     * Future integrations
     */

    // recommendation refresh
    // achievement engine
    // moderation pipeline
    // ranking updates

    return data;
  }

  /*
   * =====================================
   * User Timeline
   * =====================================
   */

  async history(userId: string) {
    const { data, error } = await this.database
      .getClient()
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return data;
  }

  /*
   * =====================================
   * Novel Activity
   * =====================================
   */

  async novelHistory(novelId: string) {
    const { data, error } = await this.database
      .getClient()
      .from('user_activity_logs')
      .select('*')
      .eq('novel_id', novelId)
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return data;
  }

  /*
   * =====================================
   * Delete Activity
   * =====================================
   */

  async remove(id: string) {
    const { error } = await this.database
      .getClient()
      .from('user_activity_logs')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  }
}